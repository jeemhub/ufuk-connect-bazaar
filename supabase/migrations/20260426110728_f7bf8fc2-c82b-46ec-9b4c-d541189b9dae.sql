
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text := 'https://ecbbhathvpxrgvfztzeu.supabase.co/functions/v1/send-push';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmJoYXRodnB4cmd2Znp0emV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzQ2MjgsImV4cCI6MjA5MjYxMDYyOH0.i4LcsvY36auNKal7rXSZgcdhgoA-ZHy4psIAqbaZqzk';
BEGIN
  PERFORM extensions.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
    ),
    body := jsonb_build_object(
      'user_ids', jsonb_build_array(NEW.user_id),
      'title', NEW.title,
      'body', COALESCE(NEW.body, ''),
      'link', COALESCE(NEW.link, '/'),
      'tag', NEW.type
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_push_on_notification ON public.notifications;
CREATE TRIGGER trg_dispatch_push_on_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.dispatch_push_on_notification();
