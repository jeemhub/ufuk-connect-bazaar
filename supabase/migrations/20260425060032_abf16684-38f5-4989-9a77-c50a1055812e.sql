
-- =========================================
-- CATEGORIES
-- =========================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_ar text not null,
  name_en text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories: public read" on public.categories
  for select to anon, authenticated using (true);
create policy "Categories: admin write" on public.categories
  for all to authenticated using (has_role(auth.uid(),'admin'))
  with check (has_role(auth.uid(),'admin'));

-- =========================================
-- SUBCATEGORIES
-- =========================================
create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  created_at timestamptz not null default now()
);

alter table public.subcategories enable row level security;

create policy "Subcats: public read" on public.subcategories
  for select to anon, authenticated using (true);
create policy "Subcats: admin write" on public.subcategories
  for all to authenticated using (has_role(auth.uid(),'admin'))
  with check (has_role(auth.uid(),'admin'));

-- =========================================
-- PRODUCTS
-- =========================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name_ar text not null,
  name_en text not null,
  desc_ar text,
  desc_en text,
  brand text not null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory text,
  price_iqd bigint not null default 0,
  stock int not null default 0,
  image_url text,
  datasheet_url text,
  datasheet_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.products (category_id);
create index on public.products (is_active);

alter table public.products enable row level security;

create policy "Products: public read active" on public.products
  for select to anon, authenticated using (is_active = true or has_role(auth.uid(),'admin'));
create policy "Products: admin write" on public.products
  for all to authenticated using (has_role(auth.uid(),'admin'))
  with check (has_role(auth.uid(),'admin'));

create trigger products_updated
  before update on public.products
  for each row execute function public.set_updated_at();

-- =========================================
-- ORDERS
-- =========================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default ('ORD-' || to_char(now(),'YYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  user_id uuid,
  customer_name text not null,
  customer_phone text not null,
  customer_city text,
  total_iqd bigint not null default 0,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Orders: admin all" on public.orders
  for all to authenticated using (has_role(auth.uid(),'admin'))
  with check (has_role(auth.uid(),'admin'));
create policy "Orders: user reads own" on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy "Orders: anyone creates" on public.orders
  for insert to anon, authenticated
  with check (
    char_length(customer_name) between 2 and 120
    and char_length(customer_phone) between 6 and 30
  );

create trigger orders_updated
  before update on public.orders
  for each row execute function public.set_updated_at();

-- =========================================
-- ORDER ITEMS
-- =========================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity int not null check (quantity > 0),
  unit_price_iqd bigint not null default 0,
  created_at timestamptz not null default now()
);

create index on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "Items: admin all" on public.order_items
  for all to authenticated using (has_role(auth.uid(),'admin'))
  with check (has_role(auth.uid(),'admin'));
create policy "Items: anyone insert" on public.order_items
  for insert to anon, authenticated with check (true);
create policy "Items: user reads own via order" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- =========================================
-- STORAGE BUCKET FOR PRODUCT IMAGES
-- =========================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Product imgs: public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Product imgs: admin upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and has_role(auth.uid(),'admin'));

create policy "Product imgs: admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and has_role(auth.uid(),'admin'));

create policy "Product imgs: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and has_role(auth.uid(),'admin'));

-- =========================================
-- SEED CATEGORIES
-- =========================================
insert into public.categories (key, name_ar, name_en, sort) values
  ('networking','الشبكات','Networking',1),
  ('solar','الطاقة الشمسية','Solar Energy',2),
  ('ups','أنظمة UPS','UPS Systems',3),
  ('accessories','ملحقات','Accessories',4);

-- =========================================
-- SEED PRODUCTS
-- =========================================
insert into public.products (sku, name_ar, name_en, desc_en, brand, category_id, subcategory, price_iqd, stock, image_url) values
  ('MK-CCR2004','راوتر ميكروتك CCR2004-1G-12S+2XS','MikroTik CCR2004-1G-12S+2XS Router','High-performance cloud core router with 12 SFP+ and 2 SFP28 ports.','MikroTik',(select id from public.categories where key='networking'),'Routers',1850000,14,'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=80'),
  ('MK-CRS328','سويتش ميكروتك CRS328-24P-4S+','MikroTik CRS328-24P-4S+ Switch','24-port Gigabit PoE+ switch with 4x SFP+ uplinks.','MikroTik',(select id from public.categories where key='networking'),'Switches',980000,7,'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&q=80'),
  ('RJ-RG-AP840','نقطة وصول روجي RG-AP840-I','Ruijie RG-AP840-I Access Point','Wi-Fi 6 enterprise access point with 2.97 Gbps throughput.','Ruijie',(select id from public.categories where key='networking'),'Access Points',540000,0,'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80'),
  ('MUST-PV1800','إنفرتر مَست PV1800 5KW','Must PV1800 5KW Inverter','Hybrid solar inverter with MPPT controller, 5KW output.','Must',(select id from public.categories where key='solar'),'Inverters',1450000,22,'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80'),
  ('MUST-PANEL-550','لوح شمسي 550W مونوكريستال','Solar Panel 550W Monocrystalline','High-efficiency monocrystalline solar panel, 550W output.','Must',(select id from public.categories where key='solar'),'Panels',165000,3,'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80'),
  ('MUST-UPS-3K','UPS مَست 3KVA Online','Must 3KVA Online UPS','True online double-conversion UPS, 3KVA capacity.','Must',(select id from public.categories where key='ups'),'Enterprise UPS',720000,11,'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80'),
  ('RJ-RG-S2910','سويتش روجي S2910-24GT4XS-E','Ruijie S2910-24GT4XS-E Switch','24-port Gigabit L2+ managed switch with 4x 10G SFP+ uplinks.','Ruijie',(select id from public.categories where key='networking'),'Switches',880000,9,'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80'),
  ('MK-HAP-AX3','ميكروتك hAP ax³','MikroTik hAP ax³','Wi-Fi 6 home access point with 5x Gigabit Ethernet ports.','MikroTik',(select id from public.categories where key='networking'),'Routers',285000,32,'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=80');
