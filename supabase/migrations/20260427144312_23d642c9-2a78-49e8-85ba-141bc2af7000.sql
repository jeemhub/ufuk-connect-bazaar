-- 1) Add is_blocked to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- 2) Page visits table (anonymous + authenticated)
CREATE TABLE IF NOT EXISTS public.page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  path text NOT NULL,
  referrer text,
  user_agent text,
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_path ON public.page_visits(path);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visits: anyone insert" ON public.page_visits;
CREATE POLICY "Visits: anyone insert"
  ON public.page_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(path) BETWEEN 1 AND 500
    AND (
      (auth.uid() IS NULL AND user_id IS NULL)
      OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Visits: admin reads all" ON public.page_visits;
CREATE POLICY "Visits: admin reads all"
  ON public.page_visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) RPC: admin block / unblock user
CREATE OR REPLACE FUNCTION public.admin_set_blocked(_user_id uuid, _blocked boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  IF public.has_role(_user_id, 'admin') THEN
    RAISE EXCEPTION 'cannot block another admin';
  END IF;

  UPDATE public.profiles
  SET is_blocked = _blocked,
      is_verified = CASE WHEN _blocked THEN false ELSE is_verified END,
      updated_at = now()
  WHERE id = _user_id;
END;
$$;

-- 4) RPC: admin delete user (cascade their content)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete yourself';
  END IF;
  IF public.has_role(_user_id, 'admin') THEN
    RAISE EXCEPTION 'cannot delete another admin';
  END IF;

  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- 5) RPC: check own blocked state (avoids RLS trips when logged-in)
CREATE OR REPLACE FUNCTION public.is_current_user_blocked()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_blocked FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- 6) Allow admin to delete any blog comment (already covered by existing policy via has_role OR own).
--    Add explicit admin DELETE policy for blog_posts management consistency (idempotent).
DROP POLICY IF EXISTS "Posts: admin delete" ON public.blog_posts;
CREATE POLICY "Posts: admin delete"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
