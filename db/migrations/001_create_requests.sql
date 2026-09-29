-- HBW Phase 5 - initial schema for Requests
-- PostgreSQL

create extension if not exists pgcrypto;

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  priority text not null default 'MEDIUM',
  status text not null default 'NEW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint requests_priority_chk check (priority in ('LOW','MEDIUM','HIGH')),
  constraint requests_status_chk check (status in ('NEW','IN_PROGRESS','DONE'))
);

create index if not exists requests_created_at_idx on requests (created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_requests_updated_at on requests;
create trigger trg_requests_updated_at
before update on requests
for each row
execute function set_updated_at();
