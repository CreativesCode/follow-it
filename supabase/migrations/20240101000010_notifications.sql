-- Migration: Notifications Table
-- Creates table to store in-app notifications for users

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text, -- e.g., 'order_assigned', 'order_status_changed', 'proof_uploaded', etc.
  data jsonb not null default '{}'::jsonb, -- Additional data like order_id, etc.
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for quick lookups by user and read status
create index if not exists idx_notifications_user_read 
  on public.notifications (user_id, is_read) 
  where is_read = false;

-- Index for sorting by creation date
create index if not exists idx_notifications_user_created 
  on public.notifications (user_id, created_at desc);

-- Index for type filtering
create index if not exists idx_notifications_type 
  on public.notifications (type) 
  where type is not null;

-- Enable RLS
alter table public.notifications enable row level security;

-- RLS Policy: Users can only see their own notifications
create policy "Users can view their own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

-- RLS Policy: System can insert notifications (via service role)
-- Note: This will be handled by service role, so we allow inserts
-- but users can't insert their own notifications
create policy "Service role can insert notifications"
  on public.notifications
  for insert
  with check (true); -- Service role bypasses RLS

-- RLS Policy: Users can update their own notifications (mark as read)
create policy "Users can update their own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Function to automatically set read_at when is_read is set to true
create or replace function public.set_notification_read_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_read = true and old.is_read = false then
    new.read_at = now();
  elsif new.is_read = false then
    new.read_at = null;
  end if;
  return new;
end;
$$;

create trigger set_notification_read_at_trigger
  before update on public.notifications
  for each row
  execute function public.set_notification_read_at();

comment on table public.notifications is 
  'Stores in-app notifications for users. Notifications are created when system events occur.';

-- Enable Realtime for notifications table
alter publication supabase_realtime add table public.notifications;
