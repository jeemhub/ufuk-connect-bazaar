DROP VIEW IF EXISTS public.products_public;

CREATE VIEW public.products_public AS
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
    price_iqd,
    CASE
        WHEN has_role(auth.uid(), 'dealer'::app_role) OR has_role(auth.uid(), 'wholesale'::app_role)
        THEN price_wholesale_iqd
        ELSE NULL::bigint
    END AS price_wholesale_iqd,
    CASE
        WHEN has_role(auth.uid(), 'dealer'::app_role)
        THEN price_dealer_iqd
        ELSE NULL::bigint
    END AS price_dealer_iqd,
    stock,
    image_url,
    datasheet_url,
    datasheet_name,
    is_active,
    created_at
FROM products
WHERE is_active = true;

ALTER VIEW public.products_public SET (security_invoker = off, security_barrier = true);

GRANT SELECT ON public.products_public TO anon, authenticated;