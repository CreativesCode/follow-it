-- Script para aplicar todas las migraciones en orden
-- ⚠️ Ejecutar en Supabase SQL Editor o usando psql
-- Este archivo combina todas las migraciones para ejecución manual

-- ============================================
-- MIGRACIÓN 1: Initial Schema
-- ============================================

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.order_status as enum ('pending','assigned','en_route','delivered','failed','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_event_type as enum (
    'order_created',
    'order_assigned',
    'order_unassigned',
    'courier_accepted',
    'status_changed',
    'proof_uploaded',
    'note_added',
    'order_canceled',
    'order_failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proof_type as enum ('photo','signature');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Havana',
  created_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','operator')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  code text,
  customer_id uuid references public.customers(id) on delete set null,
  pickup_address text,
  dropoff_address text not null,
  dropoff_lat double precision,
  dropoff_lng double precision,
  notes text,
  items_summary text,
  amount_cents integer,
  currency text default 'USD',
  status public.order_status not null default 'pending',
  assigned_courier_id uuid references public.couriers(id) on delete set null,
  assigned_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  type public.order_event_type not null,
  from_status public.order_status,
  to_status public.order_status,
  courier_id uuid references public.couriers(id) on delete set null,
  note text,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_proofs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid references public.couriers(id) on delete set null,
  type public.proof_type not null,
  storage_path text not null,
  captured_at timestamptz not null default now(),
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.courier_locations (
  id bigserial primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  courier_id uuid not null references public.couriers(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision,
  speed_mps double precision,
  heading double precision,
  recorded_at timestamptz not null default now()
);

create table if not exists public.order_tracking_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  is_revoked boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (order_id, token_hash)
);

-- ============================================
-- MIGRACIÓN 2: Indexes and Triggers
-- ============================================

create index if not exists idx_orders_business_status on public.orders (business_id, status);
create index if not exists idx_orders_assigned_courier on public.orders (assigned_courier_id);
create index if not exists idx_order_events_order on public.order_events (order_id, created_at desc);
create index if not exists idx_order_proofs_order on public.order_proofs (order_id, created_at desc);
create index if not exists idx_courier_locations_courier_time on public.courier_locations (courier_id, recorded_at desc);
create index if not exists idx_tracking_links_order on public.order_tracking_links (order_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ============================================
-- MIGRACIÓN 3: RLS Policies
-- ============================================

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.couriers enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.order_proofs enable row level security;
alter table public.courier_locations enable row level security;
alter table public.order_tracking_links enable row level security;

create or replace function public.is_business_member(bid uuid, uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.business_members bm
    where bm.business_id = bid and bm.user_id = uid and bm.is_active = true
  );
$$;

create or replace function public.get_courier_id(bid uuid, uid uuid)
returns uuid language sql stable as $$
  select c.id
  from public.couriers c
  where c.business_id = bid and c.user_id = uid and c.is_active = true
  limit 1;
$$;

-- Policies
drop policy if exists "businesses_select_member" on public.businesses;
create policy "businesses_select_member" on public.businesses for select using (public.is_business_member(id, auth.uid()));

drop policy if exists "business_members_select_member" on public.business_members;
create policy "business_members_select_member" on public.business_members for select using (public.is_business_member(business_id, auth.uid()));

drop policy if exists "couriers_select_member" on public.couriers;
create policy "couriers_select_member" on public.couriers for select using (public.is_business_member(business_id, auth.uid()) OR user_id = auth.uid());

drop policy if exists "couriers_modify_admin" on public.couriers;
create policy "couriers_modify_admin" on public.couriers for all using (public.is_business_member(business_id, auth.uid())) with check (public.is_business_member(business_id, auth.uid()));

drop policy if exists "customers_crud_member" on public.customers;
create policy "customers_crud_member" on public.customers for all using (public.is_business_member(business_id, auth.uid())) with check (public.is_business_member(business_id, auth.uid()));

drop policy if exists "orders_select_member" on public.orders;
create policy "orders_select_member" on public.orders for select using (public.is_business_member(business_id, auth.uid()) OR assigned_courier_id = public.get_courier_id(business_id, auth.uid()));

drop policy if exists "orders_modify_member" on public.orders;
create policy "orders_modify_member" on public.orders for insert with check (public.is_business_member(business_id, auth.uid()));

drop policy if exists "orders_update_member" on public.orders;
create policy "orders_update_member" on public.orders for update using (public.is_business_member(business_id, auth.uid())) with check (public.is_business_member(business_id, auth.uid()));

drop policy if exists "orders_delete_member" on public.orders;
create policy "orders_delete_member" on public.orders for delete using (public.is_business_member(business_id, auth.uid()));

drop policy if exists "order_events_select" on public.order_events;
create policy "order_events_select" on public.order_events for select using (public.is_business_member(business_id, auth.uid()) OR courier_id = public.get_courier_id(business_id, auth.uid()) OR order_id in (select o.id from public.orders o where o.business_id = order_events.business_id and o.assigned_courier_id = public.get_courier_id(o.business_id, auth.uid())));

drop policy if exists "order_events_insert_member" on public.order_events;
create policy "order_events_insert_member" on public.order_events for insert with check (public.is_business_member(business_id, auth.uid()) OR courier_id = public.get_courier_id(business_id, auth.uid()));

drop policy if exists "order_proofs_select" on public.order_proofs;
create policy "order_proofs_select" on public.order_proofs for select using (public.is_business_member(business_id, auth.uid()) OR courier_id = public.get_courier_id(business_id, auth.uid()));

drop policy if exists "order_proofs_insert" on public.order_proofs;
create policy "order_proofs_insert" on public.order_proofs for insert with check (courier_id = public.get_courier_id(business_id, auth.uid()));

drop policy if exists "courier_locations_select" on public.courier_locations;
create policy "courier_locations_select" on public.courier_locations for select using (public.is_business_member(business_id, auth.uid()) OR courier_id = public.get_courier_id(business_id, auth.uid()));

drop policy if exists "courier_locations_insert_self" on public.courier_locations;
create policy "courier_locations_insert_self" on public.courier_locations for insert with check (courier_id = public.get_courier_id(business_id, auth.uid()));

drop policy if exists "tracking_links_crud_member" on public.order_tracking_links;
create policy "tracking_links_crud_member" on public.order_tracking_links for all using (public.is_business_member(business_id, auth.uid())) with check (public.is_business_member(business_id, auth.uid()));
