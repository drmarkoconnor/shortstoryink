# T10 QA checklist (pre-polish)

Purpose: verify end-to-end product reliability before visual refinements.

## Scope

- Writer submission flow (`/try/`)
- Teacher review flow (login, paragraph comments, summary)
- Publish/reissue/reopen status loop
- Writer token feedback page
- Email path (optional during DNS propagation)

## Environment assumptions

- Running with Netlify local dev (`http://localhost:8888`)
- Supabase env vars configured
- At least one teacher account can log in

## Smoke sequence (must pass)

1. Submit a draft via `/try/`
   - Expected: success state shown
   - Expected DB: submission created, version created, `latest_version_id` set, paragraph anchors saved

2. Teacher login
   - Expected: redirected to submissions list

3. Open submission review
   - Expected: paragraph text visible

4. Add paragraph comment
   - Expected: save success banner
   - Expected status transition: `submitted -> in_review`

5. Update and delete a comment
   - Expected: update/delete success banners

6. Save summary note
   - Expected: summary save banner

7. Publish feedback link
   - If comments/summary exist: should publish directly
   - If none exist: publish warning shown with “publish anyway” option
   - Expected status: `feedback_ready`

8. Open writer link
   - Expected: writer page renders without errors
   - Expected: summary (if present) and writer-visible comments appear

9. Reopen from teacher review
   - Expected: status `feedback_ready -> in_review`
   - Expected: editing enabled again

10. Reissue link after reopen edits
    - Expected: new link works
    - Expected: old link no longer valid

## Optional email verification (after DNS propagation)

1. Publish/reissue a link
2. Expected on publish page:
   - Success: “Feedback email sent to ...”
   - Fallback: manual-share warning + link still visible
3. Confirm inbox receipt and click-through to writer feedback page

## Edge checks

- Submission with missing `latest_version_id` is not publishable from list
- Archived submissions cannot be published
- Feedback-ready submissions are locked until reopened

## Pre-signoff UX fixes (required)

- Improve invalid writer-link page in `writer-feedback-preview`:
   - Replace technical/abrupt message with friendly explanation.
   - Explain likely causes in plain language:
      - link expired
      - a newer feedback link replaced this one (reissue)
   - Add clear next actions/links:
      - return to home page (`/`)
      - contact teacher guidance sentence
- Acceptance criteria:
   - No raw/ambiguous “invalid link” dead end page.
   - Writer always sees a clear reason + at least one useful next step.

## Quick defect log template

| ID | Scenario | Expected | Actual | Severity | Status |
|----|----------|----------|--------|----------|--------|
| Q1 |          |          |        |          |        |
| Q2 |          |          |        |          |        |

## Exit criteria

- All smoke sequence steps pass
- No 500 errors in function logs for core flows
- No blocker/high-severity defects open
- Optional email verification passes (or is explicitly deferred with manual-share fallback accepted)
