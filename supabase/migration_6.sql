-- ============================================================
-- MIGRATION 6 — Own Stores module (retail, separate from Dealers)
-- Run in Supabase → SQL Editor → New query → Run, at the end of
-- the rollout (after the app code is deployed), as agreed.
-- Adds new tables only — nothing in the Dealer/Order/Invoice/
-- Product tables is touched or deleted.
-- ============================================================

-- ------------------------------------------------------------
-- STORES
-- ------------------------------------------------------------
create table if not exists stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country text,
  city text,
  address text,
  currency text not null default 'EUR',
  fx_rate_to_eur numeric not null default 1, -- 1 unit of local currency = fx_rate_to_eur EUR
  fx_rate_updated_at timestamptz,
  status text default 'Active', -- Active / Inactive
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists store_schedule (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  day_of_week int not null, -- 0=Sunday .. 6=Saturday
  is_open boolean default true,
  open_time time,
  close_time time,
  unique (store_id, day_of_week)
);

-- Who works where. Keyed by email (not auth user id) so admins can
-- assign a person to a store before that person has ever logged in.
create table if not exists store_users (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  email text not null unique,
  display_name text,
  role text not null default 'seller', -- seller / store_manager
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- PRICING & PLAN
-- ------------------------------------------------------------
create table if not exists store_price_overrides (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  sku text not null,
  local_price numeric not null,
  updated_at timestamptz default now(),
  unique (store_id, sku)
);

create table if not exists store_sales_plan (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  year int not null,
  month int not null, -- 1-12
  plan_amount_local numeric not null default 0,
  unique (store_id, year, month)
);

-- ------------------------------------------------------------
-- INVENTORY — ledger only. "Current stock" is never stored directly,
-- it is always SUM(movements), so it can never drift out of sync.
-- ------------------------------------------------------------
create table if not exists store_stock_movements (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  sku text not null,
  product_name text,
  type text not null, -- initial / delivery / sale / adjustment
  quantity numeric not null, -- always positive for initial/delivery/sale; signed for adjustment
  occurred_at timestamptz default now(),
  reference_id uuid, -- links back to a delivery or a receipt, informational only
  created_by text,
  note text
);

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

create table if not exists store_deliveries (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  delivery_date date default current_date,
  note text,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists store_delivery_items (
  id uuid primary key default uuid_generate_v4(),
  delivery_id uuid references store_deliveries(id) on delete cascade,
  sku text not null,
  product_name text,
  quantity numeric not null
);

-- ------------------------------------------------------------
-- DAILY REPORT
-- ------------------------------------------------------------
create table if not exists daily_reports (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  report_date date not null default current_date,
  staff_count numeric,
  weather int, -- 1-5
  season int, -- 1-5
  expected_visitors int, -- 1-5
  expected_customers int, -- 1-5
  inventory_available int, -- 1-5
  supply_pipeline int, -- 1-5
  self_evaluation int, -- 1-5
  submitted_by text,
  manual_receipts int, -- admin-only override of the auto-computed receipts count
  manual_sales_core numeric, -- admin-only override of core-item sales
  manual_sales_accessories numeric, -- admin-only override of accessory sales
  closed_at timestamptz, -- when "Close the day" was pressed
  closed_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (store_id, report_date)
);

create table if not exists store_weekly_focus (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  week_start_date date not null, -- Monday of that week
  product_focus text,
  customer_focus text,
  activity_focus text,
  set_by text,
  updated_at timestamptz default now(),
  unique (store_id, week_start_date)
);

create table if not exists store_traffic_events (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  event_type text not null, -- visitor / call / test_drive
  customer_type text not null, -- new / existing
  occurred_at timestamptz default now(),
  created_by text
);

create table if not exists store_receipts (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  occurred_at timestamptz default now(),
  created_by text
);

create table if not exists store_receipt_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references store_receipts(id) on delete cascade,
  sku text,
  product_name text,
  quantity numeric not null,
  unit_price numeric not null,
  total numeric not null,
  item_type text not null default 'core' -- core / accessory, chosen manually per line
);

-- ------------------------------------------------------------
-- ACCESS CONTROL
-- Anyone whose email is in store_users is store staff, restricted
-- to their own store_id. Everyone else keeps full admin access,
-- exactly as before this migration — no bootstrapping step needed
-- for existing admin/manager logins.
-- ------------------------------------------------------------
-- SECURITY DEFINER is essential here: these functions are called from
-- inside RLS policies on store_users itself. Without SECURITY DEFINER,
-- their internal query against store_users would be subject to that same
-- table's RLS policy (which calls these functions) — a circular check
-- that produces inconsistent results. Running as the function owner
-- bypasses RLS for this one lookup and breaks the cycle cleanly.
create or replace function is_store_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from store_users su where su.email = auth.jwt() ->> 'email');
$$;

create or replace function my_store_id() returns uuid
language sql stable security definer set search_path = public as $$
  select store_id from store_users where email = auth.jwt() ->> 'email' limit 1;
$$;

create or replace function my_store_role() returns text
language sql stable security definer set search_path = public as $$
  select role from store_users where email = auth.jwt() ->> 'email' limit 1;
$$;

-- Tighten the EXISTING dealer-facing tables: from now on only admins
-- (i.e. anyone NOT listed in store_users) can access them. Store
-- staff logins are new to this database, so this must be added now.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'dealers','dealer_comments','dealer_documents','dealer_inventory',
    'products','orders','order_items','order_documents','order_comments',
    'tasks','countries','dealer_statuses','product_categories','currencies',
    'brands','dealer_history','invoices','invoice_items'
  ])
  loop
    execute format('drop policy if exists "authenticated_full_access" on %I;', t);
    execute format(
      'create policy "admin_only_access" on %I for all to authenticated using (not is_store_staff()) with check (not is_store_staff());', t
    );
  end loop;
end $$;

-- Store staff need read-only access to the shared product catalog (for the
-- local price list and the sale search) — everything else on this table
-- stays admin-only via the policy created above.
create policy "staff_read_products" on products for select to authenticated using (is_store_staff());

-- Store module tables
alter table stores enable row level security;
alter table store_schedule enable row level security;
alter table store_users enable row level security;
alter table store_price_overrides enable row level security;
alter table store_sales_plan enable row level security;
alter table store_stock_movements enable row level security;
alter table store_deliveries enable row level security;
alter table store_delivery_items enable row level security;
alter table daily_reports enable row level security;
alter table store_weekly_focus enable row level security;
alter table store_traffic_events enable row level security;
alter table store_receipts enable row level security;
alter table store_receipt_items enable row level security;

-- Admin: full access to everything in the store module.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'stores','store_schedule','store_users','store_price_overrides','store_sales_plan',
    'store_stock_movements','store_deliveries','store_delivery_items','daily_reports',
    'store_weekly_focus','store_traffic_events','store_receipts','store_receipt_items'
  ])
  loop
    execute format('drop policy if exists "admin_full_access" on %I;', t);
    execute format(
      'create policy "admin_full_access" on %I for all to authenticated using (not is_store_staff()) with check (not is_store_staff());', t
    );
  end loop;
end $$;

-- Store staff: read-only on reference/setup data for their own store.
do $$
declare
  t text;
begin
  for t in select unnest(array['stores','store_schedule','store_price_overrides','store_sales_plan','store_deliveries','store_delivery_items'])
  loop
    execute format('drop policy if exists "staff_read_own_store" on %I;', t);
  end loop;
end $$;

create policy "staff_read_own_store" on stores for select to authenticated using (is_store_staff() and id = my_store_id());
create policy "staff_read_own_store" on store_schedule for select to authenticated using (is_store_staff() and store_id = my_store_id());
create policy "staff_read_own_row" on store_users for select to authenticated using (is_store_staff() and email = auth.jwt() ->> 'email');
create policy "staff_read_own_store" on store_price_overrides for select to authenticated using (is_store_staff() and store_id = my_store_id());
create policy "staff_read_own_store" on store_sales_plan for select to authenticated using (is_store_staff() and store_id = my_store_id());
create policy "staff_read_own_store" on store_deliveries for select to authenticated using (is_store_staff() and store_id = my_store_id());
create policy "staff_read_own_store" on store_delivery_items for select to authenticated using (
  is_store_staff() and exists (select 1 from store_deliveries d where d.id = delivery_id and d.store_id = my_store_id())
);

-- Store staff: view current stock, and record movements created by selling
-- (insert only — the ledger is append-only, nothing gets edited or removed
-- by staff; corrections are an admin action via Deliveries/adjustments).
create policy "staff_read_own_store" on store_stock_movements for select to authenticated using (is_store_staff() and store_id = my_store_id());
create policy "staff_insert_own_store" on store_stock_movements for insert to authenticated with check (is_store_staff() and store_id = my_store_id());

-- Store staff: full read/write on their own store's daily operational data.
create policy "staff_own_store_rw" on daily_reports for all to authenticated
  using (is_store_staff() and store_id = my_store_id()) with check (is_store_staff() and store_id = my_store_id());
create policy "staff_own_store_rw" on store_traffic_events for all to authenticated
  using (is_store_staff() and store_id = my_store_id()) with check (is_store_staff() and store_id = my_store_id());
create policy "staff_own_store_rw" on store_receipts for all to authenticated
  using (is_store_staff() and store_id = my_store_id()) with check (is_store_staff() and store_id = my_store_id());
create policy "staff_own_store_rw" on store_receipt_items for all to authenticated
  using (is_store_staff() and exists (select 1 from store_receipts r where r.id = receipt_id and r.store_id = my_store_id()))
  with check (is_store_staff() and exists (select 1 from store_receipts r where r.id = receipt_id and r.store_id = my_store_id()));

-- Weekly focus: seller can read, only a store_manager can write it.
create policy "staff_read_focus" on store_weekly_focus for select to authenticated using (is_store_staff() and store_id = my_store_id());
create policy "manager_write_focus" on store_weekly_focus for insert to authenticated
  with check (is_store_staff() and store_id = my_store_id() and my_store_role() = 'store_manager');
create policy "manager_update_focus" on store_weekly_focus for update to authenticated
  using (is_store_staff() and store_id = my_store_id() and my_store_role() = 'store_manager')
  with check (is_store_staff() and store_id = my_store_id() and my_store_role() = 'store_manager');
