begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'balances-admin@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'balances-sales@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'balances-sales-denied@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'balances-user@example.test')
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
values
  ('10000000-0000-0000-0000-000000000001', 'admin'),
  ('10000000-0000-0000-0000-000000000002', 'sales'),
  ('10000000-0000-0000-0000-000000000003', 'sales')
on conflict (user_id, role) do nothing;

insert into public.sales_permissions (user_id, can_manage_customer_balances)
values
  ('10000000-0000-0000-0000-000000000002', true),
  ('10000000-0000-0000-0000-000000000003', false)
on conflict (user_id) do update
set can_manage_customer_balances = excluded.can_manage_customer_balances;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);

select throws_ok(
  $$ select * from public.search_customer_balances('', 'all', 'all', 1, 50) $$,
  '42501',
  'forbidden',
  'ordinary users cannot search balances'
);

select throws_ok(
  $$ select public.replace_customer_balances('denied.xlsx', '[]'::jsonb) $$,
  '42501',
  'forbidden',
  'ordinary users cannot replace balances'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$ select * from public.search_customer_balances('', 'all', 'all', 1, 50) $$,
  '42501',
  'forbidden',
  'sales users without the permission cannot search balances'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$ select public.replace_customer_balances(
    'old.xls',
    '[{"customer_number":"old","customer_name":"Old customer","debit_usd":"1","credit_usd":"0","debit_iqd":"0","credit_iqd":"0"}]'::jsonb
  ) $$,
  'admin can seed the initial dataset'
);

select throws_ok(
  $$ select public.replace_customer_balances(
    'invalid.xlsx',
    '[{"customer_number":"new","customer_name":"New customer","debit_usd":"not-a-number","credit_usd":"0","debit_iqd":"0","credit_iqd":"0"}]'::jsonb
  ) $$,
  '22023',
  'invalid amount',
  'invalid staged data rejects the replacement'
);

select is(
  (select string_agg(customer_number, ',' order by customer_number) from public.customer_balances),
  'old',
  'failed replacement retains the old rows'
);

select is(
  (select file_name from public.customer_balance_import_state where singleton),
  'old.xls',
  'failed replacement retains the old metadata'
);

select lives_ok(
  $$ select public.replace_customer_balances(
    'new.xlsx',
    '[
      {"customer_number":"1","customer_name":"  Ecolog   شركة ","debit_usd":"10.125","credit_usd":"0","debit_iqd":"0","credit_iqd":"0"},
      {"customer_number":"2","customer_name":"أحمد البصرة","debit_usd":"0","credit_usd":"0","debit_iqd":"0","credit_iqd":"20"},
      {"customer_number":"3","customer_name":"Both","debit_usd":"0","credit_usd":"7","debit_iqd":"5","credit_iqd":"0"}
    ]'::jsonb
  ) $$,
  'valid replacement succeeds'
);

select is(
  (select string_agg(customer_number, ',' order by customer_number) from public.customer_balances),
  '1,2,3',
  'successful replacement removes all old rows'
);

select is(
  (select count(*) from public.search_customer_balances('  ECOLOG  شركة ', 'all', 'all', 1, 50)),
  1::bigint,
  'search normalizes English case and repeated whitespace'
);

select is(
  (select count(*) from public.search_customer_balances('أحمد', 'all', 'all', 1, 50)),
  1::bigint,
  'Arabic name search works'
);

select is(
  (select count(*) from public.search_customer_balances('3', 'all', 'all', 1, 50)),
  1::bigint,
  'customer number search works'
);

select is(
  (select count(*) from public.search_customer_balances('', 'debit', 'usd', 1, 50)),
  1::bigint,
  'USD debit filter checks only positive USD debit'
);

select is(
  (select count(*) from public.search_customer_balances('', 'credit', 'iqd', 1, 50)),
  1::bigint,
  'IQD credit filter checks only positive IQD credit'
);

select is(
  (select count(*) from public.search_customer_balances('', 'debit', 'all', 1, 50)),
  2::bigint,
  'all-currency debit filter checks USD and IQD'
);

select is(
  (select count(*) from public.search_customer_balances('', 'credit', 'all', 1, 50)),
  2::bigint,
  'all-currency credit filter checks USD and IQD'
);

select is(
  (select total_count from public.search_customer_balances('', 'all', 'all', 2, 2) limit 1),
  3::bigint,
  'pagination retains the full filtered count'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$ select * from public.search_customer_balances('', 'all', 'all', 1, 50) $$,
  'permitted sales users can search balances'
);

select * from finish();
rollback;
