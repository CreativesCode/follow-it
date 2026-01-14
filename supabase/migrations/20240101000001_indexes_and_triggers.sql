-- Migration: Indexes and Triggers
-- Creates indexes for performance and triggers for automatic updates

-- Indexes for orders
create index if not exists idx_orders_business_status on public.orders (business_id, status);
create index if not exists idx_orders_assigned_courier on public.orders (assigned_courier_id);

-- Indexes for order_events
create index if not exists idx_order_events_order on public.order_events (order_id, created_at desc);

-- Indexes for order_proofs
create index if not exists idx_order_proofs_order on public.order_proofs (order_id, created_at desc);

-- Indexes for courier_locations
create index if not exists idx_courier_locations_courier_time on public.courier_locations (courier_id, recorded_at desc);

-- Indexes for tracking_links
create index if not exists idx_tracking_links_order on public.order_tracking_links (order_id);

-- Trigger function for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Trigger for orders.updated_at
drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();
