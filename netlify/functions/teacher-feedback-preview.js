import {
	html,
	renderTeacherPage,
	requireTeacher,
	sbInsert,
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

function normalizeUuid(value = '') {
	const v = String(value).trim().split('?')[0]
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		v,
	)
		? v
		: ''
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

async function sbPatch(path, payload) {
	const separator = path.includes('?') ? '&' : '?'
	const r = await fetch(
		`${SUPABASE_URL}/rest/v1/${path}${separator}select=id`,
		{
			method: 'PATCH',
			headers: {
				apikey: SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
				'content-type': 'application/json',
				Prefer: 'return=representation',
			},
			body: JSON.stringify(payload),
		},
	)
	if (!r.ok) throw new Error(await r.text())
	return r.json()
}

async function sbDelete(path) {
	const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		method: 'DELETE',
		headers: {
			apikey: SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
		},
	})
	if (!r.ok) throw new Error(await r.text())
}

async function sbUpsert(path, payload) {
	const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		method: 'POST',
		headers: {
			apikey: SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
			'content-type': 'application/json',
			Prefer: 'resolution=merge-duplicates,return=representation',
		},
		body: JSON.stringify(payload),
	})
	if (!r.ok) throw new Error(await r.text())
	return r.json()
}

async function getSubmission(submissionId) {
	const [submission] = await sb(
		`submissions?id=eq.${submissionId}&select=id,latest_version_id,writer_email,writer_first_name,status`,
	)
	return submission || null
}

async function ensureEditableSubmission(submissionId) {
	const submission = await getSubmission(submissionId)
	if (!submission) return { ok: false, reason: 'notFound' }

	if (submission.status === 'archived') {
		return { ok: false, reason: 'archivedLocked', submission }
	}

	if (submission.status === 'feedback_ready') {
		return { ok: false, reason: 'needsReopen', submission }
	}

	if (submission.status === 'submitted') {
		await sbPatch(`submissions?id=eq.${encodeURIComponent(submissionId)}`, {
			status: 'in_review',
		})
		submission.status = 'in_review'
	}

	return { ok: true, submission }
}

function feedbackRedirect(submissionId, query) {
	return {
		statusCode: 302,
		headers: {
			Location: `/.netlify/functions/teacher-feedback-preview?submissionId=${encodeURIComponent(submissionId)}&${query}`,
		},
		body: '',
	}
}

export async function handler(event) {
	const auth = await requireTeacher(event)
	if (auth.error) return auth.error

	if (event.httpMethod === 'POST') {
		const params = new URLSearchParams(event.body || '')
		const action = (params.get('action') || 'create').trim()
		const submissionId = (params.get('submissionId') || '').trim()
		const submissionVersionId = (params.get('submissionVersionId') || '').trim()
		const paragraphId = (params.get('paragraphId') || '').trim()
		const commentId = normalizeUuid(params.get('commentId') || '')
		const body = (params.get('body') || '').trim()
		const visibility =
			params.get('visibility') === 'private' ? 'private' : 'writer'

		if (!submissionId) {
			return {
				statusCode: 302,
				headers: {
					Location:
						'/.netlify/functions/teacher-submissions?error=missingSubmission',
				},
				body: '',
			}
		}

		if (action === 'reopen') {
			const submission = await getSubmission(submissionId)
			if (!submission) {
				return {
					statusCode: 302,
					headers: {
						Location:
							'/.netlify/functions/teacher-submissions?error=missingSubmission',
					},
					body: '',
				}
			}

			if (submission.status !== 'feedback_ready') {
				return feedbackRedirect(submissionId, 'error=reopenInvalid')
			}

			await sbPatch(`submissions?id=eq.${encodeURIComponent(submissionId)}`, {
				status: 'in_review',
				reviewed_at: null,
			})

			return feedbackRedirect(submissionId, 'reopened=1')
		}

		const editable = await ensureEditableSubmission(submissionId)
		if (!editable.ok) {
			if (editable.reason === 'needsReopen') {
				return feedbackRedirect(submissionId, 'error=needsReopen')
			}
			if (editable.reason === 'archivedLocked') {
				return feedbackRedirect(submissionId, 'error=archivedLocked')
			}
			return {
				statusCode: 302,
				headers: {
					Location:
						'/.netlify/functions/teacher-submissions?error=missingSubmission',
				},
				body: '',
			}
		}

		if (action === 'create') {
			if (!submissionVersionId || !paragraphId || !body) {
				return feedbackRedirect(submissionId, 'error=missing')
			}

			await sbInsert('comments', {
				submission_id: submissionId,
				submission_version_id: submissionVersionId,
				paragraph_id: paragraphId,
				author_id: auth.user.id,
				body,
				visibility,
				status: 'open',
			})

			return feedbackRedirect(submissionId, 'saved=1')
		}

		if (action === 'summary-save') {
			if (!submissionVersionId || !body) {
				return feedbackRedirect(submissionId, 'error=missingSummary')
			}

			await sbUpsert(
				'review_summaries?on_conflict=submission_version_id&select=id',
				{
					submission_id: submissionId,
					submission_version_id: submissionVersionId,
					author_id: auth.user.id,
					body,
					updated_at: new Date().toISOString(),
				},
			)

			return feedbackRedirect(submissionId, 'summarySaved=1')
		}

		if (action === 'update') {
			if (!commentId || !body) {
				return feedbackRedirect(submissionId, 'error=missing')
			}

			await sbPatch(
				`comments?id=eq.${encodeURIComponent(commentId)}&author_id=eq.${encodeURIComponent(auth.user.id)}`,
				{ body, visibility },
			)

			return feedbackRedirect(submissionId, 'updated=1')
		}

		if (action === 'delete') {
			if (!commentId) {
				return feedbackRedirect(submissionId, 'error=missing')
			}

			await sbDelete(
				`comments?id=eq.${encodeURIComponent(commentId)}&author_id=eq.${encodeURIComponent(auth.user.id)}`,
			)

			return feedbackRedirect(submissionId, 'deleted=1')
		}

		return feedbackRedirect(submissionId, 'error=badAction')
	}

	const submissionId = event.queryStringParameters?.submissionId || ''
	const saved = event.queryStringParameters?.saved === '1'
	const updated = event.queryStringParameters?.updated === '1'
	const deleted = event.queryStringParameters?.deleted === '1'
	const summarySaved = event.queryStringParameters?.summarySaved === '1'
	const reopened = event.queryStringParameters?.reopened === '1'
	const error = event.queryStringParameters?.error === 'missing'
	const missingSummary = event.queryStringParameters?.error === 'missingSummary'
	const needsReopen = event.queryStringParameters?.error === 'needsReopen'
	const archivedLocked = event.queryStringParameters?.error === 'archivedLocked'
	const reopenInvalid = event.queryStringParameters?.error === 'reopenInvalid'
	const badAction = event.queryStringParameters?.error === 'badAction'

	if (!submissionId) return html(200, '<p>Use ?submissionId=... </p>')

	const submission = await getSubmission(submissionId)
	if (!submission?.latest_version_id)
		return html(404, '<p>Submission not found.</p>')

	const versionId = submission.latest_version_id

	const paragraphs = await sb(
		`submission_paragraphs?submission_version_id=eq.${versionId}&select=id,pid,position,text&order=position.asc`,
	)

	const comments = await sb(
		`comments?submission_version_id=eq.${versionId}&visibility=eq.writer&select=id,paragraph_id,body,created_at&order=created_at.asc`,
	)

	const [summary] = await sb(
		`review_summaries?submission_version_id=eq.${versionId}&select=id,body,updated_at&limit=1`,
	)

	const canEdit =
		submission.status !== 'feedback_ready' && submission.status !== 'archived'
	const showReopen = submission.status === 'feedback_ready'

	const byParagraph = new Map()
	for (const c of comments) {
		if (!byParagraph.has(c.paragraph_id)) byParagraph.set(c.paragraph_id, [])
		byParagraph.get(c.paragraph_id).push(c)
	}

	const bodyHtml = paragraphs
		.map((p) => {
			const list = byParagraph.get(p.id) || []
			const feedbackHtml = list.length
				? `<aside class="p-feedback">
					<div class="p-feedback__label">Feedback</div>
					${list
						.map(
							(c) => `
							<div class="p-feedback__row">
								<p class="p-feedback__item">${esc(c.body)}</p>
								${
									canEdit
										? `<form class="p-inline" method="post" action="/.netlify/functions/teacher-feedback-preview">
									<input type="hidden" name="action" value="update" />
									<input type="hidden" name="submissionId" value="${esc(submission.id)}" />
									<input type="hidden" name="commentId" value="${esc(c.id)}" />
									<input type="hidden" name="visibility" value="writer" />
									<textarea name="body" rows="2" required>${esc(c.body)}</textarea>
									<button type="submit">Update</button>
								</form>
								<form class="p-inline p-inline--delete" method="post" action="/.netlify/functions/teacher-feedback-preview">
									<input type="hidden" name="action" value="delete" />
									<input type="hidden" name="submissionId" value="${esc(submission.id)}" />
									<input type="hidden" name="commentId" value="${esc(c.id)}" />
									<button type="submit">Delete</button>
								</form>`
										: '<p class="summary__meta">Locked while feedback is ready.</p>'
								}
							</div>
						`,
						)
						.join('')}
				</aside>`
				: ''
			return `
                <section class="p-block">
                    <p class="p-text">${esc(p.text)}</p>

                    ${feedbackHtml}

					${
						canEdit
							? `
                    <form class="p-form" method="post" action="/.netlify/functions/teacher-feedback-preview">
                        <input type="hidden" name="action" value="create" />
                        <input type="hidden" name="submissionId" value="${esc(submission.id)}" />
                        <input type="hidden" name="submissionVersionId" value="${esc(versionId)}" />
                        <input type="hidden" name="paragraphId" value="${esc(p.id)}" />
                        <input type="hidden" name="visibility" value="writer" />
                        <label class="p-form__label" for="c-${esc(p.id)}">Add feedback to this paragraph</label>
                        <textarea id="c-${esc(p.id)}" name="body" rows="3" required placeholder="Write concise, clear feedback..."></textarea>
                        <button type="submit">Save feedback</button>
                    </form>
							`
							: ''
					}
                </section>
            `
		})
		.join('')

	return html(
		200,
		renderTeacherPage({
			title: 'Teacher feedback',
			heading: 'Teacher feedback',
			maxWidth: '860px',
			nav: [
				{
					href: '/.netlify/functions/teacher-submissions',
					label: 'Submissions',
				},
				{
					href: `/.netlify/functions/teacher-create-writer-link?submissionId=${encodeURIComponent(submission.id)}`,
					label: 'Publish / reissue writer link',
				},
				{ href: '/.netlify/functions/teacher-logout', label: 'Log out' },
			],
			extraStyles: `
				.msg{padding:.55rem .75rem;border-radius:6px;margin:1rem 0;font:14px/1.4 system-ui,sans-serif}
				.msg--ok{background:#edf7ed;color:#1f5130}
				.msg--err{background:#fdecec;color:#7a1f1f}
				.summary{margin:.85rem 0 1rem;padding:.75rem .85rem;border:1px solid #e5e7eb;border-radius:8px;background:#fcfcfc}
				.summary__label{display:block;margin:0 0 .35rem;font:600 13px/1.2 system-ui,sans-serif}
				.summary__meta{margin:.35rem 0 0;font:12px/1.2 system-ui,sans-serif;color:#64748b}
				.p-block{margin:0 0 1.35rem;padding:0 0 .35rem}
				.p-text{margin:0;font:18px/1.7 Georgia,serif}
				.p-feedback{margin:.6rem 0 0;padding:.75rem .9rem;background:#f7f8f6;border-left:3px solid #7c8b76}
				.p-feedback__label{margin:0 0 .35rem;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#374151}
				.p-feedback__item{margin:.35rem 0 0;font:15px/1.55 system-ui,sans-serif;color:#111827}
				.p-feedback__row{margin:.55rem 0 0;padding:.45rem .5rem;border:1px solid #d9e0e8;border-radius:8px;background:#fff}
				.p-form{margin:.65rem 0 0;padding:.65rem .75rem;border:1px solid #e5e7eb;border-radius:8px;background:#fff}
				.p-inline{margin:.45rem 0 0}
				.p-inline textarea{width:100%;resize:vertical;font:14px/1.45 system-ui,sans-serif;padding:.4rem}
				.p-inline--delete{margin-top:.35rem}
				.p-form__label{display:block;margin:0 0 .35rem;font:600 13px/1.2 system-ui,sans-serif}
				textarea{width:100%;resize:vertical;font:15px/1.45 system-ui,sans-serif;padding:.5rem}
				button{margin-top:.45rem}
			`,
			content: `
				<p><strong>${esc(submission.writer_first_name || '')}</strong> ${esc(submission.writer_email || '')}</p>
				<p class="summary__meta">Status: <strong>${esc(submission.status || 'submitted')}</strong></p>

				${saved ? '<div class="msg msg--ok">Feedback saved.</div>' : ''}
				${updated ? '<div class="msg msg--ok">Feedback updated.</div>' : ''}
				${deleted ? '<div class="msg msg--ok">Feedback deleted.</div>' : ''}
				${summarySaved ? '<div class="msg msg--ok">Summary saved.</div>' : ''}
				${reopened ? '<div class="msg msg--ok">Submission reopened for editing.</div>' : ''}
				${error ? '<div class="msg msg--err">Please fill all required fields.</div>' : ''}
				${missingSummary ? '<div class="msg msg--err">Summary can’t be empty.</div>' : ''}
				${needsReopen ? '<div class="msg msg--err">Feedback is published. Reopen before editing.</div>' : ''}
				${archivedLocked ? '<div class="msg msg--err">This submission is archived and locked.</div>' : ''}
				${reopenInvalid ? '<div class="msg msg--err">Only feedback-ready submissions can be reopened.</div>' : ''}
				${badAction ? '<div class="msg msg--err">Invalid feedback action.</div>' : ''}

				${
					showReopen
						? `<form class="summary" method="post" action="/.netlify/functions/teacher-feedback-preview">
							<input type="hidden" name="action" value="reopen" />
							<input type="hidden" name="submissionId" value="${esc(submission.id)}" />
							<label class="summary__label">Feedback is currently published</label>
							<p class="summary__meta">Reopen to make edits. You can republish by creating/reissuing a writer link.</p>
							<button type="submit">Reopen for editing</button>
						</form>`
						: ''
				}

				<form class="summary" method="post" action="/.netlify/functions/teacher-feedback-preview">
					<input type="hidden" name="action" value="summary-save" />
					<input type="hidden" name="submissionId" value="${esc(submission.id)}" />
					<input type="hidden" name="submissionVersionId" value="${esc(versionId)}" />
					<label class="summary__label" for="summary-body">Overall summary for writer</label>
					<textarea id="summary-body" name="body" rows="4" required ${canEdit ? '' : 'readonly'} placeholder="Write a concise overall note to accompany paragraph feedback...">${esc(summary?.body || '')}</textarea>
					${canEdit ? '<button type="submit">Save summary</button>' : '<p class="summary__meta">Summary is locked while this submission is not editable.</p>'}
					${summary?.updated_at ? `<p class="summary__meta">Last updated: ${esc(new Date(summary.updated_at).toLocaleString())}</p>` : ''}
				</form>

				${bodyHtml}
			`,
		}),
	)
}

