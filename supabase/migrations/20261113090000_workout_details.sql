-- FitQuest P0 — structured workout history
-- The app works without this migration by encoding session details inside
-- `workouts.muscles` with the `__fitquest:` prefix. Running this migration
-- enables the cleaner `details` column path and speeds up history queries.
--
-- Run in the Supabase SQL editor (project owner) or with `supabase db push`.

alter table public.workouts
  add column if not exists details jsonb;

comment on column public.workouts.details is
  'Structured FitQuest workout payload (exercises, sets, RPE, notes, PRs).';

create index if not exists workouts_user_completed_at_idx
  on public.workouts (user_id, completed_at desc);

-- Keep RLS defensive: the table is already protected by per-user policies.
-- These blocks only add a policy when the corresponding command has none.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workouts' and cmd in ('SELECT', 'ALL')
  ) then
    create policy "workouts_select_own"
      on public.workouts for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workouts' and cmd in ('INSERT', 'ALL')
  ) then
    create policy "workouts_insert_own"
      on public.workouts for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workouts' and cmd in ('DELETE', 'ALL')
  ) then
    create policy "workouts_delete_own"
      on public.workouts for delete
      using (auth.uid() = user_id);
  end if;
end $$;
