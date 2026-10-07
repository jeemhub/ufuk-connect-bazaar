BEGIN;
-- Global ON takes precedence over individual brand switches. OFF restores brand rules.
INSERT INTO public.site_pages(key,title_ar,title_en,content_ar)
VALUES('global-price-visibility','السعر غير مستقر لكل الموقع','Global unstable pricing','false')
ON CONFLICT(key) DO NOTHING;
CREATE OR REPLACE FUNCTION public.brand_price_unstable(p_brand text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.site_pages WHERE key='global-price-visibility' AND content_ar='true')
    OR EXISTS(SELECT 1 FROM public.brands b WHERE lower(btrim(b.name))=lower(btrim(p_brand)) AND b.price_unstable);
$$;
ALTER TABLE public.admin_preferences ADD COLUMN IF NOT EXISTS pointer_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.sales_tool_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK(id),
  exchange_rate numeric(12,4) CHECK(exchange_rate > 0 AND exchange_rate <= 100000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.sales_tool_settings(id) VALUES(true) ON CONFLICT(id) DO NOTHING;
ALTER TABLE public.sales_tool_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sales tools: staff read" ON public.sales_tool_settings FOR SELECT TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'))
    AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_blocked));
CREATE POLICY "Sales tools: staff update" ON public.sales_tool_settings FOR UPDATE TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'))
    AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_blocked))
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'))
    AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_blocked));
REVOKE ALL ON public.sales_tool_settings FROM anon,authenticated;
GRANT SELECT ON public.sales_tool_settings TO authenticated;
GRANT UPDATE(exchange_rate) ON public.sales_tool_settings TO authenticated;
CREATE OR REPLACE FUNCTION public.stamp_sales_tool_settings() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at:=now(); NEW.updated_by:=auth.uid(); RETURN NEW; END;
$$;
CREATE TRIGGER stamp_sales_tool_settings BEFORE UPDATE ON public.sales_tool_settings
  FOR EACH ROW EXECUTE FUNCTION public.stamp_sales_tool_settings();
COMMIT;
