const SUPABASE_URL =
	process.env.SUPABASE_URL ||
	(process.env.SUPABASE_PROJECT_ID
		? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
		: null)

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const COOKIE_NAME = 'ss_teacher_access'

function parseCookies(raw = '') {
	return Object.fromEntries(
		raw
			.split(';')
			.map((p) => p.trim())
			.filter(Boolean)
			.map((p) => {
				const i = p.indexOf('=')
				return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]
			}),
	)
}

export function json(statusCode, body, headers = {}) {
	return {
		statusCode,
		headers: { 'content-type': 'application/json', ...headers },
		body: JSON.stringify(body),
	}
}

export function html(statusCode, body, headers = {}) {
	return {
		statusCode,
		headers: { 'content-type': 'text/html; charset=utf-8', ...headers },
		body,
	}
}

export function escHtml(s = '') {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

export function renderTeacherPage({
	title,
	heading,
	nav = [],
	content,
	maxWidth = '980px',
	extraStyles = '',
}) {
	const navHtml = nav.length
		? `<nav class="tt-nav" aria-label="Teacher navigation">${nav
				.map((item) => `<a href="${item.href}">${escHtml(item.label)}</a>`)
				.join('')}</nav>`
		: ''

	return `<!doctype html>
	<html>
	<head>
		<meta charset="utf-8"/>
		<title>${escHtml(title || 'Teacher')}</title>
		<style>
			body{max-width:${maxWidth};margin:36px auto;padding:0 20px;color:#111;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fff}
			h1{margin:0 0 .4rem 0;font:600 30px/1.18 Georgia,serif;letter-spacing:.01em}
			p{margin:.45rem 0}
			a{color:#0f172a}
			.tt-nav{display:flex;flex-wrap:wrap;gap:.65rem;margin:.45rem 0 1rem 0;font:14px/1.4 system-ui,sans-serif}
			.tt-nav a{text-decoration:none;border-bottom:1px solid #cbd5e1}
			.tt-panel{margin:1rem 0 0;padding:.95rem 1rem;border:1px solid #e5e7eb;border-radius:10px;background:#fcfcfc}
			.tt-muted{color:#6b7280}
			.tt-msg{padding:.6rem .75rem;border-radius:8px;margin:.8rem 0 1rem;font:14px/1.4 system-ui,sans-serif}
			.tt-msg--ok{background:#edf7ed;color:#1f5130}
			.tt-msg--warn{background:#fff7ed;color:#7c2d12}
			.tt-msg--err{background:#fdecec;color:#7a1f1f}
			label{display:block;margin:.45rem 0 .25rem;font:600 13px/1.2 system-ui,sans-serif}
			input,textarea{width:100%;max-width:100%;padding:.55rem .6rem;border:1px solid #d1d5db;border-radius:8px;background:#fff;font:15px/1.4 system-ui,sans-serif}
			button{margin-top:.65rem;padding:.48rem .8rem;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font:14px/1.35 system-ui,sans-serif;cursor:pointer}
			${extraStyles || ''}
		</style>
	</head>
	<body>
		<h1>${escHtml(heading || title || 'Teacher')}</h1>
		${navHtml}
		${content}
	</body>
	</html>`
}

export function authCookie(token) {
	const secure = process.env.CONTEXT === 'production' ? '; Secure' : ''
	return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`
}

export function clearAuthCookie() {
	return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function extractAccessToken(event) {
	const auth = event.headers.authorization || event.headers.Authorization
	if (auth?.startsWith('Bearer ')) return auth.slice(7)
	const cookies = parseCookies(event.headers.cookie || '')
	return cookies[COOKIE_NAME] || null
}

export async function getAuthUser(accessToken) {
	const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
		headers: {
			apikey: SUPABASE_ANON_KEY,
			Authorization: `Bearer ${accessToken}`,
		},
	})
	if (!r.ok) return null
	return r.json()
}

export async function getProfileRole(userId) {
	const r = await fetch(
		`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role&limit=1`,
		{
			headers: {
				apikey: SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
			},
		},
	)
	if (!r.ok) return null
	const rows = await r.json()
	return rows?.[0]?.role || null
}

export async function requireTeacher(event) {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
		return {
			error: json(500, { ok: false, error: 'Missing Supabase env vars' }),
		}
	}

	const token = extractAccessToken(event)
	if (!token)
		return { error: json(401, { ok: false, error: 'Not authenticated' }) }

	const user = await getAuthUser(token)
	if (!user?.id)
		return { error: json(401, { ok: false, error: 'Invalid session' }) }

	const role = await getProfileRole(user.id)
	if (!['teacher', 'admin'].includes(role)) {
		return { error: json(403, { ok: false, error: 'Teacher role required' }) }
	}

	return { user, role, token }
}

export async function sbInsert(table, payload) {
	const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
		method: 'POST',
		headers: {
			apikey: SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
			'content-type': 'application/json',
			Prefer: 'return=representation',
		},
		body: JSON.stringify(payload),
	})
	if (!r.ok) throw new Error(await r.text())
	const rows = await r.json()
	return rows[0]
}

