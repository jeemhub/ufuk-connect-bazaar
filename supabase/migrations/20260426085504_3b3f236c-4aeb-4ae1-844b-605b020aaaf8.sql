-- Allow products_public view to be readable by anon and authenticated users
-- by switching it to SECURITY DEFINER (invoker off) with a barrier.
-- Base table RLS still blocks direct access to raw multi-tier prices.

ALTER VIEW public.products_public SET (security_invoker = off, security_barrier = true);

GRANT SELECT ON public.products_public TO anon, authenticated;