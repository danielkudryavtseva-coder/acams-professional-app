-- Run this once in the Supabase SQL Editor against a project that already ran the original
-- schema.sql. Adds the exec-approval workflow: new accounts default to 'pending' and cannot
-- reach the dashboard until an exec approves them.

alter table public.members
  add column if not exists approval_status text not null default 'pending'
  check (approval_status in ('pending', 'approved', 'rejected'));

create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role
      or new.active is distinct from old.active
      or new.approval_status is distinct from old.approval_status
      or new.pnl_tagged is distinct from old.pnl_tagged
      or new.pnl_reason is distinct from old.pnl_reason)
     and not public.is_exec(auth.uid()) then
    raise exception 'Only an exec can change role, active, approval status, or PNL status.';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_signup_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.role := 'member';
  new.approval_status := 'pending';
  new.active := true;
  return new;
end;
$$;

drop trigger if exists enforce_signup_defaults_trigger on public.members;
create trigger enforce_signup_defaults_trigger
  before insert on public.members
  for each row execute function public.enforce_signup_defaults();

-- ─────────────────────────────────────────────────────────────────────────
-- After registering your own account through the site, run this (with your
-- real email) to become the first exec — the enforce_signup_defaults trigger
-- above forces every new signup to 'pending'/'member', so this direct SQL
-- path is the only way to create the first approved exec.
-- ─────────────────────────────────────────────────────────────────────────
-- update public.members set role = 'exec', approval_status = 'approved' where email = 'yourname@crimson.ua.edu';
