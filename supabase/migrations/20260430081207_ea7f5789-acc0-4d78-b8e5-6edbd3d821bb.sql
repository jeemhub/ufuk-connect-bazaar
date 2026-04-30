
-- 1) Restrict profiles public read: expose only safe columns via a view; lock the table
DROP POLICY IF EXISTS "Profiles: public read basic" ON public.profiles;

-- Public-safe view (no phone, no is_blocked). SECURITY INVOKER (default).
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, is_verified
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Keep existing "users read own" and "admin read all" policies; add nothing public.

-- 2) Fix has_sales_perm: remove dynamic SQL
CREATE OR REPLACE FUNCTION public.has_sales_perm(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r public.sales_permissions%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF NOT public.has_role(_user_id, 'sales'::app_role) THEN RETURN false; END IF;
  SELECT * INTO r FROM public.sales_permissions WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN false; END IF;
  RETURN CASE _perm
    WHEN 'can_manage_products'   THEN r.can_manage_products
    WHEN 'can_manage_categories' THEN r.can_manage_categories
    WHEN 'can_manage_brands'     THEN r.can_manage_brands
    WHEN 'can_manage_blog'       THEN r.can_manage_blog
    WHEN 'can_manage_projects'   THEN r.can_manage_projects
    WHEN 'can_manage_orders'     THEN r.can_manage_orders
    WHEN 'can_manage_quotes'     THEN r.can_manage_quotes
    ELSE false
  END;
END;
$function$;

-- 3) Restrict order_items insert to owner of the order (or staff)
DROP POLICY IF EXISTS "Items: insert with valid order" ON public.order_items;

CREATE POLICY "Items: insert own order"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (quantity > 0)
  AND (char_length(product_name) BETWEEN 1 AND 200)
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        -- guest order created in same session: allow when order has no user_id and caller is anon
        (o.user_id IS NULL AND auth.uid() IS NULL)
        -- authenticated user attaching items only to their own order
        OR (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
        -- staff
        OR public.has_role(auth.uid(),'admin')
        OR public.has_sales_perm(auth.uid(),'can_manage_orders')
      )
  )
);

-- 4) Lock down SECURITY DEFINER function execution to authenticated only where appropriate
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_sales_perm(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_sales_permissions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_blocked() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_pricing_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_blocked(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_verified(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_sales_permissions(uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_visible_price(uuid, bigint, bigint, bigint) FROM anon;

-- 5) Realtime: restrict notifications channel subscriptions to own user
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Realtime: own notifications channel" ON realtime.messages;
CREATE POLICY "Realtime: own notifications channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- restrict postgres_changes on notifications to rows where user_id = auth.uid()
  -- topic format used by client: notif-<user_id>
  (realtime.topic() = 'notif-' || auth.uid()::text)
);

-- 6) Public storage buckets: restrict listing (SELECT on storage.objects per bucket allows listing).
-- Keep public read of individual files via signed/public URLs through the CDN, but block bucket listing.
-- Note: Public buckets still serve files via direct URL even without storage.objects SELECT.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname IN (
        'Public read product-images','Public read blog-images','Public read avatars',
        'Public read brand-logos','Public read project-images','Public read quote-attachments'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;
