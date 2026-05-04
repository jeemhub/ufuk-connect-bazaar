-- Store service role key in vault and update dispatch_push trigger to authenticate as service role
-- This allows the send-push edge function to require admin/service-role auth without breaking the trigger.

-- Insert/update service role key in vault (only if it doesn't already exist)
DO $$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM vault.secrets WHERE name = 'service_role_key' LIMIT 1;
  IF existing_id IS NULL THEN
    PERFORM vault.create_secret(
      'PLACEHOLDER_REPLACE_ME',
      'service_role_key',
      'Service role key used by triggers to call edge functions'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  fn_url text := 'https://ecbbhathvpxrgvfztzeu.supabase.co/functions/v1/send-push';
  service_key text;
BEGIN
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  -- If key not configured, skip silently (notifications still work in-app)
  IF service_key IS NULL OR service_key = '' OR service_key = 'PLACEHOLDER_REPLACE_ME' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
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
$function$;