-- Migration: Device Tokens for Push Notifications
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
create policy "Users can view their own device tokens"
  on public.device_tokens
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own device tokens"
  on public.device_tokens
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own device tokens"
  on public.device_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

create trigger update_device_tokens_updated_at
  before update on public.device_tokens
  for each row
  execute function public.update_device_token_updated_at();

comment on table public.device_tokens is 
  'Stores device tokens for push notifications. Users can have multiple devices.';
