begin;

create or replace function public.is_teacher(_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _uid
      and p.role in ('teacher', 'admin')
  );
$$;

revoke all on function public.is_teacher(uuid) from public;
grant execute on function public.is_teacher(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_versions enable row level security;
alter table public.submission_paragraphs enable row level security;
alter table public.comments enable row level security;
alter table public.review_summaries enable row level security;

drop policy if exists profiles_teacher_all on public.profiles;
drop policy if exists submissions_teacher_all on public.submissions;
drop policy if exists submission_versions_teacher_all on public.submission_versions;
drop policy if exists submission_paragraphs_teacher_all on public.submission_paragraphs;
drop policy if exists comments_teacher_all on public.comments;
drop policy if exists review_summaries_teacher_all on public.review_summaries;

create policy profiles_teacher_all
on public.profiles
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy submissions_teacher_all
on public.submissions
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy submission_versions_teacher_all
on public.submission_versions
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy submission_paragraphs_teacher_all
on public.submission_paragraphs
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy comments_teacher_all
on public.comments
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

create policy review_summaries_teacher_all
on public.review_summaries
for all
to authenticated
using (public.is_teacher())
with check (public.is_teacher());

commit;