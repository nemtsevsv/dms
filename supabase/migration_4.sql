-- ============================================================
-- MIGRATION 4 — Run in Supabase → SQL Editor → New query → Run
-- Adds: user profiles (for the sidebar "My Profile" card and task
-- authorship), and allows deleting an Order to also remove its
-- invoices automatically.
-- Safe on your existing database: no data is deleted by this script.
-- ============================================================

-- ------------------------------------------------------------
-- User profiles (Name, Last Name, Position) — one row per login
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  position text,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_read_all" on profiles;
create policy "profiles_read_all" on profiles for select to authenticated using (true);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ------------------------------------------------------------
-- Deleting an Order should also delete its Invoices (which in turn
-- already cascade-delete their Invoice Items). Previously the order
-- could not be deleted while invoices referenced it.
-- ------------------------------------------------------------
alter table invoices drop constraint if exists invoices_order_id_fkey;
alter table invoices
  add constraint invoices_order_id_fkey
  foreign key (order_id) references orders(id) on delete cascade;
