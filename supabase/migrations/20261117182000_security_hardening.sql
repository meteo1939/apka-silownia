-- FitQuest — security and performance hardening
-- Safe to run multiple times. Does not delete any data.

-- 1. The signup trigger function must not be callable through the Data API.
--    Triggers run as the function owner, so revoking EXECUTE does not break signup.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

-- 2. Cover foreign keys reported by the performance advisor.
create index if not exists inventory_user_id_idx
  on public.inventory (user_id);

create index if not exists meals_user_id_idx
  on public.meals (user_id);

create index if not exists equipped_items_weapon_id_idx
  on public.equipped_items (weapon_id);

create index if not exists equipped_items_armor_id_idx
  on public.equipped_items (armor_id);

create index if not exists equipped_items_accessory_id_idx
  on public.equipped_items (accessory_id);

-- 3. Evaluate auth.uid() once per query instead of once per row.
alter policy "Users can manage own achievements" on public.achievements
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can manage own equipped_items" on public.equipped_items
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can manage own inventory" on public.inventory
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can manage own meals" on public.meals
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can manage own muscle_stats" on public.muscle_stats
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can manage own workouts" on public.workouts
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can update own profile" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "Users can insert own profile" on public.profiles
  with check ((select auth.uid()) = id);

-- 4. Profiles are only needed by signed-in users (leaderboard, dashboard).
alter policy "Anyone can view all profiles" on public.profiles
  to authenticated
  using (true);
