DROP VIEW IF EXISTS public.products_public;

CREATE VIEW public.products_public AS
SELECT
  id, sku, name_ar, name_en, desc_ar, desc_en, brand, category_id, subcategory,
  price_iqd,
  CASE
    WHEN public.has_role(auth.uid(), 'dealer'::app_role) OR public.has_role(auth.uid(), 'wholesale'::app_role)
      THEN price_wholesale_iqd
    ELSE NULL
  END AS price_wholesale_iqd,
  CASE
    WHEN public.has_role(auth.uid(), 'dealer'::app_role)
      THEN price_dealer_iqd
    ELSE NULL
  END AS price_dealer_iqd,
  stock, image_url, datasheet_url, datasheet_name, is_active, created_at
FROM public.products
WHERE is_active = true;

GRANT SELECT ON public.products_public TO anon, authenticated;