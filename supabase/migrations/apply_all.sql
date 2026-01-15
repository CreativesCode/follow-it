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

-- Policies (sin recursión para evitar loops infinitos)
drop policy if exists "businesses_select_member" on public.businesses;
drop policy if exists "businesses_insert_authenticated" on public.businesses;
drop policy if exists "business_members_select_member" on public.business_members;
drop policy if exists "business_members_insert_self" on public.business_members;

-- businesses: INSERT
create policy "businesses_insert_authenticated"
on public.businesses for insert
to authenticated
with check (true);

-- businesses: SELECT (sin usar is_business_member para evitar recursión)
create policy "businesses_select_member"
on public.businesses for select
to authenticated
using (
  EXISTS (
    select 1 from public.business_members bm
    where bm.business_id = businesses.id
    and bm.user_id = auth.uid()
    and bm.is_active = true
  )
  OR (created_at > now() - interval '5 minutes')
);

-- business_members: SELECT (sin recursión - solo puede ver sus propios memberships)
create policy "business_members_select_member"
on public.business_members for select
to authenticated
using (
  user_id = auth.uid()
);

-- business_members: INSERT
create policy "business_members_insert_self"
on public.business_members for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "couriers_select_member" on public.couriers;
create policy "couriers_select_member"
on public.couriers for select
to authenticated
using (
  business_id IN (
    select bm.business_id from public.business_members bm
    where bm.user_id = auth.uid() and bm.is_active = true
  )
  OR user_id = auth.uid()
);

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

-- =============================================
-- COURIER INVITATIONS SYSTEM
-- =============================================

-- Create courier_invitations table
create table if not exists public.courier_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  invitation_code text not null unique,
  courier_email text,
  courier_name text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster lookups
create index if not exists idx_courier_invitations_code on public.courier_invitations (invitation_code);
create index if not exists idx_courier_invitations_business on public.courier_invitations (business_id);
create index if not exists idx_courier_invitations_status on public.courier_invitations (status);

-- Enable RLS
alter table public.courier_invitations enable row level security;

-- Policies for courier_invitations
drop policy if exists "courier_invitations_select_business_member" on public.courier_invitations;
create policy "courier_invitations_select_business_member"
on public.courier_invitations for select
using (public.is_business_member(business_id, auth.uid()));

drop policy if exists "courier_invitations_insert_business_admin" on public.courier_invitations;
create policy "courier_invitations_insert_business_admin"
on public.courier_invitations for insert
with check (
  public.is_business_member(business_id, auth.uid())
  and created_by = auth.uid()
);

drop policy if exists "courier_invitations_update_business_admin" on public.courier_invitations;
create policy "courier_invitations_update_business_admin"
on public.courier_invitations for update
using (
  public.is_business_member(business_id, auth.uid())
  and created_by = auth.uid()
);

drop policy if exists "courier_invitations_select_by_code" on public.courier_invitations;
create policy "courier_invitations_select_by_code"
on public.courier_invitations for select
using (auth.uid() is not null);

-- Function to generate unique invitation code
create or replace function public.generate_invitation_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists_code boolean;
begin
  loop
    code := upper(substring(md5(random()::text) from 1 for 8));
    select exists(
      select 1 from public.courier_invitations where invitation_code = code
    ) into exists_code;
    exit when not exists_code;
  end loop;
  return code;
end;
$$;

-- Function to accept invitation and create courier
create or replace function public.accept_courier_invitation(
  p_invitation_code text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_invitation record;
  v_courier_id uuid;
begin
  select * into v_invitation
  from public.courier_invitations
  where invitation_code = p_invitation_code
  and status = 'pending'
  and expires_at > now();
  
  if not found then
    raise exception 'Invalid or expired invitation code';
  end if;
  
  if exists (
    select 1 from public.couriers
    where business_id = v_invitation.business_id
    and user_id = p_user_id
  ) then
    raise exception 'You are already a courier for this business';
  end if;
  
  insert into public.couriers (
    business_id,
    user_id,
    display_name,
    phone,
    is_active,
    created_at,
    updated_at
  )
  values (
    v_invitation.business_id,
    p_user_id,
    coalesce(v_invitation.courier_name, 'Courier'),
    coalesce(v_invitation.courier_email, ''),
    true,
    now(),
    now()
  )
  returning id into v_courier_id;
  
  update public.courier_invitations
  set 
    status = 'accepted',
    accepted_by = p_user_id,
    accepted_at = now(),
    updated_at = now()
  where id = v_invitation.id;
  
  return v_courier_id;
end;
$$;

grant execute on function public.accept_courier_invitation(text, uuid) to authenticated;

-- =====================================================
-- Migration 20240101000006: Fix Business RLS for Invitation Validation
-- =====================================================
-- Allow users to view basic business info when they have a valid pending invitation

-- Drop and recreate the businesses select policy to include invitation validation
drop policy if exists "businesses_select_member" on public.businesses;
create policy "businesses_select_member"
on public.businesses for select
using (
  -- Existing: User is a member of the business
  public.is_business_member(id, auth.uid())
  OR
  -- New: User has a valid pending invitation for this business
  exists (
    select 1 
    from public.courier_invitations ci
    where ci.business_id = businesses.id
    and ci.status = 'pending'
    and ci.expires_at > now()
    and auth.uid() is not null
  )
);

comment on policy "businesses_select_member" on public.businesses is 
  'Allow users to view businesses if they are members OR have a valid pending invitation';

-- =====================================================
-- Migration 20240101000007: Fix accept_courier_invitation Column Names
-- =====================================================
-- The couriers table uses 'display_name' and 'phone', not 'full_name' and 'email'

create or replace function public.accept_courier_invitation(
  p_invitation_code text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_invitation record;
  v_courier_id uuid;
begin
  -- Get invitation details
  select * into v_invitation
  from public.courier_invitations
  where invitation_code = p_invitation_code
  and status = 'pending'
  and expires_at > now();
  
  if not found then
    raise exception 'Invalid or expired invitation code';
  end if;
  
  -- Check if user is already a courier for this business
  if exists (
    select 1 from public.couriers
    where business_id = v_invitation.business_id
    and user_id = p_user_id
  ) then
    raise exception 'You are already a courier for this business';
  end if;
  
  -- Create courier record with correct column names
  insert into public.couriers (
    business_id,
    user_id,
    display_name,
    phone,
    is_active,
    created_at
  )
  values (
    v_invitation.business_id,
    p_user_id,
    coalesce(v_invitation.courier_name, 'Courier'),
    coalesce(v_invitation.courier_email, ''),
    true,
    now()
  )
  returning id into v_courier_id;
  
  -- Mark invitation as accepted
  update public.courier_invitations
  set 
    status = 'accepted',
    accepted_by = p_user_id,
    accepted_at = now(),
    updated_at = now()
  where id = v_invitation.id;
  
  return v_courier_id;
end;
$$;

comment on function public.accept_courier_invitation(text, uuid) is 
  'Accepts a courier invitation and creates a courier record with correct column names';

-- =====================================================
-- Migration 20240101000008: Remove updated_at from Courier Insert
-- =====================================================
-- The couriers table doesn't have an updated_at column, only created_at

create or replace function public.accept_courier_invitation(
  p_invitation_code text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_invitation record;
  v_courier_id uuid;
begin
  -- Get invitation details
  select * into v_invitation
  from public.courier_invitations
  where invitation_code = p_invitation_code
  and status = 'pending'
  and expires_at > now();
  
  if not found then
    raise exception 'Invalid or expired invitation code';
  end if;
  
  -- Check if user is already a courier for this business
  if exists (
    select 1 from public.couriers
    where business_id = v_invitation.business_id
    and user_id = p_user_id
  ) then
    raise exception 'You are already a courier for this business';
  end if;
  
  -- Create courier record (without updated_at column)
  insert into public.couriers (
    business_id,
    user_id,
    display_name,
    phone,
    is_active,
    created_at
  )
  values (
    v_invitation.business_id,
    p_user_id,
    coalesce(v_invitation.courier_name, 'Courier'),
    coalesce(v_invitation.courier_email, ''),
    true,
    now()
  )
  returning id into v_courier_id;
  
  -- Mark invitation as accepted
  update public.courier_invitations
  set 
    status = 'accepted',
    accepted_by = p_user_id,
    accepted_at = now(),
    updated_at = now()
  where id = v_invitation.id;
  
  return v_courier_id;
end;
$$;

comment on function public.accept_courier_invitation(text, uuid) is 
  'Accepts a courier invitation and creates a courier record (fixed to match actual table schema)';

-- =====================================================
-- Migration 20240101000009: Device Tokens for Push Notifications
-- =====================================================
-- Creates table to store device tokens for push notifications

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_id text, -- optional: unique device identifier
  is_active boolean not null default true,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- One token per user per device (if device_id is provided)
  unique (user_id, token)
);

-- Index for quick lookups by user
create index if not exists idx_device_tokens_user_active 
  on public.device_tokens (user_id, is_active) 
  where is_active = true;

-- Index for platform filtering
create index if not exists idx_device_tokens_platform 
  on public.device_tokens (platform, is_active) 
  where is_active = true;

-- Enable RLS
alter table public.device_tokens enable row level security;

-- RLS Policy: Users can only see and manage their own tokens
drop policy if exists "Users can view their own device tokens" on public.device_tokens;
create policy "Users can view their own device tokens"
  on public.device_tokens
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own device tokens" on public.device_tokens;
create policy "Users can insert their own device tokens"
  on public.device_tokens
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own device tokens" on public.device_tokens;
create policy "Users can update their own device tokens"
  on public.device_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own device tokens" on public.device_tokens;
create policy "Users can delete their own device tokens"
  on public.device_tokens
  for delete
  using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function public.update_device_token_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_device_tokens_updated_at on public.device_tokens;
create trigger update_device_tokens_updated_at
  before update on public.device_tokens
  for each row
  execute function public.update_device_token_updated_at();

comment on table public.device_tokens is 
  'Stores device tokens for push notifications. Users can have multiple devices.';
