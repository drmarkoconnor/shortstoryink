import {
	escHtml,
	html,
	renderTeacherPage,
	requireTeacher,
} from './_lib/teacher-auth.js'

const SUPABASE_URL =
	process.env.SUPABASE_URL ||
	(process.env.SUPABASE_PROJECT_ID
		? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
		: null)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function esc(s = '') {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function formatDate(value) {
	if (!value) return '—'
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) return '—'
	return d.toLocaleString()
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

export async function handler(event) {
	const auth = await requireTeacher(event)
	if (auth.error) return auth.error

	try {
		const rows = await sb(
			`submissions?select=id,writer_first_name,writer_email,created_at,latest_version_id,status&order=created_at.desc&limit=50`,
		)

		const versionIds = rows.map((r) => r.latest_version_id).filter(Boolean)

		const summaryRows = versionIds.length
			? await sb(
					`review_summaries?select=submission_version_id&submission_version_id=in.(${versionIds.join(',')})`,
				)
			: []

		const summaryVersionIds = new Set(
			summaryRows.map((r) => r.submission_version_id),
		)

		const list = rows.length
			? rows
					.map((s) => {
						const name = esc(s.writer_first_name || '—')
						const email = esc(s.writer_email || '—')
						const status = esc(s.status || 'submitted')
						const summarySet = summaryVersionIds.has(s.latest_version_id)
						const submitted = formatDate(s.created_at)
						const canReview = Boolean(s.latest_version_id)
						const canPublish = Boolean(s.latest_version_id)
						const reviewAction = canReview
							? `<a href="/.netlify/functions/teacher-feedback-preview?submissionId=${encodeURIComponent(s.id)}">Review</a>`
							: '<span class="muted">Review unavailable</span>'
						const publishAction = canPublish
							? `<a href="/.netlify/functions/teacher-create-writer-link?submissionId=${encodeURIComponent(s.id)}">Publish / reissue writer link</a>`
							: '<span class="muted">Publish unavailable</span>'

						return `
						<tr>
							<td>${name}</td>
							<td>${email}</td>
							<td><span class="status">${status}</span>${summarySet ? '<span class="status status--ok">summary set</span>' : ''}</td>
							<td>${esc(submitted)}</td>
							<td>
								${reviewAction}
								<span class="sep">·</span>
								${publishAction}
							</td>
						</tr>
						`
					})
					.join('')
			: `<tr><td colspan="5" class="muted">No submissions yet. Use the try page to submit a draft first.</td></tr>`

		return html(
			200,
			renderTeacherPage({
				title: 'Teacher submissions',
				heading: 'Teacher submissions',
				nav: [
					{
						href: '/.netlify/functions/teacher-submissions',
						label: 'Submissions',
					},
					{ href: '/.netlify/functions/teacher-logout', label: 'Log out' },
				],
				maxWidth: '1080px',
				extraStyles: `
					table{width:100%;border-collapse:collapse;margin-top:1rem}
					th,td{padding:.62rem .72rem;border:1px solid #e5e7eb;vertical-align:top;text-align:left}
					th{background:#f8fafc;font:600 13px/1.2 system-ui,sans-serif;letter-spacing:.02em;text-transform:uppercase;color:#374151}
					.status{display:inline-block;padding:.16rem .5rem;border-radius:999px;background:#f1f5f9;font:600 .79rem/1 system-ui,sans-serif;color:#0f172a}
					.status--ok{margin-left:.35rem;background:#e8f5ec;color:#1f5130}
					.muted{color:#6b7280}
					.sep{color:#9ca3af;padding:0 .35rem}
				`,
				content: `<p class="tt-muted">Review manuscripts, add feedback, and issue writer links.</p>
				<table>
					<thead>
						<tr><th>Name</th><th>Email</th><th>Status</th><th>Submitted</th><th>Actions</th></tr>
					</thead>
					<tbody>${list}</tbody>
				</table>`,
			}),
		)
	} catch (e) {
		return html(
			500,
			renderTeacherPage({
				title: 'Teacher submissions',
				heading: 'Teacher submissions',
				nav: [{ href: '/.netlify/functions/teacher-logout', label: 'Log out' }],
				content: `<p class="tt-msg tt-msg--err">Could not load submissions right now.</p><pre>${escHtml(e.message)}</pre>`,
				extraStyles: `pre{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:.7rem .8rem}`,
			}),
		)
	}
}

