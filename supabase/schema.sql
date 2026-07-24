-- ============================================================
-- Dealer Management System — полная схема БД
-- Выполнить целиком в Supabase → SQL Editor → New query → Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- СПРАВОЧНИКИ (Settings)
-- ------------------------------------------------------------
create table if not exists countries (
  id serial primary key,
  name text not null unique
);

create table if not exists dealer_statuses (
  id serial primary key,
  name text not null unique,
  color text default '#64748b',
  sort_order int default 0
);

insert into dealer_statuses (name, color, sort_order) values
  ('New', '#94a3b8', 1),
  ('First Contact', '#60a5fa', 2),
  ('Negotiation', '#fbbf24', 3),
  ('Contract Signing', '#fb923c', 4),
  ('Active', '#22c55e', 5),
  ('Inactive', '#ef4444', 6)
on conflict (name) do nothing;

create table if not exists product_categories (
  id serial primary key,
  name text not null unique
);

create table if not exists currencies (
  id serial primary key,
  code text not null unique
);
insert into currencies (code) values ('EUR'), ('USD') on conflict do nothing;

-- ------------------------------------------------------------
-- ДИЛЕРЫ
-- ------------------------------------------------------------
create table if not exists dealers (
  id uuid primary key default uuid_generate_v4(),
  status text default 'New',
  company_name text not null,
  country text,
  city text,
  address text,
  num_stores int,
  website text,
  marketplace_links text,
  social_links text,
  contact_person text,
  phone text,
  email text,
  assigned_manager text,
  discount_percent numeric default 0,
  annual_sales_plan numeric default 0,
  ai_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by text
);

create table if not exists dealer_comments (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid references dealers(id) on delete cascade,
  author text,
  text text not null,
  created_at timestamptz default now()
);

create table if not exists dealer_documents (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid references dealers(id) on delete cascade,
  name text not null,
  doc_type text,
  file_path text not null,
  uploaded_by text,
  comment text,
  created_at timestamptz default now()
);

create table if not exists dealer_inventory (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid references dealers(id) on delete cascade,
  sku text,
  product_name text,
  quantity numeric default 0,
  value_eur numeric default 0,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ПРОДУКТЫ (Фаза 2)
-- ------------------------------------------------------------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  product_name text not null,
  category text,
  group_name text,
  subgroup text,
  purchase_price numeric,
  dealer_price numeric,
  retail_price numeric,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  volume_m3 numeric,
  gross_weight_kg numeric,
  net_weight_kg numeric,
  hs_code text,
  customs_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ЗАКАЗЫ (Фаза 2)
-- ------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  dealer_id uuid references dealers(id),
  order_date date default current_date,
  currency text default 'EUR',
  status text default 'New',
  ready_date date,
  shipment_date date,
  delivery_date date,
  carrier text,
  tracking_number text,
  shipping_cost numeric,
  logistics_comment text,
  boxes int,
  pallets int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  sku text,
  product_name text,
  quantity numeric,
  unit_price numeric,
  discount_percent numeric default 0,
  total numeric,
  -- Простой статус позиции: Waiting (ждём/заказано) / Invoiced (выставлен счёт) / Cancelled (отменено)
  status text default 'Waiting',
  note text,
  created_at timestamptz default now()
);

create table if not exists order_documents (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  name text,
  doc_type text,
  file_path text,
  created_at timestamptz default now()
);

create table if not exists order_comments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  author text,
  text text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ЗАДАЧИ
-- ------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  dealer_id uuid references dealers(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  assigned_to text,
  priority text default 'Medium', -- Low / Medium / High
  status text default 'New',      -- New / In Progress / Completed / Cancelled
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — доступ только авторизованным пользователям
-- ------------------------------------------------------------
alter table dealers enable row level security;
alter table dealer_comments enable row level security;
alter table dealer_documents enable row level security;
alter table dealer_inventory enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_documents enable row level security;
alter table order_comments enable row level security;
alter table tasks enable row level security;
alter table countries enable row level security;
alter table dealer_statuses enable row level security;
alter table product_categories enable row level security;
alter table currencies enable row level security;

-- Простая политика: любой залогиненный пользователь (сотрудник) может всё делать
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'dealers','dealer_comments','dealer_documents','dealer_inventory',
    'products','orders','order_items','order_documents','order_comments',
    'tasks','countries','dealer_statuses','product_categories','currencies'
  ])
  loop
    execute format('drop policy if exists "authenticated_full_access" on %I;', t);
    execute format(
      'create policy "authenticated_full_access" on %I for all to authenticated using (true) with check (true);', t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- STORAGE — бакет для документов (создайте также вручную в Dashboard → Storage,
-- если этот блок не выполнится автоматически)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "authenticated_storage_access" on storage.objects;
create policy "authenticated_storage_access" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents')
  with check (bucket_id = 'documents');
