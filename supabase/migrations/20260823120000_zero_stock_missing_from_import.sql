-- Stock-only import treats the uploaded sheet as the full picture of what is in
-- the warehouse: anything the sheet does not list is out of stock. The upsert RPC
-- runs per chunk, so it can never know the full name list; this runs once at the
-- end with every name from the sheet.
--
-- Products with no name_data are skipped on purpose. They cannot appear in the
-- sheet (name_data is the import key), so zeroing them would silently empty
-- products that were created by hand in the admin panel.

CREATE OR REPLACE FUNCTION public.zero_stock_missing_from_import(names jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_zeroed int := 0;
begin
  if not (public.has_role(auth.uid(), 'admin'::app_role)
       or public.has_sales_perm(auth.uid(), 'can_manage_products')) then
    raise exception 'forbidden';
  end if;

  create temp table _keep(name_data text primary key) on commit drop;

  insert into _keep(name_data)
  select distinct trim(x #>> '{}')
    from jsonb_array_elements(names) as x
   where coalesce(trim(x #>> '{}'), '') <> ''
  on conflict (name_data) do nothing;

  -- An empty list would zero the entire catalogue; refuse rather than wipe it.
  if not exists (select 1 from _keep) then
    raise exception 'empty name list';
  end if;

  with z as (
    update public.products p
       set stock = 0,
           updated_at = now()
     where p.stock <> 0
       and coalesce(trim(p.name_data), '') <> ''
       and not exists (select 1 from _keep k where k.name_data = trim(p.name_data))
    returning 1
  )
  select count(*) into v_zeroed from z;

  return v_zeroed;
end;
$function$;

REVOKE ALL ON FUNCTION public.zero_stock_missing_from_import(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.zero_stock_missing_from_import(jsonb) TO authenticated;
