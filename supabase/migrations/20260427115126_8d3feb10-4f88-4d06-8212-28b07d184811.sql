DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE FUNCTION public.admin_list_users()
 RETURNS TABLE(id uuid, email text, full_name text, phone text, created_at timestamp with time zone, roles text[], quote_count bigint, is_verified boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin only';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(p.full_name, '')::text,
    coalesce(p.phone, '')::text,
    u.created_at,
    coalesce((select array_agg(r.role::text) from public.user_roles r where r.user_id = u.id), '{}'),
    coalesce((select count(*) from public.quote_requests q where q.email = u.email), 0),
    coalesce(p.is_verified, false)
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$function$;