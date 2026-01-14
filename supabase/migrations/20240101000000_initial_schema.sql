-- Migration: Initial Schema
-- Creates extensions, enums, and all tables for Follow It delivery management system

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

-- 1) Businesses (tenants)
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Havana',
  created_at timestamptz not null default now()
);

-- 2) Membership + roles (admin/operator within a business)
create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','operator')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- 3) Couriers (linked to auth user)
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

-- 4) Customers (optional, for nicer order records)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text,
  phone text,
  created_at timestamptz not null default now()
);

-- 5) Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,

  code text, -- opcional: visible code like #A1023
  customer_id uuid references public.customers(id) on delete set null,

  pickup_address text,
  dropoff_address text not null,
  dropoff_lat double precision,
  dropoff_lng double precision,

  notes text,
  items_summary text, -- "2x combo, 1x agua 10L" (MVP)
  amount_cents integer,
  currency text default 'USD',

  status public.order_status not null default 'pending',

  -- current assignment (optional to denormalize)
  assigned_courier_id uuid references public.couriers(id) on delete set null,
  assigned_at timestamptz,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) Order Events (timeline + source of truth)
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

-- 7) Proofs (photo/signature)
create table if not exists public.order_proofs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid references public.couriers(id) on delete set null,

  type public.proof_type not null,
  storage_path text not null, -- e.g. proofs/<business>/<order>/<uuid>.jpg
  captured_at timestamptz not null default now(),

  lat double precision,
  lng double precision,

  created_at timestamptz not null default now()
);

-- 8) Courier Locations (tracking pings)
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

-- 9) Tracking links (for clients)
create table if not exists public.order_tracking_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,

  token_hash text not null, -- store hash, not raw token
  expires_at timestamptz not null,
  is_revoked boolean not null default false,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (order_id, token_hash)
);
