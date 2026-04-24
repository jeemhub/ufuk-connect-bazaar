
-- Roles enum
create type public.app_role as enum ('admin', 'customer');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles: users read own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Profiles: users update own" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "Profiles: users insert own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Roles: user sees own" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "Roles: admin sees all" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Roles: admin manages" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Profile admin read
create policy "Profiles: admin read all" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Login activity
create table public.login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  event text not null,
  success boolean not null default true,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.login_activity enable row level security;

create policy "Login: user sees own" on public.login_activity
  for select to authenticated using (user_id = auth.uid());
create policy "Login: admin sees all" on public.login_activity
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Login: anyone insert own" on public.login_activity
  for insert to anon, authenticated with check (true);

-- Quote requests
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  company text,
  product_id text,
  product_name text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.quote_requests enable row level security;

create policy "Quotes: anyone can submit" on public.quote_requests
  for insert to anon, authenticated with check (true);
create policy "Quotes: admin reads" on public.quote_requests
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Quotes: admin updates" on public.quote_requests
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + customer role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'phone', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
