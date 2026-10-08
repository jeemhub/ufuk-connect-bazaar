BEGIN;
ALTER TABLE public.sales_tool_settings
  ADD COLUMN IF NOT EXISTS markup_percentage numeric(12,4) NOT NULL DEFAULT 0
    CHECK(markup_percentage >= 0 AND markup_percentage <= 100000),
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'parallel'
    CHECK(pricing_mode IN ('parallel','percentage'));
GRANT UPDATE(markup_percentage,pricing_mode) ON public.sales_tool_settings TO authenticated;
COMMIT;
