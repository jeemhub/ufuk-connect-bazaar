-- Restrict blog_likes SELECT: anonymous visitors should not be able to enumerate user_id <-> post_id pairs.
-- Public read of aggregate counts is provided through a security_invoker view.

DROP POLICY IF EXISTS "Likes: public read" ON public.blog_likes;

-- Authenticated users can read their own likes (for "did I like this post?" UI)
CREATE POLICY "Likes: own read"
ON public.blog_likes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Public aggregate counts via a view (security_invoker so it respects RLS via security definer fn)
CREATE OR REPLACE FUNCTION public.get_blog_like_count(_post_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint FROM public.blog_likes WHERE post_id = _post_id;
$$;

REVOKE ALL ON FUNCTION public.get_blog_like_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_blog_like_count(uuid) TO anon, authenticated;