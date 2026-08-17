-- ============================================================
-- MIGRATION 22 — Run in Supabase → SQL Editor → New query → Run
--
-- Adds customs/logistics fields:
-- - products: the full set (customs tariff no., country of origin,
--   weights, volume, dimensions) — the source of truth per SKU.
-- - order_items / invoice_items: customs tariff no. + country of origin
--   (auto-filled from the product when picked, still editable per line —
--   a dealer's actual paperwork can differ from the catalog default) and
--   serial number (free text, line-specific, no product-level default).
-- Safe to run any number of times.
-- ============================================================

alter table products add column if not exists customs_tariff_no text;
alter table products add column if not exists country_of_origin text;
alter table products add column if not exists gross_weight numeric;
alter table products add column if not exists net_weight numeric;
alter table products add column if not exists weight_unit text;
alter table products add column if not exists volume numeric;
alter table products add column if not exists volume_unit text;
alter table products add column if not exists dimensions text;

alter table order_items add column if not exists customs_tariff_no text;
alter table order_items add column if not exists country_of_origin text;
alter table order_items add column if not exists serial_number text;

alter table invoice_items add column if not exists customs_tariff_no text;
alter table invoice_items add column if not exists country_of_origin text;
alter table invoice_items add column if not exists serial_number text;
