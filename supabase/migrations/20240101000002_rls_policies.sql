-- Migration: Row Level Security Policies
-- Enables RLS and creates helper functions and policies for multi-tenant security

-- Enable RLS on all tables
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.couriers enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.order_proofs enable row level security;
alter table public.courier_locations enable row level security;
alter table public.order_tracking_links enable row level security;

-- Helper function: Is member of business?
create or replace function public.is_business_member(bid uuid, uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.business_members bm
    where bm.business_id = bid and bm.user_id = uid and bm.is_active = true
  );
$$;

-- Helper function: Get courier_id for user in business (if any)
create or replace function public.get_courier_id(bid uuid, uid uuid)
returns uuid language sql stable as $$
  select c.id
  from public.couriers c
  where c.business_id = bid and c.user_id = uid and c.is_active = true
  limit 1;
$$;

-- Policies for businesses
drop policy if exists "businesses_select_member" on public.businesses;
create policy "businesses_select_member"
on public.businesses for select
using (public.is_business_member(id, auth.uid()));

-- Policies for business_members
drop policy if exists "business_members_select_member" on public.business_members;
create policy "business_members_select_member"
on public.business_members for select
using (public.is_business_member(business_id, auth.uid()));

-- Policies for couriers
drop policy if exists "couriers_select_member" on public.couriers;
create policy "couriers_select_member"
on public.couriers for select
using (public.is_business_member(business_id, auth.uid()) OR user_id = auth.uid());

drop policy if exists "couriers_modify_admin" on public.couriers;
create policy "couriers_modify_admin"
on public.couriers for all
using (public.is_business_member(business_id, auth.uid()))
with check (public.is_business_member(business_id, auth.uid()));

-- Policies for customers
drop policy if exists "customers_crud_member" on public.customers;
create policy "customers_crud_member"
on public.customers for all
using (public.is_business_member(business_id, auth.uid()))
with check (public.is_business_member(business_id, auth.uid()));

-- Policies for orders
drop policy if exists "orders_select_member" on public.orders;
create policy "orders_select_member"
on public.orders for select
using (
  public.is_business_member(business_id, auth.uid())
  OR assigned_courier_id = public.get_courier_id(business_id, auth.uid())
);

drop policy if exists "orders_modify_member" on public.orders;
create policy "orders_modify_member"
on public.orders for insert
with check (public.is_business_member(business_id, auth.uid()));

drop policy if exists "orders_update_member" on public.orders;
create policy "orders_update_member"
on public.orders for update
using (public.is_business_member(business_id, auth.uid()))
with check (public.is_business_member(business_id, auth.uid()));

drop policy if exists "orders_delete_member" on public.orders;
create policy "orders_delete_member"
on public.orders for delete
using (public.is_business_member(business_id, auth.uid()));

-- Policies for order_events
drop policy if exists "order_events_select" on public.order_events;
create policy "order_events_select"
on public.order_events for select
using (
  public.is_business_member(business_id, auth.uid())
  OR courier_id = public.get_courier_id(business_id, auth.uid())
  OR order_id in (
    select o.id from public.orders o
    where o.business_id = order_events.business_id
      and o.assigned_courier_id = public.get_courier_id(o.business_id, auth.uid())
  )
);

drop policy if exists "order_events_insert_member" on public.order_events;
create policy "order_events_insert_member"
on public.order_events for insert
with check (public.is_business_member(business_id, auth.uid())
  OR courier_id = public.get_courier_id(business_id, auth.uid())
);

-- Policies for order_proofs
drop policy if exists "order_proofs_select" on public.order_proofs;
create policy "order_proofs_select"
on public.order_proofs for select
using (
  public.is_business_member(business_id, auth.uid())
  OR courier_id = public.get_courier_id(business_id, auth.uid())
);

drop policy if exists "order_proofs_insert" on public.order_proofs;
create policy "order_proofs_insert"
on public.order_proofs for insert
with check (
  courier_id = public.get_courier_id(business_id, auth.uid())
);

-- Policies for courier_locations
drop policy if exists "courier_locations_select" on public.courier_locations;
create policy "courier_locations_select"
on public.courier_locations for select
using (
  public.is_business_member(business_id, auth.uid())
  OR courier_id = public.get_courier_id(business_id, auth.uid())
);

drop policy if exists "courier_locations_insert_self" on public.courier_locations;
create policy "courier_locations_insert_self"
on public.courier_locations for insert
with check (
  courier_id = public.get_courier_id(business_id, auth.uid())
);

-- Policies for order_tracking_links
drop policy if exists "tracking_links_crud_member" on public.order_tracking_links;
create policy "tracking_links_crud_member"
on public.order_tracking_links for all
using (public.is_business_member(business_id, auth.uid()))
with check (public.is_business_member(business_id, auth.uid()));
