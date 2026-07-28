-- Applies a batch of pre-validated product field updates by id, inside a
-- single transaction (this function body). Used exclusively by the
-- import-products edge function, which already validates the caller is an
-- authenticated admin before calling this with the service_role connection.
-- Never granted to anon/authenticated - not reachable from the browser.
--
-- p_items: jsonb array of objects. Each object must have "id" (uuid text).
-- Any other recognized key present is written; keys that are absent are left
-- untouched on the row (this is how "empty cell = don't change" is
-- implemented upstream). name_data is intentionally never accepted here.
create or replace function public.import_products_apply(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_id uuid;
  v_updated_ids uuid[] := '{}';
  v_not_found_ids uuid[] := '{}';
  v_error_items jsonb[] := '{}';
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    begin
      v_id := (v_item->>'id')::uuid;

      if not exists (select 1 from public.products where id = v_id) then
        v_not_found_ids := array_append(v_not_found_ids, v_id);
        continue;
      end if;

      update public.products set
        name_ar = case when v_item ? 'name_ar' then v_item->>'name_ar' else name_ar end,
        name_en = case when v_item ? 'name_en' then v_item->>'name_en' else name_en end,
        desc_ar = case when v_item ? 'desc_ar' then v_item->>'desc_ar' else desc_ar end,
        desc_en = case when v_item ? 'desc_en' then v_item->>'desc_en' else desc_en end,
        brand = case when v_item ? 'brand' then v_item->>'brand' else brand end,
        category_id = case when v_item ? 'category_id' then nullif(v_item->>'category_id', '')::uuid else category_id end,
        price_iqd = case when v_item ? 'price_iqd' then (v_item->>'price_iqd')::bigint else price_iqd end,
        price_wholesale_iqd = case when v_item ? 'price_wholesale_iqd' then (v_item->>'price_wholesale_iqd')::bigint else price_wholesale_iqd end,
        price_dealer_iqd = case when v_item ? 'price_dealer_iqd' then (v_item->>'price_dealer_iqd')::bigint else price_dealer_iqd end,
        stock = case when v_item ? 'stock' then (v_item->>'stock')::int else stock end,
        updated_at = now()
      where id = v_id;

      v_updated_ids := array_append(v_updated_ids, v_id);
    exception when others then
      -- Isolated per item via the implicit subtransaction of this BEGIN
      -- block: one bad row can't roll back the rest of the batch.
      v_error_items := array_append(v_error_items, jsonb_build_object(
        'id', v_item->>'id',
        'reason', SQLERRM
      ));
    end;
  end loop;

  return jsonb_build_object(
    'updated_ids', to_jsonb(v_updated_ids),
    'not_found_ids', to_jsonb(v_not_found_ids),
    'errors', to_jsonb(v_error_items)
  );
end;
$$;

revoke all on function public.import_products_apply(jsonb) from public;
grant execute on function public.import_products_apply(jsonb) to service_role;
