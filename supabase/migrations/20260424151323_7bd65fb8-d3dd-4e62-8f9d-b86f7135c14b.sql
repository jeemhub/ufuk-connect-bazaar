
-- Fix function search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Tighten login_activity insert: must match auth.uid() if authenticated, or null user_id if anonymous
drop policy if exists "Login: anyone insert own" on public.login_activity;
create policy "Login: insert own or anon" on public.login_activity
  for insert to anon, authenticated
  with check (
    (auth.uid() is null and user_id is null) or
    (auth.uid() is not null and user_id = auth.uid())
  );

-- Tighten quote_requests insert with basic length validation
drop policy if exists "Quotes: anyone can submit" on public.quote_requests;
create policy "Quotes: anyone can submit" on public.quote_requests
  for insert to anon, authenticated
  with check (
    char_length(full_name) between 2 and 120
    and char_length(phone) between 6 and 30
    and (message is null or char_length(message) <= 2000)
  );
