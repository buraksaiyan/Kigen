-- Initial schema for Kigen MVP

-- NOTE: Enable Row Level Security after table creation.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  display_name text
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text default '',
  body text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- (Optional) triggers to auto-update timestamps could be added later.

-- Enable RLS
alter table profiles enable row level security;
alter table journal_entries enable row level security;

-- Basic policies
create policy "Select own profile" on profiles for select using (auth.uid() = id);
create policy "Update own profile" on profiles for update using (auth.uid() = id);

create policy "Select own entries" on journal_entries for select using (auth.uid() = user_id);
create policy "Insert own entries" on journal_entries for insert with check (auth.uid() = user_id);
create policy "Update own entries" on journal_entries for update using (auth.uid() = user_id);
create policy "Delete own entries" on journal_entries for delete using (auth.uid() = user_id);
