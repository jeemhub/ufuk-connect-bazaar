create table if not exists public.admin_preferences (
  user_id uuid primary key,
  glass_enabled boolean not null default false,
  glass_intensity text not null default 'medium' check (glass_intensity in ('light','medium','strong')),
  accent_color text not null default 'blue' check (accent_color in ('blue','indigo','violet','rose','red','orange','amber','emerald','teal','cyan','slate')),
  dark_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.admin_preferences enable row level security;

drop policy if exists "AdminPrefs: own read" on public.admin_preferences;
create policy "AdminPrefs: own read" on public.admin_preferences
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "AdminPrefs: own insert" on public.admin_preferences;
create policy "AdminPrefs: own insert" on public.admin_preferences
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "AdminPrefs: own update" on public.admin_preferences;
create policy "AdminPrefs: own update" on public.admin_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists trg_admin_prefs_updated_at on public.admin_preferences;
create trigger trg_admin_prefs_updated_at before update on public.admin_preferences
  for each row execute function public.set_updated_at();