-- site_pages: editable singleton pages like "about"
CREATE TABLE public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  content_ar text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  cover_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pages: public read" ON public.site_pages
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Pages: admin write" ON public.site_pages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_pages_updated
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_pages (key, title_ar, title_en) VALUES ('about', 'من نحن', 'About Us')
  ON CONFLICT (key) DO NOTHING;

-- projects: showcase of completed company projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  summary_ar text,
  summary_en text,
  body_ar text,
  body_en text,
  cover_url text,
  gallery text[] NOT NULL DEFAULT '{}',
  client text,
  location text,
  completed_at date,
  is_published boolean NOT NULL DEFAULT false,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  author_id uuid
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects: public read published" ON public.projects
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Projects: admin write" ON public.projects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- storage bucket for project images (and About cover, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Project images: public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-images');
CREATE POLICY "Project images: admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Project images: admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Project images: admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));