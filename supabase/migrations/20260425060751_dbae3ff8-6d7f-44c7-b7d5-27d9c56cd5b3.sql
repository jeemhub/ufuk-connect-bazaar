
-- =========================================
-- 1) Extend price columns
-- =========================================
alter table public.products
  add column if not exists price_wholesale_iqd bigint not null default 0,
  add column if not exists price_dealer_iqd    bigint not null default 0;

-- =========================================
-- 2) Extend app_role enum
-- =========================================
alter type public.app_role add value if not exists 'wholesale';
alter type public.app_role add value if not exists 'dealer';
