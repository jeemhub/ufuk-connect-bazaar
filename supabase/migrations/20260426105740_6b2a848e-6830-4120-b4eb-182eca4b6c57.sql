CREATE OR REPLACE FUNCTION public.notify_on_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_user_id uuid;
  post_slug text;
  post_title text;
  replier_name text;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO parent_user_id
  FROM public.blog_comments
  WHERE id = NEW.parent_id;

  IF parent_user_id IS NULL OR parent_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT slug, title_ar INTO post_slug, post_title
  FROM public.blog_posts
  WHERE id = NEW.post_id;

  SELECT COALESCE(NULLIF(full_name, ''), 'مستخدم') INTO replier_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    parent_user_id,
    'comment_reply',
    'رد جديد على تعليقك',
    COALESCE(replier_name, 'مستخدم') || ' رد على تعليقك في: ' || COALESCE(post_title, ''),
    '/blog/' || COALESCE(post_slug, '')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_comment_reply ON public.blog_comments;
CREATE TRIGGER trg_notify_on_comment_reply
AFTER INSERT ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment_reply();