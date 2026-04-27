-- Brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands: public read"
ON public.brands FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brands: admin write"
ON public.brands FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER brands_set_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Brand logos: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Brand logos: admin insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-logos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brand logos: admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-logos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brand logos: admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-logos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Seed initial brands
INSERT INTO public.brands (name, slug, sort) VALUES
  ('MikroTik', 'mikrotik', 1),
  ('Ruijie', 'ruijie', 2),
  ('Must', 'must', 3),
  ('Ubiquiti', 'ubiquiti', 4),
  ('TP-Link', 'tp-link', 5);