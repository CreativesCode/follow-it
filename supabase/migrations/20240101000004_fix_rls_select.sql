-- Migration 20240101000004: Fix RLS SELECT policy for businesses
-- This migration was already applied to the remote database
-- This file exists to maintain migration history consistency

-- Allow SELECT of businesses created in the last 5 minutes
-- This covers the gap between creating a business and adding membership during onboarding

drop policy if exists "businesses_select_member" on public.businesses;

create policy "businesses_select_member" on public.businesses for select
using (
  public.is_business_member(id, auth.uid())
  OR (
    -- Allow SELECT if business was created in the last 5 minutes by authenticated user
    -- This allows the .select() after INSERT to work during onboarding
    created_at > now() - interval '5 minutes'
    AND auth.uid() is not null
  )
);
