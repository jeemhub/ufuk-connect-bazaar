-- ON means unstable pricing: mask all customer tiers. Existing brands default to OFF.
BEGIN;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS price_unstable boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.brand_price_unstable(p_brand text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.brands b
    WHERE lower(btrim(b.name))=lower(btrim(p_brand)) AND b.price_unstable);
$$;
REVOKE ALL ON FUNCTION public.brand_price_unstable(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.brand_price_unstable(text) TO anon,authenticated;
CREATE OR REPLACE VIEW public.products_public AS
SELECT
    id,
    sku,
    name_ar,
    name_en,
    name_data,
    desc_ar,
    desc_en,
    brand,
    category_id,
    subcategory,
    CASE WHEN public.brand_price_unstable(brand) THEN NULL::bigint ELSE price_iqd END AS price_iqd,
    CASE
        WHEN NOT public.brand_price_unstable(brand) AND (has_role(auth.uid(), 'dealer'::app_role) OR has_role(auth.uid(), 'wholesale'::app_role))
        THEN price_wholesale_iqd
        ELSE NULL::bigint
    END AS price_wholesale_iqd,
    CASE
        WHEN NOT public.brand_price_unstable(brand) AND (has_role(auth.uid(), 'dealer'::app_role))
        THEN price_dealer_iqd
        ELSE NULL::bigint
    END AS price_dealer_iqd,
    stock,
    image_url,
    datasheet_url,
    datasheet_name,
    is_active,
    created_at,
    public.brand_price_unstable(brand) AS price_unstable
FROM products
WHERE is_active = true;

ALTER VIEW public.products_public SET (security_invoker = off, security_barrier = true);

GRANT SELECT ON public.products_public TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.place_order(p_name text, p_phone text, p_city text, p_address text, p_notes text, p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  item jsonb; product public.products%ROWTYPE; qty integer; unit_price bigint;
  amount bigint := 0; fee bigint := NULL; settings jsonb; zone jsonb;
  order_record public.orders%ROWTYPE; lines jsonb := '[]'::jsonb;
BEGIN
  IF char_length(trim(p_name)) NOT BETWEEN 2 AND 120 OR public.commerce_phone(p_phone) !~ '^07[0-9]{9}$'
     OR char_length(trim(p_address)) NOT BETWEEN 1 AND 500 OR char_length(coalesce(p_city,'')) > 120
     OR char_length(coalesce(p_notes,'')) > 2000 THEN RAISE EXCEPTION 'Invalid customer details'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_blocked) THEN RAISE EXCEPTION 'Account unavailable'; END IF;
  IF (SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(p_items) x) <> jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Duplicate cart items'; END IF;
  FOR item IN SELECT x FROM jsonb_array_elements(p_items) x ORDER BY x->>'id' LOOP
    IF coalesce(item->>'quantity','') !~ '^[0-9]{1,3}$' THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    qty := (item->>'quantity')::integer;
    SELECT * INTO product FROM public.products WHERE id=(item->>'id')::uuid AND is_active FOR SHARE;
    IF NOT FOUND OR qty < 1 OR product.stock < qty THEN RAISE EXCEPTION 'Item unavailable or requested quantity exceeds stock'; END IF;
    IF public.brand_price_unstable(product.brand) THEN
      RAISE EXCEPTION 'Price is unstable; please contact the company';
    END IF;
    unit_price := CASE
      WHEN (public.has_role(auth.uid(),'dealer') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales')) AND product.price_dealer_iqd>0 THEN product.price_dealer_iqd
      WHEN public.has_role(auth.uid(),'wholesale') AND product.price_wholesale_iqd>0 THEN product.price_wholesale_iqd
      ELSE product.price_iqd END;
    IF unit_price<=0 THEN RAISE EXCEPTION 'Please request a price quote for this item'; END IF;
    amount := amount + unit_price * qty;
    lines := lines || jsonb_build_array(jsonb_build_object('id',product.id,'name',product.name_ar,'quantity',qty,'unitPriceIqd',unit_price));
  END LOOP;
  SELECT content_ar::jsonb INTO settings FROM public.site_pages WHERE key='commerce-settings';
  SELECT x INTO zone FROM jsonb_array_elements(coalesce(settings->'zones','[]'::jsonb)) x WHERE x->>'city'=trim(p_city) AND x->>'enabled'='true' LIMIT 1;
  IF zone->>'fee' IS NOT NULL THEN fee := greatest(0,(zone->>'fee')::bigint); END IF;
  INSERT INTO public.orders(user_id,customer_name,customer_phone,customer_city,customer_address,notes,total_iqd,status)
  VALUES(auth.uid(),trim(p_name),public.commerce_phone(p_phone),nullif(trim(p_city),''),trim(p_address),
    concat_ws(E'\n',nullif(trim(p_notes),''),CASE WHEN fee IS NULL THEN 'Delivery fee to be confirmed' ELSE 'Delivery: ' || fee || ' IQD' END,
      'Payment: ' || coalesce(nullif(settings->>'payments',''),'confirm with sales')),amount+coalesce(fee,0),'pending') RETURNING * INTO order_record;
  INSERT INTO public.order_items(order_id,product_id,product_name,quantity,unit_price_iqd)
  SELECT order_record.id,(x->>'id')::uuid,x->>'name',(x->>'quantity')::integer,(x->>'unitPriceIqd')::bigint FROM jsonb_array_elements(lines) x;
  RETURN jsonb_build_object('order_no',order_record.order_no,'total_iqd',order_record.total_iqd,'created_at',order_record.created_at,'notes',order_record.notes,'items',lines);
END;
$$;
REVOKE ALL ON FUNCTION public.place_order(text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,text,text,jsonb) TO anon,authenticated;

COMMIT;
