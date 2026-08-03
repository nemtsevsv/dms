-- ============================================================
-- MIGRATION 8 — Run in Supabase → SQL Editor → New query → Run
-- Fixes Inventory showing no Product name: the historical import
-- didn't carry product_name on each stock movement (by design — it's
-- redundant data). The view now looks the name up from the Products
-- catalog instead, which is the single source of truth and fixes
-- this for all past AND future stock movements, no re-import needed.
-- Safe to run any number of times.
-- ============================================================

create or replace view store_inventory_current
with (security_invoker = true) as
select
  m.store_id,
  m.sku,
  coalesce(max(p.product_name), max(m.product_name), m.sku) as product_name,
  sum(case when m.type = 'sale' then -m.quantity else m.quantity end) as quantity
from store_stock_movements m
left join products p on p.sku = m.sku
group by m.store_id, m.sku;
