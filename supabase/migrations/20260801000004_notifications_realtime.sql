-- Realtime delivery for the admin notification feed.
--
-- subscribeToNotifications() in src/lib/notifications.js listens for INSERTs on
-- public.notifications. Without the table in the supabase_realtime publication
-- the channel subscribes successfully but never receives anything — a silent
-- failure that looks like "the feed just doesn't update".
--
-- Postgres changes are filtered by RLS, and the only SELECT policy on
-- notifications requires private.is_admin(), so non-admins receive nothing even
-- though they may subscribe.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
