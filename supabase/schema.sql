-- ============================================================
-- GVPCDPGC Smart Bus Portal — Supabase Database Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'student' check (role in ('student', 'driver', 'admin')),
  full_name text,
  roll_number text,
  email text unique,
  phone text,
  department text,
  year integer,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLE: routes
-- ============================================================
create table if not exists public.routes (
  id uuid primary key default uuid_generate_v4(),
  route_name text not null,
  source text not null,
  destination text not null,
  stops jsonb not null default '[]',
  -- stops format: [{ "name": "Stop Name", "lat": 17.7, "lng": 83.2 }]
  fare numeric(8,2) default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLE: buses
-- ============================================================
create table if not exists public.buses (
  id uuid primary key default uuid_generate_v4(),
  bus_number text not null unique,
  route_id uuid references public.routes(id) on delete set null,
  capacity integer not null default 50,
  status text not null default 'inactive' check (status in ('active', 'inactive', 'maintenance')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLE: drivers
-- ============================================================
create table if not exists public.drivers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete cascade unique,
  bus_id uuid references public.buses(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLE: registrations
-- ============================================================
create table if not exists public.registrations (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade,
  route_id uuid references public.routes(id) on delete set null,
  bus_id uuid references public.buses(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  academic_year text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique: one active registration per student
create unique index if not exists registrations_student_unique
  on public.registrations (student_id)
  where status != 'rejected';

-- ============================================================
-- TABLE: bus_locations
-- ============================================================
create table if not exists public.bus_locations (
  id uuid primary key default uuid_generate_v4(),
  bus_id uuid references public.buses(id) on delete cascade unique,
  latitude double precision,
  longitude double precision,
  trip_status text not null default 'not_started'
    check (trip_status in ('not_started', 'running', 'delayed', 'completed')),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info'
    check (type in ('info', 'success', 'warning', 'error', 'announcement')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLE: push_subscriptions (for Web Push Notifications)
-- ============================================================
create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: Update updated_at on registrations
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_registration_updated on public.registrations;
create trigger on_registration_updated
  before update on public.registrations
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- TRIGGER: Update bus_locations updated_at
-- ============================================================
drop trigger if exists on_bus_location_updated on public.bus_locations;
create trigger on_bus_location_updated
  before update on public.bus_locations
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- FUNCTION: Send notification to all students on a route
-- ============================================================
create or replace function public.notify_route_students(
  p_route_id uuid,
  p_title text,
  p_message text,
  p_type text default 'info'
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.notifications (user_id, title, message, type)
  select r.student_id, p_title, p_message, p_type
  from public.registrations r
  where r.route_id = p_route_id and r.status = 'approved';
end;
$$;

-- ============================================================
-- FUNCTION: Notify student on registration status change
-- ============================================================
create or replace function public.handle_registration_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
  v_title text;
  v_message text;
  v_type text;
begin
  if new.status = 'approved' and old.status != 'approved' then
    v_title := 'Registration Approved! 🎉';
    v_message := 'Your bus registration has been approved. You can now track your bus live.';
    v_type := 'success';
  elsif new.status = 'rejected' and old.status != 'rejected' then
    v_title := 'Registration Update';
    v_message := 'Your bus registration was not approved. Please contact the admin for details.';
    v_type := 'warning';
  else
    return new;
  end if;

  insert into public.notifications (user_id, title, message, type)
  values (new.student_id, v_title, v_message, v_type);

  return new;
end;
$$;

drop trigger if exists on_registration_status_change on public.registrations;
create trigger on_registration_status_change
  after update of status on public.registrations
  for each row execute procedure public.handle_registration_status_change();

-- ============================================================
-- Enable Realtime (safe — skips if already added)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bus_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
  END IF;
END $$;
