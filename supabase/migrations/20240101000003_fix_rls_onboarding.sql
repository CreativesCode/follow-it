-- Fix RLS policies for onboarding
-- This allows authenticated users to create businesses and add themselves as members

-- Allow authenticated users to create businesses (for onboarding)
drop policy if exists "businesses_insert_authenticated" on public.businesses;
create policy "businesses_insert_authenticated"
on public.businesses for insert
with check (auth.uid() is not null);

-- Allow users to add themselves as members when creating a business
drop policy if exists "business_members_insert_self" on public.business_members;
create policy "business_members_insert_self"
on public.business_members for insert
with check (auth.uid() = user_id);
