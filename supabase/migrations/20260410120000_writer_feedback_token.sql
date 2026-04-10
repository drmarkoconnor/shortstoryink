begin;

alter table public.submissions
  add column if not exists feedback_access_token_hash text unique,
  add column if not exists feedback_access_token_expires_at timestamptz;

create index if not exists submissions_feedback_token_hash_idx
  on public.submissions (feedback_access_token_hash);

commit;