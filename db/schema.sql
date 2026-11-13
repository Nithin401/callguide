-- Run this in Supabase: SQL Editor -> New query -> paste -> Run
create extension if not exists pgcrypto;

create table if not exists calls (
  id            uuid primary key default gen_random_uuid(),
  prospect_name text not null,
  company       text not null,
  status        text not null default 'open' check (status in ('open','closed')),
  reached_stage int  not null default 1 check (reached_stage between 1 and 8),
  outcome       text,
  next_step     text,
  ai_note       text,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz
);

create table if not exists stage_results (
  id              uuid primary key default gen_random_uuid(),
  call_id         uuid not null references calls(id) on delete cascade,
  stage           int  not null check (stage between 1 and 8),
  tap             text,
  prospect_words  text,
  saved_at        timestamptz not null default now(),
  unique (call_id, stage)
);

create index if not exists calls_started_idx on calls (started_at desc);

-- The backend uses the service-role key, which bypasses RLS.
-- Enabling RLS with no policies keeps the tables closed to the public anon key.
alter table calls enable row level security;
alter table stage_results enable row level security;
