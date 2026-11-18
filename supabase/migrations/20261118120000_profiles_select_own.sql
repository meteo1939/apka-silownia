-- FitQuest — restrict profile reads to the owner
-- The ranking view uses simulated data, so cross-user profile access is not
-- required. Keeping profile rows private also protects height, weight and the
-- friends list from being read with the public anon key.

drop policy if exists "Anyone can view all profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);
