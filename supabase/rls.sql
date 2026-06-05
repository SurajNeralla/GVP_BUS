-- ============================================================
-- GVPCDPGC Smart Bus Portal — Row Level Security Policies
-- Safe version: drops existing policies before recreating
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.buses enable row level security;
alter table public.drivers enable row level security;
alter table public.registrations enable row level security;
alter table public.bus_locations enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

-- ============================================================
-- HELPER FUNCTION: get current user's role
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- PROFILES
-- ============================================================
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- ROUTES
-- ============================================================
drop policy if exists "routes_select_all" on public.routes;
create policy "routes_select_all" on public.routes
  for select using (auth.role() = 'authenticated');

drop policy if exists "routes_admin_write" on public.routes;
create policy "routes_admin_write" on public.routes
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- BUSES
-- ============================================================
drop policy if exists "buses_select_all" on public.buses;
create policy "buses_select_all" on public.buses
  for select using (auth.role() = 'authenticated');

drop policy if exists "buses_admin_write" on public.buses;
create policy "buses_admin_write" on public.buses
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- DRIVERS
-- ============================================================
drop policy if exists "drivers_select_own" on public.drivers;
create policy "drivers_select_own" on public.drivers
  for select using (profile_id = auth.uid());

drop policy if exists "drivers_admin_all" on public.drivers;
create policy "drivers_admin_all" on public.drivers
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- REGISTRATIONS
-- ============================================================
drop policy if exists "registrations_select_own" on public.registrations;
create policy "registrations_select_own" on public.registrations
  for select using (student_id = auth.uid());

drop policy if exists "registrations_insert_own" on public.registrations;
create policy "registrations_insert_own" on public.registrations
  for insert with check (student_id = auth.uid());

drop policy if exists "registrations_admin_all" on public.registrations;
create policy "registrations_admin_all" on public.registrations
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- BUS_LOCATIONS
-- ============================================================
drop policy if exists "bus_locations_select_all" on public.bus_locations;
create policy "bus_locations_select_all" on public.bus_locations
  for select using (auth.role() = 'authenticated');

drop policy if exists "bus_locations_driver_update" on public.bus_locations;
create policy "bus_locations_driver_update" on public.bus_locations
  for all using (
    exists (
      select 1 from public.drivers d
      where d.profile_id = auth.uid()
        and d.bus_id = bus_locations.bus_id
    )
  );

drop policy if exists "bus_locations_admin_all" on public.bus_locations;
create policy "bus_locations_admin_all" on public.bus_locations
  for all using (public.get_my_role() = 'admin');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert" on public.notifications
  for insert with check (public.get_my_role() = 'admin');

-- Allow triggers (security definer functions) to insert notifications
drop policy if exists "notifications_system_insert" on public.notifications;
create policy "notifications_system_insert" on public.notifications
  for insert with check (true);

-- ============================================================
-- PUSH_SUBSCRIPTIONS
-- ============================================================
drop policy if exists "push_subs_own" on public.push_subscriptions;
create policy "push_subs_own" on public.push_subscriptions
  for all using (user_id = auth.uid());
