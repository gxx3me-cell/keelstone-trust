/* KYC verification — investor side.
   Optional: nothing in the app is gated on it. Lives in Account. */

import { useEffect, useState } from 'react'
import {
  KYC_STATUS, ID_TYPES, COUNTRIES, needsBackImage,
  getKycStatus, compressImage, submitKyc, validateKyc, getMyKycSubmission,
} from '../lib/kyc'
import {
  serif, Card, Button, Pill, Sheet, SheetHeader, Field, fieldStyle, Alert, Icon, shortDate,
} from './ui'

export default function KycSection({ user, profile, showToast, refresh }) {
  const [open, setOpen] = useState(false)
  // Status lives on the profile row; the submission detail is a separate
  // fetch because it is a different table now.
  const [kyc, setKyc] = useState(null)
  const status = getKycStatus(profile)
  const meta = KYC_STATUS[status] || KYC_STATUS.not_started

  useEffect(() => {
    let active = true
    if (status === 'not_started') { setKyc(null); return }
    getMyKycSubmission()
      .then((row) => { if (active) setKyc(row) })
      .catch(() => { if (active) setKyc(null) })
    return () => { active = false }
  }, [status])

  return (
    <>
      <Card style={{ marginTop: 12 }} pad={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px' }}>
          <div
            style={{
              width: 40, height: 40, flex: 'none', borderRadius: '50%',
              background: 'var(--primary-soft)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="shield" size={21} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Identity verification</span>
              <Pill tone={meta.tone}>{meta.label}</Pill>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.5 }}>{meta.blurb}</div>
          </div>
        </div>

        {status === 'rejected' && kyc?.rejection_reason && (
          <div style={{ padding: '0 18px 14px' }}>
            <Alert tone="loss">
              <div>
                <b>Reason:</b> {kyc.rejection_reason}
              </div>
            </Alert>
          </div>
        )}

        {status === 'pending' && kyc?.submitted_at && (
          <div style={{ padding: '0 18px 14px', fontSize: 12.5, color: 'var(--text-3)' }}>
            Submitted {shortDate(kyc.submitted_at)}
          </div>
        )}

        {status === 'approved' && kyc?.reviewed_at && (
          <div style={{ padding: '0 18px 14px', fontSize: 12.5, color: 'var(--text-3)' }}>
            Verified {shortDate(kyc.reviewed_at)}
          </div>
        )}

        {(status === 'not_started' || status === 'rejected') && (
          <div style={{ padding: '0 18px 18px' }}>
            <Button full onClick={() => setOpen(true)}>
              {status === 'rejected' ? 'Resubmit documents' : 'Verify my identity'}
            </Button>
          </div>
        )}
      </Card>

      {open && (
        <KycWizard
          profile={profile}
          existing={kyc}
          onClose={() => setOpen(false)}
          onDone={async () => {
            setOpen(false)
            await refresh?.()
            showToast?.('Documents submitted — we’ll review them shortly.')
          }}
        />
      )}
    </>
  )
}

/* ── wizard ─────────────────────────────────────────────── */

const STEPS = ['Your details', 'Your document', 'Confirm']

function KycWizard({ profile, existing, onClose, onDone }) {
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [form, setForm] = useState(() => ({
    full_name: existing?.full_name || profile?.full_name || '',
    date_of_birth: existing?.date_of_birth || '',
    country: existing?.country || '',
    address: existing?.address || '',
    id_type: existing?.id_type || 'passport',
    id_number: existing?.id_number || '',
    documents: { id_front: null, id_back: null, selfie: null },
  }))

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setFieldErrors((e) => ({ ...e, [k]: undefined }))
  }
  const setDoc = (k, v) => {
    setForm((f) => ({ ...f, documents: { ...f.documents, [k]: v } }))
    setFieldErrors((e) => ({ ...e, [k]: undefined }))
  }

  const stepValid = () => {
    const errs = validateKyc(form)
    const perStep = {
      1: ['full_name', 'date_of_birth', 'country', 'address'],
      2: ['id_type', 'id_number', 'id_front', 'id_back', 'selfie'],
      3: [],
    }[step]
    const hit = Object.fromEntries(Object.entries(errs).filter(([k]) => perStep.includes(k)))
    setFieldErrors(hit)
    return Object.keys(hit).length === 0
  }

  const next = () => {
    setError('')
    if (!stepValid()) return
    setStep((s) => s + 1)
  }

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      await submitKyc(form)
      onDone()
    } catch (e) {
      if (e.fieldErrors) {
        setFieldErrors(e.fieldErrors)
        // Send the user back to the step that actually has the problem.
        const first = Object.keys(e.fieldErrors)[0]
        setStep(['full_name', 'date_of_birth', 'country', 'address'].includes(first) ? 1 : 2)
      }
      setError(e?.message || 'Could not submit your documents. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} maxWidth={520} labelledBy="kyc-title">
      <SheetHeader id="kyc-title" title={STEPS[step - 1]} onClose={onClose} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }} aria-hidden="true">
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 999,
              background: i < step ? 'var(--primary)' : 'var(--surface-3)',
              transition: 'background .25s',
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: '0 0 18px', lineHeight: 1.6 }}>
            Enter your details exactly as they appear on your identity document.
          </p>
          <Field label="Full legal name" error={fieldErrors.full_name}>
            <input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Jane Doe" style={fieldStyle} autoComplete="name" />
          </Field>
          <Field label="Date of birth" hint="You must be 18 or older." error={fieldErrors.date_of_birth}>
            <input type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} style={fieldStyle} max={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Country of residence" error={fieldErrors.country}>
            <select value={form.country} onChange={(e) => set('country', e.target.value)} style={fieldStyle}>
              <option value="">Select a country…</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Residential address" error={fieldErrors.address}>
            <textarea
              value={form.address} onChange={(e) => set('address', e.target.value)}
              rows={3} placeholder="Street, city, postcode"
              style={{ ...fieldStyle, resize: 'vertical' }} autoComplete="street-address"
            />
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="Document type" error={fieldErrors.id_type}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ID_TYPES.map((t) => {
                const on = form.id_type === t.value
                return (
                  <button
                    key={t.value} type="button"
                    onClick={() => { set('id_type', t.value); setDoc('id_back', null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                      padding: '12px 14px', borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'inherit',
                      background: on ? 'var(--primary-soft)' : 'var(--surface-2)',
                      border: `2px solid ${on ? 'var(--primary)' : 'transparent'}`,
                    }}
                  >
                    <Icon name="doc" size={19} style={{ color: on ? 'var(--primary)' : 'var(--text-3)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.hint}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Document number" error={fieldErrors.id_number}>
            <input value={form.id_number} onChange={(e) => set('id_number', e.target.value)} placeholder="e.g. 123456789" style={fieldStyle} />
          </Field>

          <Upload
            label={needsBackImage(form.id_type) ? 'Front of document' : 'Photo page'}
            value={form.documents.id_front}
            onChange={(v) => setDoc('id_front', v)}
            error={fieldErrors.id_front}
          />
          {needsBackImage(form.id_type) && (
            <Upload
              label="Back of document"
              value={form.documents.id_back}
              onChange={(v) => setDoc('id_back', v)}
              error={fieldErrors.id_back}
            />
          )}
          <Upload
            label="Selfie holding your document"
            hint="Your face and the document must both be clearly readable."
            value={form.documents.selfie}
            onChange={(v) => setDoc('selfie', v)}
            error={fieldErrors.selfie}
          />
        </>
      )}

      {step === 3 && (
        <>
          <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Check everything is correct before submitting.
          </p>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: 16, marginBottom: 16 }}>
            {[
              ['Name', form.full_name],
              ['Date of birth', form.date_of_birth],
              ['Country', form.country],
              ['Address', form.address],
              ['Document', ID_TYPES.find((t) => t.value === form.id_type)?.label],
              ['Number', form.id_number],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '7px 0', fontSize: 13.5 }}>
                <span style={{ color: 'var(--text-3)', flex: 'none' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{v || '—'}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['id_front', 'id_back', 'selfie'].map((k) =>
              form.documents[k] ? (
                <img
                  key={k} src={form.documents[k]} alt=""
                  style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
                />
              ) : null,
            )}
          </div>

          <Alert tone="info">
            Your documents are used only to verify your identity and are never shared with third parties.
          </Alert>
        </>
      )}

      {error && <Alert tone="loss" style={{ marginTop: 14 }}>{error}</Alert>}

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        {step > 1 && (
          <Button variant="secondary" onClick={() => { setError(''); setStep(step - 1) }} style={{ flex: 'none' }}>
            Back
          </Button>
        )}
        <Button onClick={step === 3 ? submit : next} busy={busy} style={{ flex: 1 }}>
          {step === 3 ? (busy ? 'Submitting…' : 'Submit for review') : 'Continue'}
        </Button>
      </div>
    </Sheet>
  )
}

/* ── image upload tile ──────────────────────────────────── */

function Upload({ label, hint, value, onChange, error }) {
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''          // allow re-picking the same file
    if (!file) return
    setBusy(true)
    setLocalError('')
    try {
      onChange(await compressImage(file))
    } catch (err) {
      setLocalError(err?.message || 'Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  const shown = error || localError

  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>{label}</span>

      {value ? (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 10,
            borderRadius: 'var(--r)', background: 'var(--surface-2)', border: '1px solid var(--border)',
          }}
        >
          <img src={value} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--r-sm)', flex: 'none' }} />
          <div style={{ flex: 1, fontSize: 13, color: 'var(--gain)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={16} /> Uploaded
          </div>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Replace</Button>
        </div>
      ) : (
        <label
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '22px 16px', cursor: busy ? 'wait' : 'pointer',
            borderRadius: 'var(--r)', background: 'var(--surface-2)',
            border: `1.5px dashed ${shown ? 'var(--loss)' : 'var(--border-strong)'}`,
            color: 'var(--text-3)', textAlign: 'center',
          }}
        >
          <input type="file" accept="image/*" capture="environment" onChange={pick} style={{ display: 'none' }} disabled={busy} />
          <Icon name="camera" size={24} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
            {busy ? 'Processing…' : 'Tap to upload or take a photo'}
          </span>
          <span style={{ fontSize: 11.5 }}>JPG or PNG, up to 8MB</span>
        </label>
      )}

      {hint && !shown && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)', marginTop: 5 }}>{hint}</span>}
      {shown && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--loss)', fontWeight: 600, marginTop: 5 }}>{shown}</span>}
    </div>
  )
}
