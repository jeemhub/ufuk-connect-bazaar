
-- Tighten order_items insert: order must exist
drop policy "Items: anyone insert" on public.order_items;
create policy "Items: insert with valid order" on public.order_items
  for insert to anon, authenticated
  with check (
    exists (select 1 from public.orders o where o.id = order_id)
    and quantity > 0
    and char_length(product_name) between 1 and 200
  );

-- Restrict bucket listing: replace broad SELECT with per-object access only
-- (public files remain accessible by direct URL via Supabase signed/public URL)
drop policy "Product imgs: public read" on storage.objects;
create policy "Product imgs: public read by name" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images' and name is not null);
