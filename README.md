# shortstory.ink

V1 build for an elegant, editor-led creative writing platform.

## Feedback email (T9)

Publishing/reissuing a writer link now attempts to send an email automatically.

Expected environment variables:

- `RESEND_API_KEY` — API key for Resend
- `FEEDBACK_EMAIL_FROM` (or `EMAIL_FROM`) — sender address used for feedback
  emails

Fallback behavior:

- If email is not configured or fails, publish still succeeds.
- The teacher publish screen clearly indicates the email outcome and keeps the
  copyable link visible.
