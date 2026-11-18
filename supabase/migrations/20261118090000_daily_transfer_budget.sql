-- Shared accounting for application traffic. No access to customer data is granted.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE TABLE IF NOT EXISTS public.ufuk_transfer_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT true,
  limit_bytes bigint NOT NULL DEFAULT 120000000 CHECK (limit_bytes BETWEEN 1000000 AND 1000000000),
  guard_sha256 text
);
ALTER TABLE public.ufuk_transfer_settings ADD COLUMN IF NOT EXISTS tracking_started_at timestamptz NOT NULL DEFAULT now();
INSERT INTO public.ufuk_transfer_settings(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.ufuk_transfer_days (
  day date PRIMARY KEY,
  used_bytes bigint NOT NULL DEFAULT 0 CHECK (used_bytes >= 0),
  requests bigint NOT NULL DEFAULT 0,
  blocked_images bigint NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.ufuk_transfer_reservations (
  id uuid PRIMARY KEY, day date NOT NULL REFERENCES public.ufuk_transfer_days(day),
  reserved_bytes bigint NOT NULL, settled boolean NOT NULL DEFAULT false
);
ALTER TABLE public.ufuk_transfer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ufuk_transfer_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ufuk_transfer_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ufuk_transfer_settings, public.ufuk_transfer_days, public.ufuk_transfer_reservations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.ufuk_transfer_snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('day', (now() AT TIME ZONE 'Asia/Baghdad')::date,
   'resetAt', (((now() AT TIME ZONE 'Asia/Baghdad')::date + 1)::timestamp AT TIME ZONE 'Asia/Baghdad'),
   'enabled',s.enabled,'limitBytes',s.limit_bytes,'usedBytes',coalesce(d.used_bytes,0),
   'requests',coalesce(d.requests,0),'blockedImages',coalesce(d.blocked_images,0),
   'configured',s.guard_sha256 IS NOT NULL,'trackingSince',s.tracking_started_at)
 FROM public.ufuk_transfer_settings s LEFT JOIN public.ufuk_transfer_days d
 ON d.day=(now() AT TIME ZONE 'Asia/Baghdad')::date WHERE s.id=true;
$$;
REVOKE ALL ON FUNCTION public.ufuk_transfer_snapshot() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ufuk_transfer_reserve(p_guard text,p_request uuid,p_bytes bigint,p_essential boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cfg public.ufuk_transfer_settings%ROWTYPE; today date := (now() AT TIME ZONE 'Asia/Baghdad')::date;
 current_used bigint; existing public.ufuk_transfer_reservations%ROWTYPE;
BEGIN
 SELECT * INTO cfg FROM public.ufuk_transfer_settings WHERE id=true;
 IF cfg.guard_sha256 IS NULL OR encode(extensions.digest(coalesce(p_guard,''),'sha256'),'hex') <> cfg.guard_sha256 THEN RAISE EXCEPTION 'Server authorization required' USING ERRCODE='42501'; END IF;
 IF p_request IS NULL OR p_bytes IS NULL OR p_bytes NOT BETWEEN 1 AND 6291456 OR p_essential IS NULL THEN RAISE EXCEPTION 'Invalid reservation'; END IF;
 INSERT INTO public.ufuk_transfer_days(day) VALUES(today) ON CONFLICT DO NOTHING;
 IF FOUND THEN
   DELETE FROM public.ufuk_transfer_reservations WHERE day < today-2;
   DELETE FROM public.ufuk_transfer_days WHERE day < today-35;
 END IF;
 -- Serialize admission across every Vercel instance; memory counters are not used.
 SELECT used_bytes INTO current_used FROM public.ufuk_transfer_days WHERE day=today FOR UPDATE;
 SELECT * INTO existing FROM public.ufuk_transfer_reservations WHERE id=p_request;
 IF FOUND THEN RETURN public.ufuk_transfer_snapshot() || jsonb_build_object('allowed',true); END IF;
 -- Essential catalogue reads remain available. Stop new images at the threshold.
 IF cfg.enabled AND NOT p_essential AND (current_used+p_bytes > cfg.limit_bytes OR (current_used >= cfg.limit_bytes*0.8 AND p_bytes > 512000)) THEN
   UPDATE public.ufuk_transfer_days SET blocked_images=blocked_images+1 WHERE day=today;
   RETURN public.ufuk_transfer_snapshot() || jsonb_build_object('allowed',false);
 END IF;
 INSERT INTO public.ufuk_transfer_reservations(id,day,reserved_bytes) VALUES(p_request,today,p_bytes);
 UPDATE public.ufuk_transfer_days SET used_bytes=used_bytes+p_bytes,requests=requests+1 WHERE day=today;
 RETURN public.ufuk_transfer_snapshot() || jsonb_build_object('allowed',true);
END;
$$;
REVOKE ALL ON FUNCTION public.ufuk_transfer_reserve(text,uuid,bigint,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ufuk_transfer_reserve(text,uuid,bigint,boolean) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.ufuk_transfer_finish(p_guard text,p_request uuid,p_actual bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cfg public.ufuk_transfer_settings%ROWTYPE; item public.ufuk_transfer_reservations%ROWTYPE;
BEGIN
 SELECT * INTO cfg FROM public.ufuk_transfer_settings WHERE id=true;
 IF cfg.guard_sha256 IS NULL OR encode(extensions.digest(coalesce(p_guard,''),'sha256'),'hex') <> cfg.guard_sha256 THEN RAISE EXCEPTION 'Server authorization required' USING ERRCODE='42501'; END IF;
 IF p_actual IS NULL OR p_actual NOT BETWEEN 0 AND 6356992 THEN RAISE EXCEPTION 'Invalid transfer size'; END IF;
 SELECT * INTO item FROM public.ufuk_transfer_reservations WHERE id=p_request FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reservation unavailable'; END IF;
 IF NOT item.settled THEN
   UPDATE public.ufuk_transfer_days SET used_bytes=greatest(0,used_bytes-item.reserved_bytes+p_actual) WHERE day=item.day;
   UPDATE public.ufuk_transfer_reservations SET settled=true WHERE id=p_request;
 END IF;
 RETURN public.ufuk_transfer_snapshot();
END;
$$;
REVOKE ALL ON FUNCTION public.ufuk_transfer_finish(text,uuid,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ufuk_transfer_finish(text,uuid,bigint) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.ufuk_transfer_admin(p_limit_mb integer DEFAULT NULL,p_enabled boolean DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'admin'::public.app_role) THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_limit_mb IS NOT NULL AND p_limit_mb NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Invalid daily limit'; END IF;
 UPDATE public.ufuk_transfer_settings SET limit_bytes=coalesce(p_limit_mb::bigint*1000000,limit_bytes),enabled=coalesce(p_enabled,enabled) WHERE id=true;
 -- Bound retention without touching orders, products, or customer records.
 DELETE FROM public.ufuk_transfer_reservations WHERE day < (now() AT TIME ZONE 'Asia/Baghdad')::date-2;
 DELETE FROM public.ufuk_transfer_days WHERE day < (now() AT TIME ZONE 'Asia/Baghdad')::date-35;
 RETURN public.ufuk_transfer_snapshot();
END;
$$;
REVOKE ALL ON FUNCTION public.ufuk_transfer_admin(integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ufuk_transfer_admin(integer,boolean) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
