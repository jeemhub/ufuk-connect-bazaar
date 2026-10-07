-- Guest tracking exposes only state and timestamp, never customer data or items.
CREATE OR REPLACE FUNCTION public.commerce_phone(value text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  WITH digits AS (SELECT regexp_replace(translate(value, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'), '[^0-9]', '', 'g') AS phone)
  SELECT CASE WHEN phone LIKE '00964%' THEN '0' || substr(phone,6)
              WHEN phone LIKE '964%' THEN '0' || substr(phone,4) ELSE phone END FROM digits;
$$;

-- Prices and availability are checked on the server. Any item failure rolls back the entire request.
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
-- Storefront writes must use the atomic function; staff policies remain intact.
DROP POLICY IF EXISTS "Orders: anyone creates" ON public.orders;
DROP POLICY IF EXISTS "Items: insert own order" ON public.order_items;

CREATE OR REPLACE FUNCTION public.track_order(p_order_no text, p_phone text)
RETURNS TABLE(order_no text, status text, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(p_order_no) > 40 OR public.commerce_phone(p_phone) !~ '^07[0-9]{9}$' THEN RETURN; END IF;
  RETURN QUERY SELECT o.order_no, o.status, o.updated_at FROM public.orders o
    WHERE upper(o.order_no) = upper(trim(p_order_no))
    AND public.commerce_phone(o.customer_phone) = public.commerce_phone(p_phone) LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION public.track_order(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text,text) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.stock_alerts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  PRIMARY KEY(user_id, product_id)
);
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stock alerts: own read" ON public.stock_alerts FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Stock alerts: own cancel" ON public.stock_alerts FOR DELETE TO authenticated USING(user_id=auth.uid());
GRANT SELECT, DELETE ON public.stock_alerts TO authenticated;

CREATE OR REPLACE FUNCTION public.subscribe_stock_alert(p_product_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=p_product_id AND is_active AND stock<=0) THEN RAISE EXCEPTION 'Product is not awaiting restock'; END IF;
  IF (SELECT count(*) FROM public.stock_alerts WHERE user_id=auth.uid() AND notified_at IS NULL) >= 100 THEN RAISE EXCEPTION 'Alert limit reached'; END IF;
  INSERT INTO public.stock_alerts(user_id,product_id) VALUES(auth.uid(),p_product_id)
  ON CONFLICT(user_id,product_id) DO UPDATE SET notified_at=NULL,created_at=now();
END;
$$;
REVOKE ALL ON FUNCTION public.subscribe_stock_alert(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_stock_alert(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_product_restock() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.stock>0 AND NEW.is_active AND (OLD.stock<=0 OR NOT OLD.is_active) THEN
    INSERT INTO public.notifications(user_id,type,title,body,link)
    SELECT user_id,'info','المنتج متوفر الآن',NEW.name_ar,'/products/' || NEW.id::text
    FROM public.stock_alerts WHERE product_id=NEW.id AND notified_at IS NULL;
    UPDATE public.stock_alerts SET notified_at=now() WHERE product_id=NEW.id AND notified_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_product_restock() FROM PUBLIC;
CREATE TRIGGER product_restock_alert AFTER UPDATE OF stock,is_active ON public.products FOR EACH ROW EXECUTE FUNCTION public.notify_product_restock();

INSERT INTO public.site_pages(key,title_ar,title_en,content_ar)
VALUES('commerce-settings','إعدادات المتجر','Commerce settings','{}'),('product-details','تفاصيل المنتجات','Product details','{}')
ON CONFLICT(key) DO NOTHING;
