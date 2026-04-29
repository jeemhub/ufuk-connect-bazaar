CREATE TABLE IF NOT EXISTS public.sales_permissions (
  user_id uuid PRIMARY KEY,
  can_manage_products boolean NOT NULL DEFAULT false,
  can_manage_categories boolean NOT NULL DEFAULT false,
  can_manage_brands boolean NOT NULL DEFAULT false,
  can_manage_blog boolean NOT NULL DEFAULT false,
  can_manage_projects boolean NOT NULL DEFAULT false,
  can_manage_orders boolean NOT NULL DEFAULT false,
  can_manage_quotes boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SalesPerms: admin all" ON public.sales_permissions;
CREATE POLICY "SalesPerms: admin all" ON public.sales_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "SalesPerms: own read" ON public.sales_permissions;
CREATE POLICY "SalesPerms: own read" ON public.sales_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_sales_perm(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ok boolean := false;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF NOT public.has_role(_user_id, 'sales'::app_role) THEN RETURN false; END IF;
  EXECUTE format('SELECT COALESCE((SELECT %I FROM public.sales_permissions WHERE user_id = $1), false)', _perm)
    INTO ok USING _user_id;
  RETURN COALESCE(ok, false);
END;
$$;

-- products
DROP POLICY IF EXISTS "Products: admin write" ON public.products;
DROP POLICY IF EXISTS "Products: admin or sales write" ON public.products;
CREATE POLICY "Products: admin or sales write" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_products'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_products'));
DROP POLICY IF EXISTS "Products: admin read all" ON public.products;
DROP POLICY IF EXISTS "Products: admin or sales read all" ON public.products;
CREATE POLICY "Products: admin or sales read all" ON public.products
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_products'));

-- categories
DROP POLICY IF EXISTS "Categories: admin write" ON public.categories;
DROP POLICY IF EXISTS "Categories: admin or sales write" ON public.categories;
CREATE POLICY "Categories: admin or sales write" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_categories'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_categories'));

DROP POLICY IF EXISTS "Subcats: admin write" ON public.subcategories;
DROP POLICY IF EXISTS "Subcats: admin or sales write" ON public.subcategories;
CREATE POLICY "Subcats: admin or sales write" ON public.subcategories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_categories'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_categories'));

-- brands
DROP POLICY IF EXISTS "Brands: admin write" ON public.brands;
DROP POLICY IF EXISTS "Brands: admin or sales write" ON public.brands;
CREATE POLICY "Brands: admin or sales write" ON public.brands
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_brands'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_brands'));

-- blog
DROP POLICY IF EXISTS "Posts: admin write" ON public.blog_posts;
DROP POLICY IF EXISTS "Posts: admin delete" ON public.blog_posts;
DROP POLICY IF EXISTS "Posts: admin or sales write" ON public.blog_posts;
CREATE POLICY "Posts: admin or sales write" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_blog'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_blog'));
DROP POLICY IF EXISTS "Posts: public read published" ON public.blog_posts;
CREATE POLICY "Posts: public read published" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_blog'));

-- projects
DROP POLICY IF EXISTS "Projects: admin write" ON public.projects;
DROP POLICY IF EXISTS "Projects: admin or sales write" ON public.projects;
CREATE POLICY "Projects: admin or sales write" ON public.projects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_projects'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_projects'));
DROP POLICY IF EXISTS "Projects: public read published" ON public.projects;
CREATE POLICY "Projects: public read published" ON public.projects
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_projects'));

-- orders
DROP POLICY IF EXISTS "Orders: admin all" ON public.orders;
DROP POLICY IF EXISTS "Orders: admin or sales all" ON public.orders;
CREATE POLICY "Orders: admin or sales all" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_orders'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_orders'));
DROP POLICY IF EXISTS "Items: admin all" ON public.order_items;
DROP POLICY IF EXISTS "Items: admin or sales all" ON public.order_items;
CREATE POLICY "Items: admin or sales all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_orders'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_orders'));

-- quotes
DROP POLICY IF EXISTS "Quotes: admin reads" ON public.quote_requests;
DROP POLICY IF EXISTS "Quotes: admin updates" ON public.quote_requests;
DROP POLICY IF EXISTS "Quotes: admin or sales read" ON public.quote_requests;
DROP POLICY IF EXISTS "Quotes: admin or sales update" ON public.quote_requests;
CREATE POLICY "Quotes: admin or sales read" ON public.quote_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_quotes'));
CREATE POLICY "Quotes: admin or sales update" ON public.quote_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_quotes'));

-- RPCs
CREATE OR REPLACE FUNCTION public.admin_set_sales_permissions(
  _user_id uuid,
  _is_sales boolean,
  _can_manage_products boolean DEFAULT false,
  _can_manage_categories boolean DEFAULT false,
  _can_manage_brands boolean DEFAULT false,
  _can_manage_blog boolean DEFAULT false,
  _can_manage_projects boolean DEFAULT false,
  _can_manage_orders boolean DEFAULT false,
  _can_manage_quotes boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  IF public.has_role(_user_id,'admin') THEN
    RAISE EXCEPTION 'cannot modify another admin';
  END IF;

  IF _is_sales THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, 'sales'::app_role)
      ON CONFLICT DO NOTHING;
    INSERT INTO public.sales_permissions(
      user_id, can_manage_products, can_manage_categories, can_manage_brands,
      can_manage_blog, can_manage_projects, can_manage_orders, can_manage_quotes, updated_at
    ) VALUES (
      _user_id, _can_manage_products, _can_manage_categories, _can_manage_brands,
      _can_manage_blog, _can_manage_projects, _can_manage_orders, _can_manage_quotes, now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      can_manage_products = EXCLUDED.can_manage_products,
      can_manage_categories = EXCLUDED.can_manage_categories,
      can_manage_brands = EXCLUDED.can_manage_brands,
      can_manage_blog = EXCLUDED.can_manage_blog,
      can_manage_projects = EXCLUDED.can_manage_projects,
      can_manage_orders = EXCLUDED.can_manage_orders,
      can_manage_quotes = EXCLUDED.can_manage_quotes,
      updated_at = now();
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'sales'::app_role;
    DELETE FROM public.sales_permissions WHERE user_id = _user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_sales_permissions()
RETURNS public.sales_permissions
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.sales_permissions WHERE user_id = auth.uid();
$$;

DROP FUNCTION IF EXISTS public.admin_list_users();
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id uuid, email text, full_name text, phone text, created_at timestamptz,
  roles text[], quote_count bigint, is_verified boolean,
  sales_perms jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(p.full_name,'')::text,
    COALESCE(p.phone,'')::text,
    u.created_at,
    COALESCE((SELECT array_agg(r.role::text) FROM public.user_roles r WHERE r.user_id = u.id), '{}'),
    COALESCE((SELECT count(*) FROM public.quote_requests q WHERE q.email = u.email), 0),
    COALESCE(p.is_verified, false),
    COALESCE(to_jsonb(sp.*) - 'user_id' - 'updated_at', '{}'::jsonb)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.sales_permissions sp ON sp.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
