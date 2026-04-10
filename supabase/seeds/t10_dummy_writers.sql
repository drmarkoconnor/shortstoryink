-- T10 dummy dataset seed (10 writers)
-- Safe rerun: removes prior dummy rows by email pattern n{n}@dummy.me

begin;

delete from public.comments
where submission_id in (
  select id from public.submissions where writer_email ~ '^n[0-9]+@dummy\\.me$'
);

delete from public.review_summaries
where submission_id in (
  select id from public.submissions where writer_email ~ '^n[0-9]+@dummy\\.me$'
);

delete from public.submission_paragraphs
where submission_version_id in (
  select sv.id
  from public.submission_versions sv
  join public.submissions s on s.id = sv.submission_id
  where s.writer_email ~ '^n[0-9]+@dummy\\.me$'
);

delete from public.submission_versions
where submission_id in (
  select id from public.submissions where writer_email ~ '^n[0-9]+@dummy\\.me$'
);

delete from public.submissions
where writer_email ~ '^n[0-9]+@dummy\\.me$';

create or replace function public.ss_seed_lorem(words_count integer)
returns text
language sql
as $$
  with vocab as (
    select array[
      'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit',
      'sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore',
      'magna','aliqua','enim','ad','minim','veniam','quis','nostrud',
      'exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo',
      'consequat','duis','aute','irure','in','reprehenderit','voluptate',
      'velit','esse','cillum','eu','fugiat','nulla','pariatur','excepteur',
      'sint','occaecat','cupidatat','non','proident','sunt','culpa','qui',
      'officia','deserunt','mollit','anim','id','est','laborum'
    ] as w
  )
  select string_agg(
    (select w[1 + floor(random() * array_length(w,1))::int] from vocab),
    ' '
  )
  from generate_series(1, greatest(1, words_count));
$$;

do $$
declare
  i int;
  p int;
  paragraph_count int;
  words_per_paragraph int;
  draft text;
  paragraph_text text;
  submission_id uuid;
  version_id uuid;
  status_value public.ss_submission_status;
  reviewer_id uuid;
begin
  select id into reviewer_id
  from public.profiles
  where role in ('teacher', 'admin')
  limit 1;

  for i in 1..10 loop
    status_value := (array['submitted','in_review','feedback_ready']::public.ss_submission_status[])[1 + ((i - 1) % 3)];

    paragraph_count := 2 + floor(random() * 7)::int;
    draft := '';

    for p in 1..paragraph_count loop
      words_per_paragraph := 40 + floor(random() * 320)::int;
      paragraph_text := public.ss_seed_lorem(words_per_paragraph);

      if p > 1 then
        draft := draft || E'\\n\\n';
      end if;
      draft := draft || paragraph_text;
    end loop;

    insert into public.submissions (
      writer_email,
      writer_first_name,
      status,
      submitted_at,
      created_at
    ) values (
      format('n%s@dummy.me', i),
      format('N%s', i),
      status_value,
      now() - ((11 - i) || ' days')::interval,
      now() - ((11 - i) || ' days')::interval
    ) returning id into submission_id;

    insert into public.submission_versions (
      submission_id,
      version_number,
      body,
      word_count,
      created_at
    ) values (
      submission_id,
      1,
      draft,
      array_length(regexp_split_to_array(trim(draft), E'\\s+'), 1),
      now() - ((11 - i) || ' days')::interval
    ) returning id into version_id;

    update public.submissions
    set latest_version_id = version_id
    where id = submission_id;

    insert into public.submission_paragraphs (
      submission_version_id,
      pid,
      position,
      text
    )
    select
      version_id,
      'p' || ord::text,
      ord,
      part
    from regexp_split_to_table(draft, E'\\n\\s*\\n') with ordinality as t(part, ord);

    if status_value in ('in_review', 'feedback_ready') then
      insert into public.review_summaries (
        submission_id,
        submission_version_id,
        author_id,
        body
      ) values (
        submission_id,
        version_id,
        reviewer_id,
        public.ss_seed_lorem(45)
      )
      on conflict (submission_version_id) do update
      set body = excluded.body,
          author_id = excluded.author_id,
          updated_at = now();
    end if;

    if reviewer_id is not null and status_value in ('in_review', 'feedback_ready') then
      insert into public.comments (
        submission_id,
        submission_version_id,
        paragraph_id,
        author_id,
        body,
        visibility,
        status
      )
      select
        submission_id,
        version_id,
        sp.id,
        reviewer_id,
        'Consider tightening this section for clarity and pacing.',
        'writer',
        'open'
      from public.submission_paragraphs sp
      where sp.submission_version_id = version_id
        and sp.position in (1, greatest(2, paragraph_count / 2));
    end if;

    if status_value = 'feedback_ready' then
      update public.submissions
      set
        feedback_access_token_hash = encode(digest('seed-token-' || i::text, 'sha256'), 'hex'),
        feedback_access_token_expires_at = now() + interval '90 days',
        reviewed_at = now() - ((i % 4) || ' days')::interval
      where id = submission_id;
    end if;
  end loop;
end $$;

drop function if exists public.ss_seed_lorem(integer);

commit;
