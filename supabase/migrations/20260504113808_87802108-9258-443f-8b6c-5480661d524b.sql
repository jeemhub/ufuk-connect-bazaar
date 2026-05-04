create or replace function public.bulk_upsert_products_by_name_data(items jsonb)
returns table(updated_count int, inserted_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int := 0;
  v_inserted int := 0;
begin
  if not (public.has_role(auth.uid(), 'admin'::app_role)
       or public.has_sales_perm(auth.uid(), 'can_manage_products')) then
    raise exception 'forbidden';
  end if;

  create temp table _incoming(name_data text primary key, stock int) on commit drop;

  insert into _incoming(name_data, stock)
  select trim(x->>'name_data'), coalesce((x->>'stock')::int, 0)
  from jsonb_array_elements(items) as x
  where coalesce(trim(x->>'name_data'),'') <> ''
  on conflict (name_data) do update set stock = excluded.stock;

  with upd as (
    update public.products p
       set stock = i.stock,
           updated_at = now()
      from _incoming i
     where p.name_data = i.name_data
    returning 1
  )
  select count(*) into v_updated from upd;

  with ins as (
    insert into public.products
      (name_ar, name_en, name_data, stock, price_iqd, price_wholesale_iqd, price_dealer_iqd, is_active)
    select '', '', i.name_data, i.stock, 0, 0, 0, true
      from _incoming i
      left join public.products p on p.name_data = i.name_data
     where p.id is null
    returning 1
  )
  select count(*) into v_inserted from ins;

  return query select v_updated, v_inserted;
end;
$$;

revoke all on function public.bulk_upsert_products_by_name_data(jsonb) from public;
grant execute on function public.bulk_upsert_products_by_name_data(jsonb) to authenticated;