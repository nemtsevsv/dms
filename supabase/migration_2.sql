-- ============================================================
-- MIGRATION 2 — Run in Supabase → SQL Editor → New query → Run
-- Safe on your existing database: only adds new tables/columns,
-- does not delete or change any existing data.
-- ============================================================

-- ------------------------------------------------------------
-- Reference tables: Product Categories & Brands
-- ------------------------------------------------------------
insert into product_categories (name) values
  ('Photo'), ('Sport Optic'), ('Watch'), ('Laser TV'), ('Mobile')
on conflict (name) do nothing;

create table if not exists brands (
  id serial primary key,
  name text not null unique
);

-- ------------------------------------------------------------
-- Dealers: multi-select categories/brands, status-change tracking
-- ------------------------------------------------------------
alter table dealers add column if not exists product_categories text[] default '{}';
alter table dealers add column if not exists brands text[] default '{}';
alter table dealers add column if not exists status_changed_at timestamptz default now();

-- Change-history log for dealer cards
create table if not exists dealer_history (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid references dealers(id) on delete cascade,
  field_name text not null,
  old_value text,
  new_value text,
  changed_by text,
  changed_at timestamptz default now()
);

create or replace function log_dealer_changes()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
    insert into dealer_history (dealer_id, field_name, old_value, new_value, changed_by)
      values (new.id, 'status', old.status, new.status, new.updated_by);
  end if;
  if new.company_name is distinct from old.company_name then
    insert into dealer_history (dealer_id, field_name, old_value, new_value, changed_by)
      values (new.id, 'company_name', old.company_name, new.company_name, new.updated_by);
  end if;
  if new.assigned_manager is distinct from old.assigned_manager then
    insert into dealer_history (dealer_id, field_name, old_value, new_value, changed_by)
      values (new.id, 'assigned_manager', old.assigned_manager, new.assigned_manager, new.updated_by);
  end if;
  if new.discount_percent is distinct from old.discount_percent then
    insert into dealer_history (dealer_id, field_name, old_value, new_value, changed_by)
      values (new.id, 'discount_percent', old.discount_percent::text, new.discount_percent::text, new.updated_by);
  end if;
  if new.annual_sales_plan is distinct from old.annual_sales_plan then
    insert into dealer_history (dealer_id, field_name, old_value, new_value, changed_by)
      values (new.id, 'annual_sales_plan', old.annual_sales_plan::text, new.annual_sales_plan::text, new.updated_by);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_dealer_changes on dealers;
create trigger trg_log_dealer_changes
  before update on dealers
  for each row execute function log_dealer_changes();

alter table dealer_history enable row level security;
drop policy if exists "authenticated_full_access" on dealer_history;
create policy "authenticated_full_access" on dealer_history for all to authenticated using (true) with check (true);

alter table brands enable row level security;
drop policy if exists "authenticated_full_access" on brands;
create policy "authenticated_full_access" on brands for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- Products: new fields per updated spec (Brand, List Price, Retail incl. VAT)
-- purchase_price column is left in the database untouched (no data loss),
-- it is simply no longer shown in the interface.
-- ------------------------------------------------------------
alter table products add column if not exists brand text;
alter table products add column if not exists retail_price_incl_vat numeric;
alter table products add column if not exists list_price numeric;
alter table products alter column product_name drop not null;

-- ------------------------------------------------------------
-- Invoices — created from an Order, fields prefilled but editable afterwards
-- ------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null,
  order_id uuid references orders(id) on delete set null,
  dealer_id uuid references dealers(id),
  invoice_date date default current_date,
  currency text default 'EUR',
  status text default 'Draft', -- Draft / Sent / Paid / Cancelled
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade,
  sku text,
  product_name text,
  quantity numeric,
  unit_price numeric,
  total numeric,
  created_at timestamptz default now()
);

alter table invoices enable row level security;
alter table invoice_items enable row level security;

drop policy if exists "authenticated_full_access" on invoices;
create policy "authenticated_full_access" on invoices for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_full_access" on invoice_items;
create policy "authenticated_full_access" on invoice_items for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- Tasks: creator field (assigned_to already existed from Migration 1)
-- ------------------------------------------------------------
alter table tasks add column if not exists created_by text;
