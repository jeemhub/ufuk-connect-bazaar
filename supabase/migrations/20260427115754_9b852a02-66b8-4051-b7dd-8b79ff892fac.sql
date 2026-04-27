CREATE OR REPLACE FUNCTION public.admin_set_verified(_user_id uuid, _verified boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin only';
  end if;

  update public.profiles
    set is_verified = _verified, updated_at = now()
    where id = _user_id;
end;
$function$;