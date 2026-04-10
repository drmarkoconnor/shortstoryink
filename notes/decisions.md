# shortstory.ink decisions

## Product stance

- V1 is for Mark's physical writing group plus early online learners
- Not enterprise
- Not a generic LMS
- Editor-led, elegant, premium, literary

## Core loop

Read → Notice → Save → Write → Submit → Receive inline feedback → Reflect →
Revise → Stay connected

## Core differentiators

- Inline comments where the text is
- Snippet/commonplace system
- Calm reading experience

## Tech stack

- Eleventy
- Nunjucks
- GitHub
- Netlify
- Supabase

## V1 in scope (locked)

- Static-first architecture
- Teacher auth only
- Inline paragraph feedback
- Summary note for writer
- Single active writer token per submission
- 90-day token expiry
- Reissue invalidates old link
- Teacher-only status changes
- Reopen required for edits after `feedback_ready`
- Status flow: `submitted → in_review → feedback_ready` (+ archive support)

## V1 out of scope

- Writer auth/dashboard
- Advanced analytics
- Complex automation
