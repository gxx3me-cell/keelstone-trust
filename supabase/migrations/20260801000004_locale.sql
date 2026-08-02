-- Preferred language, per investor.
--
-- Stored on the profile so the choice follows the user between devices.
-- The browser also keeps it in localStorage for signed-out visitors; the
-- profile is the source of truth once signed in.
--
-- No check constraint on the value: the supported set lives in the frontend
-- (src/i18n/index.jsx) and will grow. An unrecognised code simply falls back
-- to English at render time, which is safer than a failed write.

alter table public.profiles
  add column if not exists locale text not null default 'en';

comment on column public.profiles.locale is
  'BCP-47 base language code (en, es, fr, …). Falls back to English if unsupported.';

-- The existing "own profile updatable" policy already covers this column, and
-- guard_profile_privileges() only raises on `role` and `kyc_status` — so an
-- investor may freely change their own locale, which is the intent.
