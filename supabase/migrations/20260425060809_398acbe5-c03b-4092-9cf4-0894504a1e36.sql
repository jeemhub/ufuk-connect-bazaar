
-- Function: pick visible price by role
create or replace function public.get_visible_price(
  _user_id uuid, _retail bigint, _wholesale bigint, _dealer bigint
) returns bigint
language sql stable security definer set search_path = public
as $$
  select case
    when _user_id is null then _retail
    when public.has_role(_user_id, 'dealer'::app_role)
      and coalesce(_dealer, 0) > 0 then _dealer
    when public.has_role(_user_id, 'wholesale'::app_role)
      and coalesce(_wholesale, 0) > 0 then _wholesale
    else _retail
  end;
$$;

-- Public view exposing only one price (the one the caller is allowed to see)
create or replace view public.products_public
with (security_invoker = on) as
select
  p.id, p.sku, p.name_ar, p.name_en, p.desc_ar, p.desc_en,
  p.brand, p.category_id, p.subcategory,
  public.get_visible_price(auth.uid(), p.price_iqd, p.price_wholesale_iqd, p.price_dealer_iqd) as price_iqd,
  p.stock, p.image_url, p.datasheet_url, p.datasheet_name,
  p.is_active, p.created_at
from public.products p
where p.is_active = true;

grant select on public.products_public to anon, authenticated;

-- Replace the public-read policy on products: keep admin-only, remove public access.
drop policy if exists "Products: public read active" on public.products;
create policy "Products: admin read all" on public.products
  for select to authenticated using (has_role(auth.uid(),'admin'));

create index if not exists idx_user_roles_user on public.user_roles(user_id);
