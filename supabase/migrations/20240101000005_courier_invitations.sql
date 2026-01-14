-- Migration: Courier Invitations System
-- This allows businesses to invite couriers via a unique code

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

-- Business members can view invitations for their business
drop policy if exists "courier_invitations_select_business_member" on public.courier_invitations;
create policy "courier_invitations_select_business_member"
on public.courier_invitations for select
using (public.is_business_member(business_id, auth.uid()));

-- Business admins can create invitations
drop policy if exists "courier_invitations_insert_business_admin" on public.courier_invitations;
create policy "courier_invitations_insert_business_admin"
on public.courier_invitations for insert
with check (
  public.is_business_member(business_id, auth.uid())
  and created_by = auth.uid()
);

-- Business admins can update their own invitations
drop policy if exists "courier_invitations_update_business_admin" on public.courier_invitations;
create policy "courier_invitations_update_business_admin"
on public.courier_invitations for update
using (
  public.is_business_member(business_id, auth.uid())
  and created_by = auth.uid()
);

-- Anyone (authenticated) can view a specific invitation by code to validate it
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
    -- Generate a random 8-character code (uppercase letters and numbers)
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    select exists(
      select 1 from public.courier_invitations where invitation_code = code
    ) into exists_code;
    
    -- Exit loop if code is unique
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
  
  -- Create courier record
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

-- Grant execute permission to authenticated users
grant execute on function public.accept_courier_invitation(text, uuid) to authenticated;

comment on table public.courier_invitations is 'Stores invitation codes for couriers to join businesses';
comment on function public.generate_invitation_code() is 'Generates a unique 8-character invitation code';
comment on function public.accept_courier_invitation(text, uuid) is 'Accepts a courier invitation and creates courier record';
