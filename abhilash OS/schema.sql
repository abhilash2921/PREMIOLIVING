-- =========================================================================
-- ERROR-PROOF SUPABASE DATABASE SCHEMA
-- =========================================================================
-- Copy and run this script in your Supabase Project SQL Editor
-- Dashboard > SQL Editor > New query > Paste & Run
-- =========================================================================

-- 1. Create tables safely if they do not exist
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin','architect','designer','site_engineer')),
  email text,
  created_at timestamptz default now()
);

-- Ensure correct columns and constraints if the table was created previously without them
alter table public.profiles add column if not exists email text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','architect','designer','site_engineer'));

create table if not exists public.projects (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.vendors (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.rfqs (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.purchase_orders (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.payouts (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id text references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null,
  name text not null,
  unique(project_id, role)
);

create table if not exists public.document_files (
  id text primary key,
  file_data text not null,
  updated_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.vendors enable row level security;
alter table public.rfqs enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.payouts enable row level security;
alter table public.project_members enable row level security;
alter table public.document_files enable row level security;

-- 3. Safely drop existing policies to avoid "already exists" conflicts
do $$
begin
  -- Profiles policies
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Anyone can read profiles') then
    drop policy "Anyone can read profiles" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Admin can manage profiles') then
    drop policy "Admin can manage profiles" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Admin manages all profiles') then
    drop policy "Admin manages all profiles" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can insert their own profile') then
    drop policy "Users can insert their own profile" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update their own profile') then
    drop policy "Users can update their own profile" on public.profiles;
  end if;
  
  -- Projects policies
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'Admin sees all projects') then
    drop policy "Admin sees all projects" on public.projects;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'Members see assigned projects') then
    drop policy "Members see assigned projects" on public.projects;
  end if;

  -- Vendors policies
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendors' and policyname = 'Anyone can access vendors') then
    drop policy "Anyone can access vendors" on public.vendors;
  end if;

  -- RFQs policies
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'rfqs' and policyname = 'Anyone can access rfqs') then
    drop policy "Anyone can access rfqs" on public.rfqs;
  end if;

  -- POs policies
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_orders' and policyname = 'Anyone can access purchase_orders') then
    drop policy "Anyone can access purchase_orders" on public.purchase_orders;
  end if;

  -- Payouts policies
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payouts' and policyname = 'Anyone can access payouts') then
    drop policy "Anyone can access payouts" on public.payouts;
  end if;

  -- Project members policies
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_members' and policyname = 'Admin manages project members') then
    drop policy "Admin manages project members" on public.project_members;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_members' and policyname = 'Members read project members') then
    drop policy "Members read project members" on public.project_members;
  end if;

  -- Document files policies
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'document_files' and policyname = 'Anyone can access document_files') then
    drop policy "Anyone can access document_files" on public.document_files;
  end if;
end
$$;

-- 4. Custom security function to resolve infinite recursion (security definer bypasses RLS)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 5. Re-create Row Level Security policies
create policy "Anyone can read profiles" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin manages all profiles" on public.profiles for all using (public.is_admin());

create policy "Admin sees all projects" on public.projects for all using (public.is_admin());
create policy "Members see assigned projects" on public.projects for select using (
  exists (select 1 from public.project_members where project_id = projects.id and user_id = auth.uid())
);

create policy "Anyone can access vendors" on public.vendors for all using (true);
create policy "Anyone can access rfqs" on public.rfqs for all using (true);
create policy "Anyone can access purchase_orders" on public.purchase_orders for all using (true);
create policy "Anyone can access payouts" on public.payouts for all using (true);

create policy "Admin manages project members" on public.project_members for all using (public.is_admin());
create policy "Members read project members" on public.project_members for select using (true);
create policy "Anyone can access document_files" on public.document_files for all using (true);

-- 5. Safe trigger management for auto-profile creation
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Team Member'),
    case 
      when new.email = 'abhilash@premioliving.in' then 'admin' -- abhilash@premioliving.in is always Admin
      else coalesce(nullif(new.raw_user_meta_data->>'role', 'admin'), 'site_engineer') -- Downgrade other unauthorized admin signups to site_engineer
    end,
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- MIGRATION: Rename 'draftsman' role to 'designer'
-- Run this to update existing users who signed up as 'draftsman'
-- =========================================================================

-- Temporarily drop the old constraint and re-add with 'designer'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','architect','designer','site_engineer'));

-- Rename all existing 'draftsman' rows to 'designer'
update public.profiles set role = 'designer' where role = 'draftsman';
