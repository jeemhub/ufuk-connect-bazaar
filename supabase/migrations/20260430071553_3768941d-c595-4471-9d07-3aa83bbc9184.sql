
-- Allow sales staff to manage storage objects based on their permissions

-- product-images
DROP POLICY IF EXISTS "Product imgs: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "Product imgs: admin update" ON storage.objects;
DROP POLICY IF EXISTS "Product imgs: admin delete" ON storage.objects;

CREATE POLICY "Product imgs: staff upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_products')));
CREATE POLICY "Product imgs: staff update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_products')));
CREATE POLICY "Product imgs: staff delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_products')));

-- blog-images
DROP POLICY IF EXISTS "Blog images admin write" ON storage.objects;
DROP POLICY IF EXISTS "Blog images admin update" ON storage.objects;
DROP POLICY IF EXISTS "Blog images admin delete" ON storage.objects;

CREATE POLICY "Blog images: staff upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_blog')));
CREATE POLICY "Blog images: staff update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blog-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_blog')));
CREATE POLICY "Blog images: staff delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_blog')));

-- brand-logos
DROP POLICY IF EXISTS "Brand logos: admin insert" ON storage.objects;
DROP POLICY IF EXISTS "Brand logos: admin update" ON storage.objects;
DROP POLICY IF EXISTS "Brand logos: admin delete" ON storage.objects;

CREATE POLICY "Brand logos: staff insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'brand-logos' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_brands')));
CREATE POLICY "Brand logos: staff update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'brand-logos' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_brands')));
CREATE POLICY "Brand logos: staff delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'brand-logos' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_brands')));

-- project-images
DROP POLICY IF EXISTS "Project images: admin insert" ON storage.objects;
DROP POLICY IF EXISTS "Project images: admin update" ON storage.objects;
DROP POLICY IF EXISTS "Project images: admin delete" ON storage.objects;

CREATE POLICY "Project images: staff insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_projects')));
CREATE POLICY "Project images: staff update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'project-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_projects')));
CREATE POLICY "Project images: staff delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-images' AND (public.has_role(auth.uid(),'admin') OR public.has_sales_perm(auth.uid(),'can_manage_projects')));
