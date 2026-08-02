// KYC (Know Your Customer) verification.
//
// Optional by design — nothing in the app is gated on it. It exists so the
// platform looks and behaves like a regulated investment service, and so an
// admin can review submissions.
//
// Storage: submissions live in `kyc_submissions`; the identity documents
// themselves go to the private `kyc-documents` Storage bucket and only their
// object paths are stored in the row. Documents are never held in the database
// — a passport scan in a JSON column ends up in every backup and log line.
//
// profiles.kyc_status mirrors the latest submission via a trigger, so the
// dashboard reads one column instead of joining.

import { supabase } from './supabase'

// Keys match profiles.kyc_status in the database.
export const KYC_STATUS = {
  not_started: {
    label: 'Not verified',
    tone: 'neutral',
    blurb: 'Verify your identity to unlock higher limits and faster withdrawals.',
  },
  pending: {
    label: 'Under review',
    tone: 'warn',
    blurb: 'Your documents are being reviewed. This usually takes 1–2 business days.',
  },
  approved: {
    label: 'Verified',
    tone: 'gain',
    blurb: 'Your identity has been verified. Your account is fully activated.',
  },
  rejected: {
    label: 'Action needed',
    tone: 'loss',
    blurb: 'We could not verify your documents. Please review the notes and resubmit.',
  },
}

export const ID_TYPES = [
  { value: 'passport', label: 'Passport', hint: 'Photo page' },
  { value: 'drivers_license', label: "Driver's licence", hint: 'Front and back' },
  { value: 'national_id', label: 'National ID card', hint: 'Front and back' },
]

// Two-sided documents need a back image; a passport does not.
export const needsBackImage = (idType) => idType === 'drivers_license' || idType === 'national_id'

// Status now lives on the profile row (kept in sync by a trigger), so these
// take the profile from useAuth() rather than the auth user.
export const getKycStatus = (profile) => profile?.kyc_status || 'not_started'
export const isKycVerified = (profile) => getKycStatus(profile) === 'approved'

/**
 * The signed-in investor's most recent submission, or null.
 *
 * Scoped to the caller explicitly. Admins can read every submission (they
 * review them), so without this filter an admin's own KYC panel would show
 * another investor's identity documents.
 */
export async function getMyKycSubmission() {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('kyc_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/* ── image handling ─────────────────────────────────────── */

const MAX_DIMENSION = 1400   // px on the long edge
const JPEG_QUALITY = 0.72
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024   // 8MB before compression

/**
 * Downscale + re-encode an image file to a JPEG data URL, so a 5MB phone photo
 * becomes a few hundred KB. Rejects non-images and oversized files.
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'))
    if (!file.type.startsWith('image/')) return reject(new Error('Please upload an image (JPG or PNG).'))
    if (file.size > MAX_UPLOAD_BYTES) return reject(new Error('That image is larger than 8MB. Please choose a smaller one.'))

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file does not look like a valid image.'))
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/* ── validation ─────────────────────────────────────────── */

export function validateKyc(form) {
  const errors = {}
  if (!form.full_name?.trim()) errors.full_name = 'Enter your full legal name.'
  if (!form.date_of_birth) {
    errors.date_of_birth = 'Enter your date of birth.'
  } else {
    const dob = new Date(form.date_of_birth)
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)
    if (Number.isNaN(age)) errors.date_of_birth = 'That date is not valid.'
    else if (age < 18) errors.date_of_birth = 'You must be at least 18 years old.'
    else if (age > 120) errors.date_of_birth = 'Please check your date of birth.'
  }
  if (!form.country?.trim()) errors.country = 'Select your country of residence.'
  if (!form.address?.trim()) errors.address = 'Enter your residential address.'
  if (!form.id_type) errors.id_type = 'Choose a document type.'
  if (!form.id_number?.trim()) errors.id_number = 'Enter the document number.'
  if (!form.documents?.id_front) errors.id_front = 'Upload the front of your document.'
  if (needsBackImage(form.id_type) && !form.documents?.id_back) errors.id_back = 'Upload the back of your document.'
  if (!form.documents?.selfie) errors.selfie = 'Upload a selfie holding your document.'
  return errors
}

/* ── submit / review ────────────────────────────────────── */

// A data URL from compressImage() → a Blob we can upload.
function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(',')
  const mime = /:(.*?);/.exec(meta)?.[1] || 'image/jpeg'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/**
 * Investor submits (or resubmits) their KYC application.
 *
 * Documents go to the private `kyc-documents` bucket under the user's own id
 * prefix — the Storage policy refuses any other path — and only the resulting
 * object paths are written to the row.
 */
export async function submitKyc(form) {
  const errors = validateKyc(form)
  if (Object.keys(errors).length) {
    const err = new Error('Please complete every required field.')
    err.fieldErrors = errors
    throw err
  }

  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) throw new Error('You must be signed in.')

  const stamp = Date.now()
  const upload = async (key, dataUrl) => {
    if (!dataUrl) return null
    const path = `${user.id}/${stamp}-${key}.jpg`
    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, dataUrlToBlob(dataUrl), { contentType: 'image/jpeg', upsert: false })
    if (error) throw new Error(`Could not upload your ${key.replace(/_/g, ' ')}: ${error.message}`)
    return path
  }

  const [doc_id_front, doc_id_back, doc_selfie] = await Promise.all([
    upload('id_front', form.documents.id_front),
    upload('id_back', form.documents.id_back),
    upload('selfie', form.documents.selfie),
  ])

  const { data, error } = await supabase
    .from('kyc_submissions')
    .insert({
      user_id: user.id,
      status: 'submitted',
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth,
      country: form.country.trim(),
      address: form.address.trim(),
      id_type: form.id_type,
      id_number: form.id_number.trim(),
      doc_id_front, doc_id_back, doc_selfie,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // The kyc_sync_profile trigger has already set profiles.kyc_status='pending'.
  return data
}

/** Admin: every submission awaiting or past review. RLS restricts to admins. */
export async function listKycSubmissions() {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select('*')
    .order('submitted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Signed URL for a stored document. The bucket is private, so this is the only
 * way to view one — links expire after `expiresIn` seconds.
 */
export async function getDocumentUrl(path, expiresIn = 300) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(path, expiresIn)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

/**
 * Admin decision. The RLS policy allows only admins to update a submission,
 * and the kyc_sync_profile trigger mirrors the result onto profiles.kyc_status.
 */
export async function reviewKyc({ submissionId, action, reason = '' }) {
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('kyc_submissions')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      rejection_reason: action === 'approve' ? null : reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth?.user?.id ?? null,
    })
    .eq('id', submissionId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland', 'Germany',
  'France', 'Spain', 'Portugal', 'Italy', 'Netherlands', 'Belgium', 'Switzerland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Austria', 'Singapore',
  'Hong Kong', 'Japan', 'South Korea', 'United Arab Emirates', 'Saudi Arabia',
  'Qatar', 'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Egypt', 'India',
  'Brazil', 'Mexico', 'Argentina', 'Chile', 'New Zealand', 'Other',
]
