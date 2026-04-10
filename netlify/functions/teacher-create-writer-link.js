import crypto from 'node:crypto'
import {
	html,
	json,
	renderTeacherPage,
	requireTeacher,
} from './_lib/teacher-auth.js'

const SUPABASE_URL =
	process.env.SUPABASE_URL ||
	(process.env.SUPABASE_PROJECT_ID
		? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
		: null)

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE_URL = process.env.URL || 'http://localhost:8888'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM =
	process.env.FEEDBACK_EMAIL_FROM ||
	process.env.EMAIL_FROM ||
	'noreply@shortstory.ink'

function esc(s = '') {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

async function sbPatch(path, payload) {
	const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		method: 'PATCH',
		headers: {
			apikey: SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
			'content-type': 'application/json',
			Prefer: 'return=representation',
		},
		body: JSON.stringify(payload),
	})
	if (!r.ok) throw new Error(await r.text())
	return r.json()
}

async function sb(path) {
	const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		headers: {
			apikey: SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
		},
	})
	if (!r.ok) throw new Error(await r.text())
	return r.json()
}

function isUuid(value = '') {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		String(value).trim(),
	)
}

function normalizeDays(input) {
	const d = Number(input)
	if (!Number.isFinite(d)) return 90
	return Math.max(1, Math.min(365, Math.trunc(d)))
}

function formatDate(value) {
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) return value
	return d.toLocaleString()
}

async function sendWriterFeedbackEmail({
	to,
	writerName,
	link,
	expiresAt,
	wasReissue,
}) {
	if (!to) {
		return { sent: false, skipped: true, reason: 'missing_writer_email' }
	}

	if (!RESEND_API_KEY) {
		return { sent: false, skipped: true, reason: 'email_not_configured' }
	}

	const subject = wasReissue
		? 'Your updated shortstory.ink feedback link'
		: 'Your shortstory.ink feedback is ready'

	const safeName = writerName?.trim() || 'Writer'
	const expiryText = formatDate(expiresAt)
	const text = `${safeName},\n\nYour feedback is ready.\n\nOpen your feedback link:\n${link}\n\nThis link expires: ${expiryText}\n\nshortstory.ink`
	const htmlBody = `<p>${esc(safeName)},</p><p>Your feedback is ready.</p><p><a href="${esc(link)}">Open your feedback</a></p><p>This link expires: ${esc(expiryText)}</p><p>shortstory.ink</p>`

	try {
		const r = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${RESEND_API_KEY}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				from: EMAIL_FROM,
				to: [to],
				subject,
				text,
				html: htmlBody,
			}),
		})

		if (!r.ok) {
			return {
				sent: false,
				skipped: false,
				error: `email_send_failed (${r.status})`,
			}
		}

		const payload = await r.json()
		return { sent: true, skipped: false, id: payload?.id || null }
	} catch {
		return { sent: false, skipped: false, error: 'email_send_failed' }
	}
}

async function getPublishReadiness(versionId) {
	const [summary] = await sb(
		`review_summaries?submission_version_id=eq.${versionId}&select=id,body&limit=1`,
	)

	const comments = await sb(
		`comments?submission_version_id=eq.${versionId}&visibility=eq.writer&select=id&limit=1`,
	)

	return {
		hasSummary: Boolean(summary?.body?.trim()),
		hasWriterComments: comments.length > 0,
	}
}

async function createLink(submissionId, days, allowEmpty = false) {
	const [submission] = await sb(
		`submissions?id=eq.${submissionId}&select=id,status,latest_version_id,writer_first_name,writer_email&limit=1`,
	)
	if (!submission) throw new Error('Submission not found')
	if (submission.status === 'archived') {
		throw new Error('Archived submissions cannot be published')
	}
	if (!isUuid(submission.latest_version_id)) {
		throw new Error(
			'Submission has no readable draft version yet. Open review first and save/reopen the draft before publishing.',
		)
	}

	const readiness = await getPublishReadiness(submission.latest_version_id)
	if (!allowEmpty && !readiness.hasSummary && !readiness.hasWriterComments) {
		throw new Error('__PUBLISH_EMPTY__')
	}

	const token = crypto.randomBytes(24).toString('base64url')
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
	const clampedDays = normalizeDays(days)
	const expiresAt = new Date(
		Date.now() + clampedDays * 86400 * 1000,
	).toISOString()
	const reviewedAt = new Date().toISOString()
	const wasReissue = submission.status === 'feedback_ready'

	const rows = await sbPatch(`submissions?id=eq.${submissionId}&select=id`, {
		feedback_access_token_hash: tokenHash,
		feedback_access_token_expires_at: expiresAt,
		status: 'feedback_ready',
		reviewed_at: reviewedAt,
	})
	if (!rows?.length) throw new Error('Submission not found')

	const link = `${SITE_URL}/.netlify/functions/writer-feedback-preview?token=${encodeURIComponent(token)}`
	return {
		link,
		expiresAt,
		reviewedAt,
		wasReissue,
		writerName: submission.writer_first_name || '',
		writerEmail: submission.writer_email || '',
	}
}

export async function handler(event) {
	const auth = await requireTeacher(event)
	if (auth.error) return auth.error

	try {
		// Browser-friendly GET: ?submissionId=...&days=90
		if (event.httpMethod === 'GET') {
			const submissionId = (
				event.queryStringParameters?.submissionId || ''
			).trim()
			const days = normalizeDays(event.queryStringParameters?.days || 90)
			const allowEmpty = event.queryStringParameters?.allowEmpty === '1'
			if (!submissionId) return html(400, '<p>Missing submissionId.</p>')

			const {
				link,
				expiresAt,
				reviewedAt,
				wasReissue,
				writerName,
				writerEmail,
			} = await createLink(submissionId, days, allowEmpty)

			const emailResult = await sendWriterFeedbackEmail({
				to: writerEmail,
				writerName,
				link,
				expiresAt,
				wasReissue,
			})

			const emailMessage = emailResult.sent
				? `Feedback email sent to ${writerEmail}.`
				: emailResult.skipped
					? emailResult.reason === 'email_not_configured'
						? 'Email not configured. Share the link manually.'
						: 'Writer email missing. Share the link manually.'
					: 'Could not send email automatically. Share the link manually.'
			const emailClass = emailResult.sent ? 'msg msg--ok' : 'msg msg--warn'

			return html(
				200,
				renderTeacherPage({
					title: wasReissue ? 'Writer link reissued' : 'Writer link published',
					heading: wasReissue
						? 'Writer link reissued'
						: 'Writer link published',
					maxWidth: '760px',
					nav: [
						{
							href: '/.netlify/functions/teacher-submissions',
							label: 'Submissions',
						},
						{
							href: `/.netlify/functions/teacher-feedback-preview?submissionId=${encodeURIComponent(submissionId)}`,
							label: 'Review submission',
						},
						{ href: '/.netlify/functions/teacher-logout', label: 'Log out' },
					],
					extraStyles: `
						pre{white-space:pre-wrap;word-break:break-word;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:.75rem .8rem}
						.meta{margin:.35rem 0;color:#475569}
					`,
					content: `<div class="tt-panel">
						<p><strong>${esc(writerName || 'Writer')}</strong> ${esc(writerEmail)}</p>
						<p class="${emailClass === 'msg msg--ok' ? 'tt-msg tt-msg--ok' : 'tt-msg tt-msg--warn'}">${esc(emailMessage)}</p>
						<p>Send this link to the writer:</p>
						<pre>${link}</pre>
						<p class="meta">Status set to: <strong>feedback_ready</strong></p>
						<p class="meta">Reviewed at: ${reviewedAt}</p>
						<p class="meta">Expires (default 90 days): ${expiresAt}</p>
						<p><a href="${link}">Open writer view</a></p>
					</div>`,
				}),
			)
		}

		// API POST still supported
		if (event.httpMethod === 'POST') {
			const {
				submissionId,
				days = 90,
				allowEmpty = false,
				sendEmail = true,
			} = JSON.parse(event.body || '{}')
			if (!submissionId)
				return json(400, { ok: false, error: 'submissionId required' })
			const result = await createLink(submissionId, days, Boolean(allowEmpty))
			const emailResult = sendEmail
				? await sendWriterFeedbackEmail({
						to: result.writerEmail,
						writerName: result.writerName,
						link: result.link,
						expiresAt: result.expiresAt,
						wasReissue: result.wasReissue,
					})
				: { sent: false, skipped: true, reason: 'send_email_disabled' }
			return json(200, { ok: true, ...result, email: emailResult })
		}

		return json(405, { ok: false, error: 'Method not allowed' })
	} catch (e) {
		if (event.httpMethod === 'GET') {
			const submissionId = (
				event.queryStringParameters?.submissionId || ''
			).trim()
			const days = normalizeDays(event.queryStringParameters?.days || 90)

			if (String(e.message) === '__PUBLISH_EMPTY__') {
				return html(
					409,
					renderTeacherPage({
						title: 'Publish check',
						heading: 'Publish check',
						maxWidth: '760px',
						nav: [
							{
								href: '/.netlify/functions/teacher-submissions',
								label: 'Submissions',
							},
							{
								href: `/.netlify/functions/teacher-feedback-preview?submissionId=${encodeURIComponent(submissionId)}`,
								label: 'Review submission',
							},
							{ href: '/.netlify/functions/teacher-logout', label: 'Log out' },
						],
						extraStyles: `.actions{display:flex;gap:.7rem;flex-wrap:wrap;margin-top:.9rem}`,
						content: `<p class="tt-msg tt-msg--warn">There are no writer-visible paragraph comments and no summary note yet. Add feedback first, or publish anyway.</p>
						<div class="actions">
							<a href="/.netlify/functions/teacher-create-writer-link?submissionId=${encodeURIComponent(submissionId)}&days=${days}&allowEmpty=1">Publish anyway</a>
							<a href="/.netlify/functions/teacher-feedback-preview?submissionId=${encodeURIComponent(submissionId)}">Go back to review</a>
						</div>`,
					}),
				)
			}

			return html(
				400,
				renderTeacherPage({
					title: 'Cannot publish writer link',
					heading: 'Cannot publish writer link',
					maxWidth: '760px',
					nav: [
						{
							href: '/.netlify/functions/teacher-submissions',
							label: 'Submissions',
						},
						{ href: '/.netlify/functions/teacher-logout', label: 'Log out' },
					],
					content: `<p class="tt-msg tt-msg--err">${esc(String(e.message || 'Unexpected error'))}</p>`,
				}),
			)
		}
		return json(500, { ok: false, error: e.message })
	}
}

