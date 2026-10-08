// Run with: node scripts/verify-commerce-db.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js
// Uses an isolated in-memory PostgreSQL database. Never connects to production.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {PGlite} = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.uid',true),'')::uuid $$;
CREATE TABLE profiles(id uuid,is_blocked boolean DEFAULT false);
CREATE TABLE user_roles(user_id uuid,role text);
CREATE FUNCTION has_role(u uuid,r text) RETURNS boolean LANGUAGE sql AS $$ SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=u AND role=r) $$;
CREATE TABLE products(id uuid PRIMARY KEY,name_ar text,price_iqd bigint,price_dealer_iqd bigint DEFAULT 0,price_wholesale_iqd bigint DEFAULT 0,stock int,is_active boolean DEFAULT true);
CREATE TABLE site_pages(key text UNIQUE,title_ar text,title_en text,content_ar text);
CREATE TABLE orders(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_no text UNIQUE DEFAULT ('ORD-'||gen_random_uuid()::text),user_id uuid,customer_name text NOT NULL,customer_phone text NOT NULL,customer_city text,customer_address text,notes text,total_iqd bigint,status text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE order_items(order_id uuid REFERENCES orders(id),product_id uuid,product_name text,quantity int,unit_price_iqd bigint);
CREATE TABLE notifications(user_id uuid,type text,title text,body text,link text);
INSERT INTO products VALUES('11111111-1111-1111-1111-111111111111','Test item',10000,7000,8000,10,true),('22222222-2222-2222-2222-222222222222','Unavailable',0,0,0,0,true);
INSERT INTO auth.users VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
`);
await db.exec(await readFile(new URL('../supabase/migrations/20261007100000_commerce_features.sql',import.meta.url),'utf8'));
let checks = 0;
const check = (a,b) => {assert.deepEqual(a,b);checks++;};
const place = (items,phone='٠٧٧١٦٩٩٢٩٥٥') => db.query('SELECT place_order($1,$2,$3,$4,$5,$6::jsonb) AS result',['Test customer',phone,'Basra','Test address','',JSON.stringify(items)]);
const good = [{id:'11111111-1111-1111-1111-111111111111',quantity:2,price:1}];
const guest = (await place(good)).rows[0].result;
check(guest.total_iqd,20000); // Client price ignored.
check((await db.query('SELECT count(*)::int AS n FROM order_items')).rows[0].n,1);
check((await db.query('SELECT customer_phone FROM orders')).rows[0].customer_phone,'07716992955');
const tracked = (await db.query('SELECT * FROM track_order($1,$2)',[guest.order_no,'+9647716992955'])).rows;
check(Object.keys(tracked[0]).sort(),['order_no','status','updated_at']);
check((await db.query('SELECT * FROM track_order($1,$2)',[guest.order_no,'07712345678'])).rows,[]);
await db.query("UPDATE site_pages SET content_ar=$1 WHERE key='commerce-settings'",[JSON.stringify({payments:'Confirm with sales',zones:[{city:'Basra',enabled:true,fee:5000}]})]);
check((await place(good)).rows[0].result.total_iqd,25000);
const before = (await db.query('SELECT count(*)::int AS n FROM orders')).rows[0].n;
for(const items of [[],[...good,{id:'22222222-2222-2222-2222-222222222222',quantity:1}],[...good,...good],[{...good[0],quantity:99}],[{...good[0],quantity:-1}],[{...good[0],quantity:1.5}]]){
  await assert.rejects(place(items));checks++;
}
check((await db.query('SELECT count(*)::int AS n FROM orders')).rows[0].n,before);
await db.exec("SET test.uid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; INSERT INTO user_roles VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','dealer');");
check((await place(good)).rows[0].result.total_iqd,19000);
await db.exec("DELETE FROM user_roles; INSERT INTO user_roles VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','wholesale');");
check((await place(good)).rows[0].result.total_iqd,21000);
await db.exec("INSERT INTO profiles VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true);");
await assert.rejects(place(good));checks++;
await db.exec("DELETE FROM profiles; SELECT subscribe_stock_alert('22222222-2222-2222-2222-222222222222'); UPDATE products SET stock=3 WHERE id='22222222-2222-2222-2222-222222222222';");
check((await db.query('SELECT count(*)::int AS n FROM notifications')).rows[0].n,1);
await db.exec("UPDATE products SET stock=4 WHERE id='22222222-2222-2222-2222-222222222222';");
check((await db.query('SELECT count(*)::int AS n FROM notifications')).rows[0].n,1);
await db.exec("SET test.uid='';");
await assert.rejects(db.exec("SELECT subscribe_stock_alert('22222222-2222-2222-2222-222222222222')"));checks++;
// Brand ON/OFF matrix, with real PostgreSQL view semantics and server checkout guard.
await db.exec(`
CREATE TYPE app_role AS ENUM('retail','wholesale','dealer','admin','sales');
CREATE FUNCTION has_role(u uuid,r app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT has_role(u,r::text) $$;
CREATE TABLE brands(name text,price_unstable boolean NOT NULL DEFAULT false);
ALTER TABLE products ADD COLUMN brand text DEFAULT ' Test Brand ';
ALTER TABLE products ADD COLUMN sku text,ADD COLUMN name_en text,ADD COLUMN name_data text,
ADD COLUMN desc_ar text,ADD COLUMN desc_en text,ADD COLUMN category_id uuid,ADD COLUMN subcategory text,
ADD COLUMN image_url text,ADD COLUMN datasheet_url text,ADD COLUMN datasheet_name text,ADD COLUMN created_at timestamptz DEFAULT now();
INSERT INTO brands(name) VALUES('test brand');
`);
await db.exec(await readFile(new URL('../supabase/migrations/20260514090123_8c74b178-89e6-4f53-9b24-b3e0c4ee88f5.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase/migrations/20261007140000_brand_price_visibility.sql',import.meta.url),'utf8'));
for (const [role,expected] of [['retail',[10000,null,null]],['wholesale',[10000,8000,null]],['dealer',[10000,8000,7000]]]) {
  await db.exec("DELETE FROM user_roles; SET test.uid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';");
  if(role!=='retail') await db.query('INSERT INTO user_roles VALUES($1,$2)',['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',role]);
  for (const enabled of [false,true,false]) {
    await db.query('UPDATE brands SET price_unstable=$1',[enabled]);
    const row=(await db.query("SELECT price_iqd,price_wholesale_iqd,price_dealer_iqd,price_unstable FROM products_public WHERE price_unstable=$1 AND id='11111111-1111-1111-1111-111111111111'",[enabled])).rows[0];
    check([row.price_iqd,row.price_wholesale_iqd,row.price_dealer_iqd],enabled?[null,null,null]:expected);
    check(row.price_unstable,enabled);
    if(enabled){await assert.rejects(place(good),/Price is unstable/);checks++;}
  }
}
check((await db.query("SELECT price_iqd,price_wholesale_iqd,price_dealer_iqd FROM products WHERE id='11111111-1111-1111-1111-111111111111'")).rows[0],{price_iqd:10000,price_wholesale_iqd:8000,price_dealer_iqd:7000});
// Global pricing overrides brands; turning it OFF restores the individual brand rules.
await db.exec(`CREATE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;`);
await db.exec(await readFile(new URL('../supabase/migrations/20260504122320_7a234704-3986-4871-9368-b71259c8ff10.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase/migrations/20261007160000_staff_tools_settings.sql',import.meta.url),'utf8'));
for(const role of ['retail','wholesale','dealer']) {
  await db.exec("DELETE FROM user_roles; UPDATE brands SET price_unstable=false;");
  if(role!=='retail') await db.query('INSERT INTO user_roles VALUES($1,$2)',['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',role]);
  await db.exec("UPDATE site_pages SET content_ar='true' WHERE key='global-price-visibility';");
  check((await db.query('SELECT count(*)::int n FROM products_public WHERE NOT price_unstable OR price_iqd IS NOT NULL OR price_wholesale_iqd IS NOT NULL OR price_dealer_iqd IS NOT NULL')).rows[0].n,0);
  await assert.rejects(place(good),/Price is unstable/);checks++;
  await db.exec("UPDATE site_pages SET content_ar='false' WHERE key='global-price-visibility';");
  check((await db.query("SELECT price_iqd FROM products_public WHERE id='11111111-1111-1111-1111-111111111111'")).rows[0].price_iqd,10000);
}
await db.exec("UPDATE brands SET price_unstable=true;");
check((await db.query("SELECT brand_price_unstable('test brand') enabled")).rows[0].enabled,true);
await db.exec("UPDATE brands SET price_unstable=false; ALTER FUNCTION has_role(uuid,text) SECURITY DEFINER; GRANT USAGE ON SCHEMA auth TO authenticated,anon; GRANT SELECT ON profiles TO authenticated; GRANT ALL ON admin_preferences TO authenticated;");
// Two staff accounts keep independent pointer settings; own-row RLS hides other accounts.
await db.exec("SET test.uid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; SET ROLE authenticated; INSERT INTO admin_preferences(user_id,pointer_enabled) VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',false);");
check((await db.query('SELECT pointer_enabled FROM admin_preferences')).rows.map(r=>r.pointer_enabled),[false]);
await db.exec("SET test.uid='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; INSERT INTO admin_preferences(user_id,pointer_enabled) VALUES('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',true);");
check((await db.query('SELECT pointer_enabled FROM admin_preferences')).rows.map(r=>r.pointer_enabled),[true]);
check((await db.query("UPDATE admin_preferences SET pointer_enabled=true WHERE user_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' RETURNING user_id")).rows,[]);
await db.exec("SET test.uid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';");
check((await db.query('SELECT pointer_enabled FROM admin_preferences')).rows.map(r=>r.pointer_enabled),[false]);
await db.exec("RESET ROLE; DELETE FROM user_roles; INSERT INTO user_roles VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','sales'),('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','sales'); SET ROLE authenticated;");
check((await db.query('UPDATE sales_tool_settings SET exchange_rate=1750 WHERE id=true RETURNING exchange_rate')).rows[0].exchange_rate,'1750.0000');
await db.exec("SET test.uid='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';");
check((await db.query('SELECT exchange_rate FROM sales_tool_settings')).rows[0].exchange_rate,'1750.0000');
for(const rate of [0,-1,100001]) { await assert.rejects(db.query('UPDATE sales_tool_settings SET exchange_rate=$1',[rate]));checks++; }
await assert.rejects(db.exec("UPDATE sales_tool_settings SET updated_by='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'"));checks++;
await db.exec("RESET ROLE; DELETE FROM user_roles; SET ROLE authenticated;");
check((await db.query('SELECT * FROM sales_tool_settings')).rows,[]);
check((await db.query('UPDATE sales_tool_settings SET exchange_rate=1800 RETURNING id')).rows,[]);
await db.exec("RESET ROLE; SET ROLE anon;");
await assert.rejects(db.query('SELECT * FROM sales_tool_settings'));checks++;
await db.exec('RESET ROLE');
await db.exec(await readFile(new URL('../supabase/migrations/20261008100000_sales_percentage_pricing.sql',import.meta.url),'utf8'));
await db.exec("INSERT INTO user_roles VALUES('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','sales'),('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','sales'); SET test.uid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; SET ROLE authenticated;");
check((await db.query("UPDATE sales_tool_settings SET markup_percentage=10,pricing_mode='percentage' RETURNING markup_percentage,pricing_mode")).rows[0],{markup_percentage:'10.0000',pricing_mode:'percentage'});
await db.exec("SET test.uid='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; UPDATE sales_tool_settings SET exchange_rate=1800;");
check((await db.query('SELECT markup_percentage,pricing_mode FROM sales_tool_settings')).rows[0],{markup_percentage:'10.0000',pricing_mode:'percentage'});
for(const percentage of [-1,100001]) {await assert.rejects(db.query('UPDATE sales_tool_settings SET markup_percentage=$1',[percentage]));checks++;}
await assert.rejects(db.exec("UPDATE sales_tool_settings SET pricing_mode='invalid'"));checks++;
await db.exec("RESET ROLE; DELETE FROM user_roles; SET ROLE authenticated;");
check((await db.query("UPDATE sales_tool_settings SET markup_percentage=20,pricing_mode='parallel' RETURNING id")).rows,[]);
await db.exec('RESET ROLE');
console.log(`${checks} isolated PostgreSQL checks passed: brand/global price masking, role tiers, checkout guards, personal preferences and shared staff exchange-rate permissions.`);
await db.close();
