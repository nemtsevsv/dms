-- ============================================================
-- MIGRATION 23 — Run in Supabase → SQL Editor → New query → Run
--
-- Customs Tariff No. / Country of Origin / Serial Number turned out to be
-- unneeded on Order items — they only matter on Invoices (and the invoice
-- PDF). Invoices now auto-fill the first two straight from the Product
-- record (matched by SKU) instead of from the order item.
-- Safe to run any number of times.
-- ============================================================

alter table order_items drop column if exists customs_tariff_no;
alter table order_items drop column if exists country_of_origin;
alter table order_items drop column if exists serial_number;
