-- shortstory.ink — minimal v1 schema (Supabase/Postgres)
-- Date: 2026-04-03
-- Scope: profiles, submissions, immutable submission versions, paragraph anchors, summary notes, paragraph-anchored comments.
-- Notes:
-- - This migration assumes Supabase's auth schema exists (auth.users) and the "uuid-ossp" extension is available.
-- - RLS policies are intentionally NOT included yet (planned separately).

begin;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'ss_role') then
    create type public.ss_role as enum ('writer', 'teacher', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'ss_submission_status') then
    create type public.ss_submission_status as enum ('submitted', 'in_review', 'feedback_ready', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'ss_comment_visibility') then
    create type public.ss_comment_visibility as enum ('private', 'writer');
  end if;

  if not exists (select 1 from pg_type where typname = 'ss_comment_status') then
    create type public.ss_comment_status as enum ('open', 'resolved', 'note');
  end if;
end $$;

-- Profiles (minimal identity + role; maps 1:1 to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.ss_role not null default 'writer',
  display_name text,
  created_at timestamptz not null default now()
);

-- Submissions (top-level work item: who, status, and pointer to latest version)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),

  -- writer_id is nullable initially to support email-only /try/ flows
  writer_id uuid references public.profiles (id) on delete set null,
  writer_email text,
  writer_first_name text,

  title text,

  status public.ss_submission_status not null default 'submitted',

  latest_version_id uuid,

  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  archived_at timestamptz
);

-- Versions (immutable snapshots)
create table if not exists public.submission_versions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,

  version_number integer not null,
  body text not null,
  word_count integer,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,

  constraint submission_versions_unique_version unique (submission_id, version_number)
);

-- Now that submission_versions exists, add latest_version_id FK
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'submissions_latest_version_fk'
  ) then
    alter table public.submissions
      add constraint submissions_latest_version_fk
      foreign key (latest_version_id)
      references public.submission_versions (id)
      on delete set null;
  end if;
end $$;

-- Paragraph anchors (generated at version creation time)
create table if not exists public.submission_paragraphs (
  id uuid primary key default gen_random_uuid(),
  submission_version_id uuid not null references public.submission_versions (id) on delete cascade,

  pid text not null,
  position integer not null,
  text text not null,

  start_char integer,
  end_char integer,

  created_at timestamptz not null default now(),

  constraint submission_paragraphs_unique_pid unique (submission_version_id, pid),
  constraint submission_paragraphs_unique_position unique (submission_version_id, position)
);

-- Review summary (one per version; can be replaced with a second table later if you need history)
create table if not exists public.review_summaries (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  submission_version_id uuid not null references public.submission_versions (id) on delete cascade,

  author_id uuid references public.profiles (id) on delete set null,
  body text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint review_summaries_one_per_version unique (submission_version_id)
);

-- Anchored comments (paragraph-level)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),

  -- Denormalized convenience for querying all comments on a submission
  submission_id uuid not null references public.submissions (id) on delete cascade,
  submission_version_id uuid not null references public.submission_versions (id) on delete cascade,
  paragraph_id uuid not null references public.submission_paragraphs (id) on delete cascade,

  author_id uuid not null references public.profiles (id) on delete restrict,
  body text not null,

  visibility public.ss_comment_visibility not null default 'private',
  status public.ss_comment_status not null default 'open',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Minimal indexes for v1 queries
create index if not exists submissions_status_created_idx
  on public.submissions (status, created_at desc);

create index if not exists submissions_writer_id_idx
  on public.submissions (writer_id);

create index if not exists submissions_writer_email_idx
  on public.submissions (writer_email);

create index if not exists submission_versions_submission_created_idx
  on public.submission_versions (submission_id, created_at desc);

create index if not exists submission_paragraphs_version_position_idx
  on public.submission_paragraphs (submission_version_id, position);

create index if not exists comments_submission_version_paragraph_idx
  on public.comments (submission_id, submission_version_id, paragraph_id);

create index if not exists comments_author_created_idx
  on public.comments (author_id, created_at desc);

create index if not exists review_summaries_submission_version_idx
  on public.review_summaries (submission_id, submission_version_id);

commit;
