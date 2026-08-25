-- CAMS members backend schema.
-- Run this once in the Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run).

create table if not exists public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('member', 'exec')),
  active boolean not null default true,
  pnl_tagged boolean not null default false,
  pnl_reason text,
  -- Everything else (firstName, lastName, phone, classYear, graduationYear,
  -- committee, interests, personalStatement, resumeFilename, linkedin, gpa,
  -- location, major, avatarUrl, cohort, joinedAt, pipelineActivityCount,
  -- pitchesSubmitted, coffeeChatsCompleted, offers) lives here as camelCase
  -- keys, matching the app's Member TypeScript type field-for-field.
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;

-- Security-definer function: safe to call from RLS policies without recursive-RLS issues.
create or replace function public.is_exec(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members where id = uid and role = 'exec'
  );
$$;

-- Any signed-in member can see the full roster (needed for Committees/Scoreboard/Roster pages).
drop policy if exists "members_select_authenticated" on public.members;
create policy "members_select_authenticated"
  on public.members for select
  to authenticated
  using (true);

-- A member can create their own row (during registration).
drop policy if exists "members_insert_self" on public.members;
create policy "members_insert_self"
  on public.members for insert
  to authenticated
  with check (id = auth.uid());

-- A member can update their own row; execs can update anyone's.
drop policy if exists "members_update_self_or_exec" on public.members;
create policy "members_update_self_or_exec"
  on public.members for update
  to authenticated
  using (id = auth.uid() or public.is_exec(auth.uid()))
  with check (id = auth.uid() or public.is_exec(auth.uid()));

-- Blocks self-promotion / self-unbanning: role, active, and PNL status can only be
-- changed by an existing exec, no matter who issues the UPDATE (UI or raw API call).
create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role
      or new.active is distinct from old.active
      or new.pnl_tagged is distinct from old.pnl_tagged
      or new.pnl_reason is distinct from old.pnl_reason)
     and not public.is_exec(auth.uid()) then
    raise exception 'Only an exec can change role, active, or PNL status.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_privileged_columns_trigger on public.members;
create trigger protect_privileged_columns_trigger
  before update on public.members
  for each row execute function public.protect_privileged_columns();

-- Only @crimson.ua.edu emails may register a profile row.
create or replace function public.enforce_crimson_email()
returns trigger
language plpgsql
as $$
begin
  if new.email !~* '@crimson\.ua\.edu$' then
    raise exception 'Must use a @crimson.ua.edu email address.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_crimson_email_trigger on public.members;
create trigger enforce_crimson_email_trigger
  before insert on public.members
  for each row execute function public.enforce_crimson_email();

-- Enable Realtime so new registrations / exec edits show up live for everyone.
alter publication supabase_realtime add table public.members;

-- ─────────────────────────────────────────────────────────────────────────
-- One-time bootstrap: after you register your own account through the site,
-- run this (with your real email) to make yourself the first exec. Only an
-- existing exec can promote anyone else after this, so this direct SQL path
-- is the only way to create the first one.
-- ─────────────────────────────────────────────────────────────────────────
-- update public.members set role = 'exec' where email = 'yourname@crimson.ua.edu';
