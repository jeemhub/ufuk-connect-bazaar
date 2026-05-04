create or replace function public.admin_restore_table(
  _table text,
  _rows jsonb,
  _truncate boolean default true
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted int := 0;
  v_allowed text[] := array[
    'categories','subcategories','brands','products',
    'blog_posts','blog_comments','projects','site_pages',
    'orders','order_items','quote_requests',
    'profiles','user_roles','sales_permissions','notifications'
  ];
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'admin only';
  end if;

  if not (_table = any(v_allowed)) then
    raise exception 'table % not allowed for restore', _table;
  end if;

  -- TRUNCATE phase, with admin/sales protection on user-related tables.
  if _truncate then
    if _table = 'user_roles' then
      -- Never wipe admin/sales role rows.
      delete from public.user_roles
       where role not in ('admin'::app_role, 'sales'::app_role);
    elsif _table = 'profiles' then
      delete from public.profiles p
       where not exists (
         select 1 from public.user_roles r
          where r.user_id = p.id
            and r.role in ('admin'::app_role, 'sales'::app_role)
       );
    elsif _table = 'sales_permissions' then
      -- Keep permissions for current sales/admin users intact.
      delete from public.sales_permissions sp
       where not exists (
         select 1 from public.user_roles r
          where r.user_id = sp.user_id
            and r.role in ('admin'::app_role, 'sales'::app_role)
       );
    else
      execute format('delete from public.%I', _table);
    end if;
  end if;

  if _rows is null or jsonb_array_length(_rows) = 0 then
    return 0;
  end if;

  -- INSERT phase: skip rows that would overwrite an admin/sales user.
  if _table = 'user_roles' then
    insert into public.user_roles
    select * from jsonb_populate_recordset(null::public.user_roles, _rows) src
     where src.role not in ('admin'::app_role, 'sales'::app_role)
       and not exists (
         select 1 from public.user_roles r
          where r.user_id = src.user_id
            and r.role in ('admin'::app_role, 'sales'::app_role)
       )
    on conflict do nothing;
    get diagnostics v_inserted = row_count;

  elsif _table = 'profiles' then
    insert into public.profiles
    select * from jsonb_populate_recordset(null::public.profiles, _rows) src
     where not exists (
       select 1 from public.user_roles r
        where r.user_id = src.id
          and r.role in ('admin'::app_role, 'sales'::app_role)
     )
    on conflict (id) do nothing;
    get diagnostics v_inserted = row_count;

  elsif _table = 'sales_permissions' then
    insert into public.sales_permissions
    select * from jsonb_populate_recordset(null::public.sales_permissions, _rows) src
     where not exists (
       select 1 from public.user_roles r
        where r.user_id = src.user_id
          and r.role in ('admin'::app_role, 'sales'::app_role)
     )
    on conflict (user_id) do nothing;
    get diagnostics v_inserted = row_count;

  else
    execute format(
      'insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)',
      _table, _table
    ) using _rows;
    get diagnostics v_inserted = row_count;
  end if;

  return v_inserted;
end;
$$;