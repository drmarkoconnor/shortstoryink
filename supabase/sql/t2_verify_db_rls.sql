-- T2 verification: run in Supabase SQL Editor

-- 1) Confirm applied migrations
select version, name
from supabase_migrations.schema_migrations
order by version desc;

-- 2) Confirm helper function exists
select n.nspname as schema_name, p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'is_teacher';

-- 3) Confirm RLS enabled on key tables
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'submissions',
    'submission_versions',
    'submission_paragraphs',
    'comments',
    'review_summaries'
  )
order by tablename;

-- 4) Confirm teacher policies exist
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and policyname in (
    'profiles_teacher_all',
    'submissions_teacher_all',
    'submission_versions_teacher_all',
    'submission_paragraphs_teacher_all',
    'comments_teacher_all',
    'review_summaries_teacher_all'
  )
order by tablename, policyname;

-- 5) Quick data sanity (latest submissions + versions)
select id, latest_version_id, writer_email, created_at
from public.submissions
order by created_at desc
limit 10;