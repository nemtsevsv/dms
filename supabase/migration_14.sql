-- ============================================================
-- MIGRATION 14 — Run in Supabase → SQL Editor → New query → Run
--
-- Adds the "Purchase" side of an invoice: the LC AG invoice we were
-- billed on, plus the two logistics legs — used to compute the
-- Financial Result (margin) automatically on the invoice card.
-- Safe to run any number of times.
-- ============================================================

alter table invoices add column if not exists lc_ag_invoice_number text;
alter table invoices add column if not exists lc_ag_invoice_date date;
alter table invoices add column if not exists lc_ag_invoice_total numeric;
alter table invoices add column if not exists logistics_de_mn numeric;
alter table invoices add column if not exists logistics_mn_xx numeric;
