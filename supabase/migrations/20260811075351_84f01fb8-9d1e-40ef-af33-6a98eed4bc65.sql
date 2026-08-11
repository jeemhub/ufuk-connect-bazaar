ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_usd numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_iqd numeric(14,2)
  GENERATED ALWAYS AS (cost_usd * 1500) STORED;

CREATE OR REPLACE FUNCTION public.bulk_upsert_products_by_name_data(items jsonb)
 RETURNS TABLE(updated_count integer, inserted_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_updated int := 0;
  v_inserted int := 0;
begin
  if not (public.has_role(auth.uid(), 'admin'::app_role)
       or public.has_sales_perm(auth.uid(), 'can_manage_products')) then
    raise exception 'forbidden';
  end if;

  create temp table _incoming(name_data text primary key, stock int, cost_usd numeric) on commit drop;

  insert into _incoming(name_data, stock, cost_usd)
  select trim(x->>'name_data'),
         coalesce((x->>'stock')::int, 0),
         nullif(x->>'cost_usd','')::numeric
  from jsonb_array_elements(items) as x
  where coalesce(trim(x->>'name_data'),'') <> ''
  on conflict (name_data) do update
    set stock = excluded.stock,
        cost_usd = excluded.cost_usd;

  with upd as (
    update public.products p
       set stock = i.stock,
           cost_usd = coalesce(i.cost_usd, p.cost_usd),
           updated_at = now()
      from _incoming i
     where p.name_data = i.name_data
    returning 1
  )
  select count(*) into v_updated from upd;

  with ins as (
    insert into public.products
      (name_ar, name_en, name_data, stock, cost_usd, price_iqd, price_wholesale_iqd, price_dealer_iqd, is_active)
    select '', '', i.name_data, i.stock, coalesce(i.cost_usd, 0), 0, 0, 0, true
      from _incoming i
      left join public.products p on p.name_data = i.name_data
     where p.id is null
    returning 1
  )
  select count(*) into v_inserted from ins;

  return query select v_updated, v_inserted;
end;
$function$;