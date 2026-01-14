-- Migration: Remove updated_at column from courier insert
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
