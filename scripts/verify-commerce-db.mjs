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
console.log(`${checks} isolated PostgreSQL checks passed: atomicity, server prices, quantities, phone matching, minimal tracking response and restock notification.`);
await db.close();
