-- Add customer_number column to public.profiles and functions for admin assignment & balance access.

alter table public.profiles
  add column if not exists customer_number text;

create index if not exists profiles_customer_number_idx
  on public.profiles(customer_number);

-- Allow admins to update any profile (e.g. setting customer_number)
drop policy if exists "Profiles: admin update all" on public.profiles;
create policy "Profiles: admin update all" on public.profiles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Update admin_list_users to return customer_number
drop function if exists public.admin_list_users();

create function public.admin_list_users()
 returns table(
   id uuid,
   email text,
   full_name text,
   phone text,
   created_at timestamp with time zone,
   roles text[],
   quote_count bigint,
   is_verified boolean,
   customer_number text
 )
 language plpgsql
 stable security definer
 set search_path to 'public', 'auth'
as $function$
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
    coalesce(p.is_verified, false),
    p.customer_number
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$function$;

revoke all on function public.admin_list_users() from anon;
grant execute on function public.admin_list_users() to authenticated;

-- RPC for admin to assign customer_number to a user
create or replace function public.admin_set_customer_number(_user_id uuid, _customer_number text)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception using errcode = '42501', message = 'admin only';
  end if;
  update public.profiles
  set customer_number = nullif(btrim(_customer_number), '')
  where id = _user_id;
end;
$function$;

revoke all on function public.admin_set_customer_number(uuid, text) from anon;
grant execute on function public.admin_set_customer_number(uuid, text) to authenticated;

-- Allow user to select their own customer_balance matching their profile customer_number
drop policy if exists "Customer balances: user read own balance" on public.customer_balances;
create policy "Customer balances: user read own balance"
on public.customer_balances
for select
to authenticated
using (
  customer_number in (
    select p.customer_number from public.profiles p where p.id = auth.uid() and p.customer_number is not null and p.customer_number <> ''
  )
);
