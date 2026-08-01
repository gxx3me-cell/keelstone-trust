-- KYC submissions
--
-- Identity documents are NOT stored in this table. They live in a private
-- Storage bucket and this table holds only the object paths. Storing scans of
-- passports as base64 inside a JSON column would put them in every row read,
-- every backup, and every log line that touches the record.
--
-- profiles.kyc_status stays the single source of truth for "is this investor
-- verified" — a trigger keeps it in step with the latest submission here.

create table public.kyc_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  status           text not null default 'submitted'
                     check (status in ('submitted','approved','rejected')),
  full_name        text not null,
  date_of_birth    date not null,
  country          text not null,
  address          text not null,
  id_type          text not null
                     check (id_type in ('passport','drivers_license','national_id')),
  id_number        text not null,
  -- Storage object paths, e.g. 'kyc/<user_id>/id_front.jpg'
  doc_id_front     text,
  doc_id_back      text,
  doc_selfie       text,
  submitted_at     timestamptz not null default now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid references auth.users(id) on delete set null,
  rejection_reason text,
  created_at       timestamptz not null default now()
);

create index kyc_user_idx        on public.kyc_submissions (user_id, submitted_at desc);
create index kyc_status_idx      on public.kyc_submissions (status, submitted_at desc);
create index kyc_reviewed_by_idx on public.kyc_submissions (reviewed_by);

alter table public.kyc_submissions enable row level security;

-- Investors see and file their own submissions; only admins may review.
create policy "own kyc readable"
  on public.kyc_submissions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "investors file own kyc"
  on public.kyc_submissions for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'submitted'
    and reviewed_by is null
    and reviewed_at is null
    and rejection_reason is null
  );

create policy "admins read all kyc"
  on public.kyc_submissions for select
  to authenticated
  using ((select private.is_admin()));

create policy "admins review kyc"
  on public.kyc_submissions for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Mirror the newest submission onto profiles.kyc_status so the dashboard can
-- read one column instead of joining. SECURITY DEFINER because an investor
-- inserting their own submission has no rights to update profiles.kyc_status
-- (the escalation guard blocks exactly that).
create or replace function public.sync_kyc_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set kyc_status = case new.status
                     when 'submitted' then 'pending'
                     when 'approved'  then 'approved'
                     when 'rejected'  then 'rejected'
                   end
  where id = new.user_id;
  return new;
end;
$$;

create trigger kyc_sync_profile
  after insert or update of status on public.kyc_submissions
  for each row execute function public.sync_kyc_status();

-- ─────────────────────────────────────────────────────────────
-- Private Storage bucket for the documents themselves.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-documents', 'kyc-documents', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Investors may upload only under their own user-id prefix, and may never
-- overwrite or delete once submitted. Admins can read everything for review.
create policy "investor uploads own kyc docs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "investor reads own kyc docs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "admin reads all kyc docs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'kyc-documents' and (select private.is_admin()));
