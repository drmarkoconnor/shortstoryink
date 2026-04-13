import {
	authCookie,
	escHtml,
	getProfileRole,
	html,
	renderTeacherPage,
} from './_lib/teacher-auth.js'

const SUPABASE_URL =
	process.env.SUPABASE_URL ||
	(process.env.SUPABASE_PROJECT_ID
		? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
		: null)

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

export async function handler(event) {
	if (event.httpMethod === 'GET') {
		const invalid = event.queryStringParameters?.error === 'invalid'
		const forbidden = event.queryStringParameters?.error === 'forbidden'
		const reason = event.queryStringParameters?.reason || ''
		return html(
			200,
			renderTeacherPage({
				title: 'Teacher sign in',
				heading: 'Teacher sign in',
				maxWidth: '680px',
				content: `
					<p class="tt-muted">Use your teacher account to review submissions and publish writer feedback links.</p>
					${invalid ? '<p class="tt-msg tt-msg--err">Invalid email or password.</p>' : ''}
					${forbidden ? '<p class="tt-msg tt-msg--err">This account does not have a teacher role.</p>' : ''}
					${reason ? `<p class="tt-msg tt-msg--warn"><strong>Debug:</strong> ${escHtml(reason)}</p>` : ''}
					<form class="tt-panel" method="post" action="/.netlify/functions/teacher-login">
						<label for="teacher-email">Email</label>
						<input id="teacher-email" type="email" name="email" autocomplete="email" required />
						<label for="teacher-password">Password</label>
						<input id="teacher-password" type="password" name="password" autocomplete="current-password" required />
						<button type="submit">Sign in</button>
					</form>`,
			}),
		)
	}

	if (event.httpMethod !== 'POST') return html(405, '<p>Method not allowed</p>')

	const params = new URLSearchParams(event.body || '')
	const email = (params.get('email') || '').trim().toLowerCase()
	const password = params.get('password') || ''

	const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: {
			apikey: SUPABASE_ANON_KEY,
			'content-type': 'application/json',
		},
		body: JSON.stringify({ email, password }),
	})

	if (!r.ok) {
		const body = await r.json().catch(() => ({}))
		const reason =
			body?.error_description ||
			body?.msg ||
			body?.error ||
			`auth_error_${r.status}`
		const query = new URLSearchParams({ error: 'invalid', reason }).toString()
		return {
			statusCode: 302,
			headers: { Location: `/.netlify/functions/teacher-login?${query}` },
			body: '',
		}
	}

	const session = await r.json()
	const role = await getProfileRole(session.user.id)
	if (!['teacher', 'admin'].includes(role)) {
		return {
			statusCode: 302,
			headers: {
				Location: '/.netlify/functions/teacher-login?error=forbidden',
			},
			body: '',
		}
	}

	return {
		statusCode: 302,
		headers: {
			Location: '/.netlify/functions/teacher-submissions',
			'Set-Cookie': authCookie(session.access_token),
		},
		body: '',
	}
}

