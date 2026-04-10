import crypto from 'node:crypto'
import { html } from './_lib/teacher-auth.js'

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

function isUuid(value = '') {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		String(value).trim(),
	)
}

function page(title, body) {
	return `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(title)}</title>
	<style>
		body{max-width:760px;margin:36px auto;padding:0 20px;color:#111;font:18px/1.65 Georgia,serif}
		h1{margin:0 0 .55rem;font:600 30px/1.2 Georgia,serif}
		.note{margin:.8rem 0 1rem;padding:.75rem .9rem;background:#f8fafc;border-left:3px solid #5b7a94}
		.actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:.95rem;font:15px/1.45 system-ui,sans-serif}
		.actions a{text-decoration:none;color:#0f172a;border-bottom:1px solid #cbd5e1}
	</style></head><body>${body}</body></html>`
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
	const token = (event.queryStringParameters?.token || '').trim()
	if (!token) {
		return html(
			400,
			page(
				'Feedback link missing',
				`<h1>This feedback link is incomplete.</h1>
				<p class="note">Please open the full link from your teacher email.</p>
				<div class="actions"><a href="/">Go to home page</a></div>`,
			),
		)
	}

	const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

	const [submission] = await sb(
		`submissions?feedback_access_token_hash=eq.${tokenHash}&select=id,latest_version_id,writer_first_name,feedback_access_token_expires_at`,
	)
	if (!submission) {
		return html(
			404,
			page(
				'Feedback link no longer valid',
				`<h1>This feedback link is no longer valid.</h1>
				<p class="note">It may have been replaced by a newer link after an updated review, or copied incorrectly.</p>
				<p>Please contact your teacher and ask for the latest feedback link.</p>
				<div class="actions"><a href="/">Go to home page</a></div>`,
			),
		)
	}

	if (
		submission.feedback_access_token_expires_at &&
		new Date(submission.feedback_access_token_expires_at).getTime() < Date.now()
	) {
		return html(
			410,
			page(
				'Feedback link expired',
				`<h1>This feedback link has expired.</h1>
				<p class="note">For security, feedback links expire after a set period.</p>
				<p>Please contact your teacher to request a new link.</p>
				<div class="actions"><a href="/">Go to home page</a></div>`,
			),
		)
	}

	const versionId = submission.latest_version_id
	if (!isUuid(versionId)) {
		return html(
			409,
			page(
				'Feedback temporarily unavailable',
				`<h1>This feedback is temporarily unavailable.</h1>
				<p class="note">The review version linked to this token isn’t ready to display yet.</p>
				<p>Please contact your teacher and ask for a newly published feedback link.</p>
				<div class="actions"><a href="/">Go to home page</a></div>`,
			),
		)
	}
	const paragraphs = await sb(
		`submission_paragraphs?submission_version_id=eq.${versionId}&select=id,position,text&order=position.asc`,
	)
	const comments = await sb(
		`comments?submission_version_id=eq.${versionId}&visibility=eq.writer&select=paragraph_id,body,created_at&order=created_at.asc`,
	)
	const [summary] = await sb(
		`review_summaries?submission_version_id=eq.${versionId}&select=body,updated_at&limit=1`,
	)

	const byParagraph = new Map()
	for (const c of comments) {
		if (!byParagraph.has(c.paragraph_id)) byParagraph.set(c.paragraph_id, [])
		byParagraph.get(c.paragraph_id).push(c)
	}

	const content = paragraphs
		.map((p) => {
			const list = byParagraph.get(p.id) || []
			return `<section class="p-block">
                <p class="p-text">${esc(p.text)}</p>
                ${
									list.length
										? `<aside class="p-feedback">
                    <div class="p-feedback__label">Feedback</div>
                    ${list.map((c) => `<p class="p-feedback__item">${esc(c.body)}</p>`).join('')}
                </aside>`
										: ''
								}
            </section>`
		})
		.join('')

	return html(
		200,
		`<!doctype html><html><head><meta charset="utf-8"/><title>Your feedback</title>
        <style>
            body{max-width:820px;margin:36px auto;padding:0 20px;color:#111;font:18px/1.7 Georgia,serif}
			.summary{margin:0 0 1rem;padding:.8rem .95rem;background:#f8fafc;border-left:3px solid #5b7a94}
			.summary__label{margin:0 0 .35rem;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#334155}
			.summary__body{margin:0;font:16px/1.55 system-ui,sans-serif;color:#0f172a;white-space:pre-wrap}
			.summary__meta{margin:.4rem 0 0;font:12px/1.2 system-ui,sans-serif;color:#64748b}
            .p-block{margin:0 0 1.35rem}
            .p-text{margin:0}
            .p-feedback{margin:.6rem 0 0;padding:.75rem .9rem;background:#f7f8f6;border-left:3px solid #7c8b76}
            .p-feedback__label{margin:0 0 .35rem;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#374151}
            .p-feedback__item{margin:.35rem 0 0;font:15px/1.55 system-ui,sans-serif;color:#111827}
        </style></head><body>
        <h1>Your feedback</h1>
        <p>${esc(submission.writer_first_name || '')}</p>
		${summary?.body ? `<section class="summary"><p class="summary__label">Overall note</p><p class="summary__body">${esc(summary.body)}</p>${summary?.updated_at ? `<p class="summary__meta">Updated ${esc(new Date(summary.updated_at).toLocaleString())}</p>` : ''}</section>` : ''}
        ${content}
        </body></html>`,
	)
}

