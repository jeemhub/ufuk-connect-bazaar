
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz,
  roles text[],
  quote_count bigint
)
language plpgsql stable security definer set search_path = public, auth
as $$
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
    coalesce((select count(*) from public.quote_requests q where q.email = u.email), 0)
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_set_pricing_role(_user_id uuid, _role text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin only';
  end if;
  if _role not in ('customer','wholesale','dealer') then
    raise exception 'invalid pricing role';
  end if;

  -- remove existing pricing roles (keep admin if present)
  delete from public.user_roles
  where user_id = _user_id and role in ('customer','wholesale','dealer');

  insert into public.user_roles (user_id, role)
  values (_user_id, _role::app_role);
end;
$$;

grant execute on function public.admin_set_pricing_role(uuid, text) to authenticated;
