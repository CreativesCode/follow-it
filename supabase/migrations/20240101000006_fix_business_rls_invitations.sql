-- Migration: Fix Business RLS for Invitation Validation
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
