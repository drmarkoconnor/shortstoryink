import {
	html,
	requireWriter,
	renderWriterPage,
	sbServer,
} from './_lib/writer-auth.js'

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

export async function handler(event) {
	const auth = await requireWriter(event)
	if (auth.error) {
		return {
			statusCode: 302,
			headers: { Location: '/.netlify/functions/writer-login' },
			body: '',
		}
	}

	const writerEmail = auth.user.email || ''
	const writerId = auth.user.id

	let rows = []
	try {
		rows = await sbServer(
			`submissions?or=(writer_id.eq.${writerId},writer_email.eq.${encodeURIComponent(writerEmail)})&select=id,created_at,status&order=created_at.desc&limit=20`,
		)
	} catch {
		rows = []
	}

	const cards = rows.length
		? rows
				.map(
					(s) => `<article class="card">
						<div style="font:600 14px/1.2 system-ui,sans-serif;color:#334155;text-transform:uppercase;letter-spacing:.04em">Submission</div>
						<p style="margin:.35rem 0 .2rem;font:15px/1.45 system-ui,sans-serif"><strong>Status:</strong> ${esc(s.status || 'submitted')}</p>
						<p class="ww-muted" style="margin:.2rem 0 0">${esc(formatDate(s.created_at))}</p>
					</article>`,
				)
				.join('')
		: '<p class="ww-muted">No submissions yet. Start with the writing room.</p>'

	return html(
		200,
		renderWriterPage({
			title: 'Writer dashboard',
			heading: 'Writer dashboard',
			nav: [
				{ href: '/', label: 'Home' },
				{ href: '/try/', label: 'Try writing' },
				{ href: '/.netlify/functions/writer-logout', label: 'Log out' },
			],
			maxWidth: '980px',
			content: `
				<p>Signed in as <strong>${esc(writerEmail)}</strong></p>
				<section class="ww-panel">
					<h2 style="margin:.1rem 0 .4rem;font:600 22px/1.2 Georgia,serif">Your work</h2>
					<p class="ww-muted">Next pass: cards/carousel clips with tagging + full CRUD.</p>
					<div class="grid">${cards}</div>
				</section>
			`,
		}),
	)
}

