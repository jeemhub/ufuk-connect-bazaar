-- Maintenance inventory and immutable movement history.
alter table public.sales_permissions
  add column if not exists can_manage_maintenance boolean not null default false;

create or replace function public.has_sales_perm(_user_id uuid, _perm text)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare r public.sales_permissions%rowtype;
begin
  if _user_id is null or not public.has_role(_user_id, 'sales'::public.app_role) then return false; end if;
  select * into r from public.sales_permissions where user_id = _user_id;
  if not found then return false; end if;
  return case _perm
    when 'can_manage_products' then r.can_manage_products
    when 'can_manage_categories' then r.can_manage_categories
    when 'can_manage_brands' then r.can_manage_brands
    when 'can_manage_blog' then r.can_manage_blog
    when 'can_manage_projects' then r.can_manage_projects
    when 'can_manage_orders' then r.can_manage_orders
    when 'can_manage_quotes' then r.can_manage_quotes
    when 'can_manage_customer_balances' then r.can_manage_customer_balances
    when 'can_manage_maintenance' then r.can_manage_maintenance
    else false
  end;
end;
$$;

-- Replace the previous signature so PostgREST has one unambiguous RPC.
drop function if exists public.admin_set_sales_permissions(
  uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean
);
create or replace function public.admin_set_sales_permissions(
  _user_id uuid, _is_sales boolean,
  _can_manage_products boolean default false, _can_manage_categories boolean default false,
  _can_manage_brands boolean default false, _can_manage_blog boolean default false,
  _can_manage_projects boolean default false, _can_manage_orders boolean default false,
  _can_manage_quotes boolean default false, _can_manage_customer_balances boolean default false,
  _can_manage_maintenance boolean default false
)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception using errcode = '42501', message = 'admin only';
  end if;
  if public.has_role(_user_id, 'admin'::public.app_role) then
    raise exception using errcode = '42501', message = 'cannot modify another admin';
  end if;
  if _is_sales then
    insert into public.user_roles(user_id, role) values (_user_id, 'sales'::public.app_role)
    on conflict (user_id, role) do nothing;
    insert into public.sales_permissions(
      user_id, can_manage_products, can_manage_categories, can_manage_brands,
      can_manage_blog, can_manage_projects, can_manage_orders, can_manage_quotes,
      can_manage_customer_balances, can_manage_maintenance, updated_at
    ) values (
      _user_id, _can_manage_products, _can_manage_categories, _can_manage_brands,
      _can_manage_blog, _can_manage_projects, _can_manage_orders, _can_manage_quotes,
      _can_manage_customer_balances, _can_manage_maintenance, now()
    ) on conflict (user_id) do update set
      can_manage_products = excluded.can_manage_products,
      can_manage_categories = excluded.can_manage_categories,
      can_manage_brands = excluded.can_manage_brands,
      can_manage_blog = excluded.can_manage_blog,
      can_manage_projects = excluded.can_manage_projects,
      can_manage_orders = excluded.can_manage_orders,
      can_manage_quotes = excluded.can_manage_quotes,
      can_manage_customer_balances = excluded.can_manage_customer_balances,
      can_manage_maintenance = excluded.can_manage_maintenance,
      updated_at = now();
  else
    delete from public.user_roles where user_id = _user_id and role = 'sales'::public.app_role;
    delete from public.sales_permissions where user_id = _user_id;
  end if;
end;
$$;

revoke all on function public.admin_set_sales_permissions(uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.admin_set_sales_permissions(uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean) to authenticated;

create or replace function public.can_manage_maintenance(_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$ select _user_id is not null and (
  public.has_role(_user_id, 'admin'::public.app_role)
  or public.has_sales_perm(_user_id, 'can_manage_maintenance')
) $$;
revoke all on function public.can_manage_maintenance(uuid) from public, anon;
grant execute on function public.can_manage_maintenance(uuid) to authenticated;

create table if not exists public.maintenance_devices (
  id uuid primary key default gen_random_uuid(),
  device_name text not null check (char_length(btrim(device_name)) between 1 and 200),
  serial_number text not null check (char_length(btrim(serial_number)) between 1 and 200),
  owner_name text not null check (char_length(btrim(owner_name)) between 1 and 200),
  owner_phone text not null check (char_length(btrim(owner_phone)) between 1 and 50),
  location text not null default 'office' check (location in ('office','warehouse','baghdad','custom','customer')),
  custom_location text,
  status text not null default 'faulty' check (status in ('faulty','in_repair','repaired','delivered')),
  notes text not null default '',
  received_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint maintenance_custom_location check (location <> 'custom' or char_length(btrim(coalesce(custom_location,''))) between 1 and 100)
);
create unique index if not exists maintenance_devices_serial_unique on public.maintenance_devices (lower(btrim(serial_number)));
create index if not exists maintenance_devices_received_idx on public.maintenance_devices (received_at desc);
create index if not exists maintenance_devices_status_location_idx on public.maintenance_devices (status, location);

create table if not exists public.maintenance_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.maintenance_devices(id) on delete cascade,
  event_type text not null check (event_type in ('received','transfer','returned','repair','delivered','note')),
  location text not null check (location in ('office','warehouse','baghdad','custom','customer')),
  custom_location text,
  status text not null check (status in ('faulty','in_repair','repaired','delivered')),
  note text not null default '',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id),
  constraint maintenance_event_custom_location check (location <> 'custom' or char_length(btrim(coalesce(custom_location,''))) between 1 and 100)
);
create index if not exists maintenance_events_timeline_idx on public.maintenance_events (device_id, occurred_at, created_at);

alter table public.maintenance_devices enable row level security;
alter table public.maintenance_events enable row level security;
drop policy if exists "Maintenance staff read devices" on public.maintenance_devices;
drop policy if exists "Maintenance staff insert devices" on public.maintenance_devices;
drop policy if exists "Maintenance staff read timeline" on public.maintenance_events;
create policy "Maintenance staff read devices" on public.maintenance_devices for select to authenticated using (public.can_manage_maintenance(auth.uid()));
create policy "Maintenance staff insert devices" on public.maintenance_devices for insert to authenticated with check (public.can_manage_maintenance(auth.uid()));
create policy "Maintenance staff read timeline" on public.maintenance_events for select to authenticated using (public.can_manage_maintenance(auth.uid()));
grant select, insert on public.maintenance_devices to authenticated;
grant select on public.maintenance_events to authenticated;

create or replace function public.maintenance_receive_device()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.maintenance_events(device_id, event_type, location, custom_location, status, note, occurred_at, created_by)
  values (new.id, 'received', new.location, new.custom_location, new.status, 'تم استلام الجهاز وتسجيله في قسم الصيانة', new.received_at, auth.uid());
  return new;
end;
$$;
drop trigger if exists maintenance_device_received on public.maintenance_devices;
create trigger maintenance_device_received after insert on public.maintenance_devices
for each row execute function public.maintenance_receive_device();

create or replace function public.maintenance_record_event(
  _device_id uuid, _event_type text, _location text, _custom_location text,
  _status text, _note text, _occurred_at timestamptz
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare event_id uuid; device_row public.maintenance_devices%rowtype; latest_time timestamptz;
begin
  if not public.can_manage_maintenance(auth.uid()) then raise exception using errcode = '42501', message = 'forbidden'; end if;
  select * into device_row from public.maintenance_devices where id = _device_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'device not found'; end if;
  select max(occurred_at) into latest_time from public.maintenance_events where device_id = _device_id;
  if _event_type not in ('transfer','returned','repair','delivered','note')
    or _location not in ('office','warehouse','baghdad','custom','customer')
    or _status not in ('faulty','in_repair','repaired','delivered')
    or (_status = 'delivered' and _location <> 'customer')
    or (_event_type = 'delivered' and (_location <> 'customer' or _status <> 'delivered'))
    or (_location = 'custom' and (char_length(btrim(coalesce(_custom_location,''))) not between 1 and 100))
    or _occurred_at is null or _occurred_at < device_row.received_at or _occurred_at < latest_time or _occurred_at > now() + interval '1 minute'
    or char_length(coalesce(_note,'')) > 2000 then
    raise exception using errcode = '22023', message = 'invalid maintenance event';
  end if;
  update public.maintenance_devices set location = _location,
    custom_location = case when _location = 'custom' then btrim(_custom_location) else null end,
    status = _status, updated_at = now() where id = _device_id;
  insert into public.maintenance_events(device_id,event_type,location,custom_location,status,note,occurred_at,created_by)
  values (_device_id,_event_type,_location,case when _location = 'custom' then btrim(_custom_location) else null end,
    _status,btrim(coalesce(_note,'')),_occurred_at,auth.uid()) returning id into event_id;
  return event_id;
end;
$$;
revoke all on function public.maintenance_record_event(uuid,text,text,text,text,text,timestamptz) from public, anon;
grant execute on function public.maintenance_record_event(uuid,text,text,text,text,text,timestamptz) to authenticated;

create or replace function public.maintenance_update_device(
  _device_id uuid, _device_name text, _serial_number text, _owner_name text,
  _owner_phone text, _notes text
)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.can_manage_maintenance(auth.uid()) then raise exception using errcode = '42501', message = 'forbidden'; end if;
  update public.maintenance_devices set device_name = btrim(_device_name), serial_number = btrim(_serial_number),
    owner_name = btrim(_owner_name), owner_phone = btrim(_owner_phone), notes = coalesce(_notes,''), updated_at = now()
  where id = _device_id;
  if not found then raise exception using errcode = 'P0002', message = 'device not found'; end if;
end;
$$;
revoke all on function public.maintenance_update_device(uuid,text,text,text,text,text) from public, anon;
grant execute on function public.maintenance_update_device(uuid,text,text,text,text,text) to authenticated;
