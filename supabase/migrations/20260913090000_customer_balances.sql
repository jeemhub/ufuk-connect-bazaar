-- Customer balance imports, exact financial storage, and independent sales access.

alter table public.sales_permissions
  add column if not exists can_manage_customer_balances boolean not null default false;

create extension if not exists pg_trgm with schema extensions;

create or replace function public.has_sales_perm(_user_id uuid, _perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  r public.sales_permissions%rowtype;
begin
  if _user_id is null then return false; end if;
  if not public.has_role(_user_id, 'sales'::public.app_role) then return false; end if;
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
    else false
  end;
end;
$function$;

drop function if exists public.admin_set_sales_permissions(
  uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean
);

create function public.admin_set_sales_permissions(
  _user_id uuid,
  _is_sales boolean,
  _can_manage_products boolean default false,
  _can_manage_categories boolean default false,
  _can_manage_brands boolean default false,
  _can_manage_blog boolean default false,
  _can_manage_projects boolean default false,
  _can_manage_orders boolean default false,
  _can_manage_quotes boolean default false,
  _can_manage_customer_balances boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception using errcode = '42501', message = 'admin only';
  end if;
  if public.has_role(_user_id, 'admin'::public.app_role) then
    raise exception using errcode = '42501', message = 'cannot modify another admin';
  end if;

  if _is_sales then
    insert into public.user_roles(user_id, role)
    values (_user_id, 'sales'::public.app_role)
    on conflict (user_id, role) do nothing;

    insert into public.sales_permissions(
      user_id,
      can_manage_products,
      can_manage_categories,
      can_manage_brands,
      can_manage_blog,
      can_manage_projects,
      can_manage_orders,
      can_manage_quotes,
      can_manage_customer_balances,
      updated_at
    ) values (
      _user_id,
      _can_manage_products,
      _can_manage_categories,
      _can_manage_brands,
      _can_manage_blog,
      _can_manage_projects,
      _can_manage_orders,
      _can_manage_quotes,
      _can_manage_customer_balances,
      now()
    )
    on conflict (user_id) do update set
      can_manage_products = excluded.can_manage_products,
      can_manage_categories = excluded.can_manage_categories,
      can_manage_brands = excluded.can_manage_brands,
      can_manage_blog = excluded.can_manage_blog,
      can_manage_projects = excluded.can_manage_projects,
      can_manage_orders = excluded.can_manage_orders,
      can_manage_quotes = excluded.can_manage_quotes,
      can_manage_customer_balances = excluded.can_manage_customer_balances,
      updated_at = now();
  else
    delete from public.user_roles
    where user_id = _user_id and role = 'sales'::public.app_role;
    delete from public.sales_permissions where user_id = _user_id;
  end if;
end;
$function$;

revoke all on function public.admin_set_sales_permissions(
  uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean
) from public, anon;
grant execute on function public.admin_set_sales_permissions(
  uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean
) to authenticated;

create or replace function public.can_manage_customer_balances(_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select
    _user_id is not null
    and (
      public.has_role(_user_id, 'admin'::public.app_role)
      or public.has_sales_perm(_user_id, 'can_manage_customer_balances')
    )
$function$;

revoke all on function public.can_manage_customer_balances(uuid) from public, anon;
grant execute on function public.can_manage_customer_balances(uuid) to authenticated;

create or replace function public.normalize_customer_balance_search(value text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $function$
  select lower(regexp_replace(btrim(coalesce(value, '')), '\s+', ' ', 'g'))
$function$;

revoke all on function public.normalize_customer_balance_search(text) from public, anon, authenticated;

create table public.customer_balances (
  customer_number text primary key,
  customer_name text not null check (btrim(customer_name) <> ''),
  search_customer_number text generated always as (
    public.normalize_customer_balance_search(customer_number)
  ) stored,
  search_customer_name text generated always as (
    public.normalize_customer_balance_search(customer_name)
  ) stored,
  debit_usd numeric not null default 0,
  credit_usd numeric not null default 0,
  debit_iqd numeric not null default 0,
  credit_iqd numeric not null default 0,
  imported_at timestamptz not null default now(),
  check (btrim(customer_number) <> '')
);

create index customer_balances_search_name_trgm_idx
  on public.customer_balances using gin (search_customer_name extensions.gin_trgm_ops);
create index customer_balances_search_number_trgm_idx
  on public.customer_balances using gin (search_customer_number extensions.gin_trgm_ops);

create table public.customer_balance_import_state (
  singleton boolean primary key default true check (singleton),
  file_name text not null check (char_length(file_name) between 1 and 255),
  imported_at timestamptz not null,
  imported_by uuid not null references auth.users(id),
  row_count integer not null check (row_count between 1 and 50000)
);

alter table public.customer_balances enable row level security;
alter table public.customer_balance_import_state enable row level security;

create policy "Customer balances: authorized staff read"
on public.customer_balances
for select
to authenticated
using (public.can_manage_customer_balances(auth.uid()));

create policy "Customer balance state: authorized staff read"
on public.customer_balance_import_state
for select
to authenticated
using (public.can_manage_customer_balances(auth.uid()));

revoke all on table public.customer_balances from public, anon, authenticated;
revoke all on table public.customer_balance_import_state from public, anon, authenticated;
grant select on table public.customer_balances to authenticated;
grant select on table public.customer_balance_import_state to authenticated;

create or replace function public.replace_customer_balances(file_name text, rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  staged_count integer;
  imported_time timestamptz := clock_timestamp();
begin
  if not public.can_manage_customer_balances(auth.uid()) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if file_name is null or btrim(file_name) = '' or char_length(file_name) > 255 then
    raise exception using errcode = '22023', message = 'invalid file name';
  end if;
  if rows is null or jsonb_typeof(rows) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid rows';
  end if;
  if jsonb_array_length(rows) < 1 then
    raise exception using errcode = '22023', message = 'empty dataset';
  end if;
  if jsonb_array_length(rows) > 50000 then
    raise exception using errcode = '22023', message = 'too many rows';
  end if;
  if not pg_try_advisory_xact_lock(hashtext('replace_customer_balances')) then
    raise exception using errcode = '55P03', message = 'import in progress';
  end if;

  create temp table _customer_balance_import (
    customer_number text,
    customer_name text,
    debit_usd text,
    credit_usd text,
    debit_iqd text,
    credit_iqd text
  ) on commit drop;

  insert into _customer_balance_import
  select
    item.customer_number,
    item.customer_name,
    item.debit_usd,
    item.credit_usd,
    item.debit_iqd,
    item.credit_iqd
  from jsonb_to_recordset(rows) as item(
    customer_number text,
    customer_name text,
    debit_usd text,
    credit_usd text,
    debit_iqd text,
    credit_iqd text
  );

  select count(*) into staged_count from _customer_balance_import;
  if staged_count <> jsonb_array_length(rows) then
    raise exception using errcode = '22023', message = 'invalid rows';
  end if;
  if exists (
    select 1 from _customer_balance_import
    where customer_number is null or btrim(customer_number) = ''
  ) then
    raise exception using errcode = '22023', message = 'missing customer number';
  end if;
  if exists (
    select 1 from _customer_balance_import
    where customer_name is null or btrim(customer_name) = ''
  ) then
    raise exception using errcode = '22023', message = 'missing customer name';
  end if;
  if exists (
    select customer_number
    from _customer_balance_import
    group by customer_number
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'duplicate customer number';
  end if;
  if exists (
    select 1
    from _customer_balance_import
    where debit_usd is null or debit_usd !~ '^[+-]?(\d+(\.\d*)?|\.\d+)$'
       or credit_usd is null or credit_usd !~ '^[+-]?(\d+(\.\d*)?|\.\d+)$'
       or debit_iqd is null or debit_iqd !~ '^[+-]?(\d+(\.\d*)?|\.\d+)$'
       or credit_iqd is null or credit_iqd !~ '^[+-]?(\d+(\.\d*)?|\.\d+)$'
  ) then
    raise exception using errcode = '22023', message = 'invalid amount';
  end if;

  delete from public.customer_balances;

  insert into public.customer_balances (
    customer_number,
    customer_name,
    debit_usd,
    credit_usd,
    debit_iqd,
    credit_iqd,
    imported_at
  )
  select
    customer_number,
    customer_name,
    debit_usd::numeric,
    credit_usd::numeric,
    debit_iqd::numeric,
    credit_iqd::numeric,
    imported_time
  from _customer_balance_import;

  insert into public.customer_balance_import_state (
    singleton,
    file_name,
    imported_at,
    imported_by,
    row_count
  ) values (
    true,
    file_name,
    imported_time,
    auth.uid(),
    staged_count
  )
  on conflict (singleton) do update set
    file_name = excluded.file_name,
    imported_at = excluded.imported_at,
    imported_by = excluded.imported_by,
    row_count = excluded.row_count;

  return jsonb_build_object('imported', staged_count);
end;
$function$;

revoke all on function public.replace_customer_balances(text, jsonb) from public, anon;
grant execute on function public.replace_customer_balances(text, jsonb) to authenticated;

create or replace function public.search_customer_balances(
  _query text default '',
  _balance_type text default 'all',
  _currency text default 'all',
  _page integer default 1,
  _page_size integer default 50
)
returns table (
  customer_number text,
  customer_name text,
  debit_usd text,
  credit_usd text,
  debit_iqd text,
  credit_iqd text,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  normalized_query text;
  search_pattern text;
begin
  if not public.can_manage_customer_balances(auth.uid()) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if _balance_type not in ('all', 'debit', 'credit') then
    raise exception using errcode = '22023', message = 'invalid balance type';
  end if;
  if _currency not in ('all', 'usd', 'iqd') then
    raise exception using errcode = '22023', message = 'invalid currency';
  end if;
  if _page < 1 or _page_size < 1 or _page_size > 100 then
    raise exception using errcode = '22023', message = 'invalid pagination';
  end if;

  normalized_query := public.normalize_customer_balance_search(_query);
  search_pattern := '%'
    || replace(replace(replace(normalized_query, '\', '\\'), '%', '\%'), '_', '\_')
    || '%';

  return query
  select
    balance.customer_number,
    balance.customer_name,
    balance.debit_usd::text,
    balance.credit_usd::text,
    balance.debit_iqd::text,
    balance.credit_iqd::text,
    count(*) over() as total_count
  from public.customer_balances as balance
  where (
    normalized_query = ''
    or balance.search_customer_name like search_pattern escape '\'
    or balance.search_customer_number like search_pattern escape '\'
  )
  and (
    _balance_type = 'all'
    or (
      _balance_type = 'debit'
      and (
        (_currency in ('all', 'usd') and balance.debit_usd > 0)
        or (_currency in ('all', 'iqd') and balance.debit_iqd > 0)
      )
    )
    or (
      _balance_type = 'credit'
      and (
        (_currency in ('all', 'usd') and balance.credit_usd > 0)
        or (_currency in ('all', 'iqd') and balance.credit_iqd > 0)
      )
    )
  )
  order by balance.search_customer_name, balance.customer_number
  limit _page_size
  offset ((_page - 1) * _page_size);
end;
$function$;

revoke all on function public.search_customer_balances(text, text, text, integer, integer)
  from public, anon;
grant execute on function public.search_customer_balances(text, text, text, integer, integer)
  to authenticated;
