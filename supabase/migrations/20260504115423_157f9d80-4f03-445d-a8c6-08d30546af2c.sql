-- Admin-only restore helper that bypasses RLS for backup restore operations.
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

  if _truncate then
    execute format('delete from public.%I', _table);
  end if;

  if _rows is null or jsonb_array_length(_rows) = 0 then
    return 0;
  end if;

  execute format(
    'insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)',
    _table, _table
  ) using _rows;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.admin_restore_table(text, jsonb, boolean) from public;
grant execute on function public.admin_restore_table(text, jsonb, boolean) to authenticated;