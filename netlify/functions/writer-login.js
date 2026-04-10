import {
	ensureWriterProfile,
	html,
	renderWriterPage,
	writerAuthCookie,
} from './_lib/writer-auth.js'

const SUPABASE_URL =
	process.env.SUPABASE_URL ||
	(process.env.SUPABASE_PROJECT_ID
		? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
		: null)

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

function resolveSiteUrl(event) {
	const forwardedProto = event?.headers?.['x-forwarded-proto']
	const forwardedHost = event?.headers?.['x-forwarded-host']
	const host = forwardedHost || event?.headers?.host

	if (host) {
		const proto =
			forwardedProto || (host.includes('localhost') ? 'http' : 'https')
		return `${proto}://${host}`
	}

	return (
		process.env.URL ||
		process.env.DEPLOY_PRIME_URL ||
		process.env.DEPLOY_URL ||
		'http://localhost:8888'
	)
}

function redirectWithMessage(kind, message) {
	const safeMessage = encodeURIComponent(message)
	return {
		statusCode: 302,
		headers: {
			Location: `/.netlify/functions/writer-login?${kind}=${safeMessage}`,
		},
		body: '',
	}
}

function esc(s = '') {
	return String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

async function passwordSignIn(email, password) {
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
		throw new Error(
			body?.error_description || body?.msg || body?.error || 'invalid_login',
		)
	}
	return r.json()
}

async function passwordSignUp(email, password, firstName, emailRedirectTo) {
	const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
		method: 'POST',
		headers: {
			apikey: SUPABASE_ANON_KEY,
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			email,
			password,
			data: { display_name: firstName || null },
			email_redirect_to: emailRedirectTo,
		}),
	})
	if (!r.ok) {
		const body = await r.json().catch(() => ({}))
		throw new Error(
			body?.msg || body?.error_description || body?.error || 'signup_failed',
		)
	}
	return r.json()
}

async function requestPasswordReset(email, emailRedirectTo) {
	const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
		method: 'POST',
		headers: {
			apikey: SUPABASE_ANON_KEY,
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			email,
			redirect_to: emailRedirectTo,
		}),
	})

	if (!r.ok) {
		const body = await r.json().catch(() => ({}))
		throw new Error(
			body?.msg ||
				body?.error_description ||
				body?.error ||
				'reset_request_failed',
		)
	}
}

async function resetPasswordWithRecoveryToken(accessToken, nextPassword) {
	const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
		method: 'PUT',
		headers: {
			apikey: SUPABASE_ANON_KEY,
			Authorization: `Bearer ${accessToken}`,
			'content-type': 'application/json',
		},
		body: JSON.stringify({ password: nextPassword }),
	})

	if (!r.ok) {
		const body = await r.json().catch(() => ({}))
		throw new Error(
			body?.msg ||
				body?.error_description ||
				body?.error ||
				'reset_complete_failed',
		)
	}
}

function page(error = '', ok = '', warn = '') {
	return renderWriterPage({
		title: 'Writer auth',
		heading: 'Writer sign in',
		maxWidth: '760px',
		nav: [{ href: '/', label: 'Home' }],
		content: `
			<p class="ww-muted">Sign in with email/password for now. Social login (Google/GitHub) can be added later as a second pass.</p>
			${ok ? `<p class="ww-msg ww-msg--ok">${esc(ok)}</p>` : ''}
			${warn ? `<p class="ww-msg ww-msg--warn">${esc(warn)}</p>` : ''}
			${error ? `<p class="ww-msg ww-msg--err">${esc(error)}</p>` : ''}
			<div class="grid">
				<form class="ww-panel" method="post" action="/.netlify/functions/writer-login">
					<input type="hidden" name="mode" value="login" />
					<h2 style="margin:.1rem 0 .35rem;font:600 20px/1.2 Georgia,serif">Sign in</h2>
					<label>Email</label>
					<input type="email" name="email" autocomplete="email" required />
					<label>Password</label>
					<input type="password" name="password" autocomplete="current-password" required />
					<button type="submit">Sign in</button>
					<p class="ww-muted" style="margin:.55rem 0 0;font-size:13px;">Forgot password? Use the reset panel.</p>
				</form>
				<form class="ww-panel" method="post" action="/.netlify/functions/writer-login">
					<input type="hidden" name="mode" value="signup" />
					<h2 style="margin:.1rem 0 .35rem;font:600 20px/1.2 Georgia,serif">Create account</h2>
					<label>First name (optional)</label>
					<input type="text" name="firstName" autocomplete="given-name" />
					<label>Email</label>
					<input type="email" name="email" autocomplete="email" required />
					<label>Password</label>
					<input type="password" name="password" autocomplete="new-password" minlength="8" required />
					<button type="submit">Create account</button>
				</form>
				<form class="ww-panel" method="post" action="/.netlify/functions/writer-login">
					<input type="hidden" name="mode" value="reset-request" />
					<h2 style="margin:.1rem 0 .35rem;font:600 20px/1.2 Georgia,serif">Reset password</h2>
					<label>Email</label>
					<input type="email" name="email" autocomplete="email" required />
					<button type="submit">Send reset email</button>
					<p class="ww-muted" style="margin:.55rem 0 0;font-size:13px;">You can test with one inbox by resetting the same account repeatedly.</p>
				</form>
			</div>

			<section id="recovery-panel" class="ww-panel" style="display:none;margin-top:1rem;">
				<h2 style="margin:.1rem 0 .35rem;font:600 20px/1.2 Georgia,serif">Set a new password</h2>
				<p class="ww-muted" style="margin-top:0;">We detected a password recovery link. Set your new password below.</p>
				<form method="post" action="/.netlify/functions/writer-login">
					<input type="hidden" name="mode" value="reset-complete" />
					<input type="hidden" name="accessToken" id="recovery-access-token" value="" />
					<label>New password</label>
					<input type="password" name="resetPassword" autocomplete="new-password" minlength="8" required />
					<label>Confirm new password</label>
					<input type="password" name="resetPasswordConfirm" autocomplete="new-password" minlength="8" required />
					<button type="submit">Update password</button>
				</form>
			</section>

			<script>
				(function () {
					const hash = window.location.hash || ''
					if (!hash.startsWith('#')) return
					const qp = new URLSearchParams(hash.slice(1))
					const type = qp.get('type')
					const accessToken = qp.get('access_token')
					if (type !== 'recovery' || !accessToken) return

					const panel = document.getElementById('recovery-panel')
					const tokenInput = document.getElementById('recovery-access-token')
					if (!panel || !tokenInput) return

					tokenInput.value = accessToken
					panel.style.display = 'block'
					window.history.replaceState({}, '', '/.netlify/functions/writer-login?ok=' + encodeURIComponent('Recovery link accepted. Set your new password below.'))
				})()
			</script>
		`,
	})
}

export async function handler(event) {
	if (event.httpMethod === 'GET') {
		const error = event.queryStringParameters?.error || ''
		const ok = event.queryStringParameters?.ok || ''
		const warn = event.queryStringParameters?.warn || ''
		return html(200, page(error, ok, warn))
	}

	if (event.httpMethod !== 'POST') return html(405, '<p>Method not allowed</p>')

	const params = new URLSearchParams(event.body || '')
	const mode = (params.get('mode') || 'login').trim()
	const email = (params.get('email') || '').trim().toLowerCase()
	const password = params.get('password') || ''
	const firstName = (params.get('firstName') || '').trim()
	const emailRedirectTo = `${resolveSiteUrl(event)}/.netlify/functions/writer-login?ok=Email+confirmed.+You+can+sign+in+now.`
	const resetRedirectTo = `${resolveSiteUrl(event)}/.netlify/functions/writer-login`

	try {
		if (mode === 'reset-request') {
			if (!email) {
				return redirectWithMessage(
					'error',
					'Please enter your account email to reset password.',
				)
			}
			try {
				await requestPasswordReset(email, resetRedirectTo)
				return redirectWithMessage(
					'ok',
					'If that email exists, a password reset link has been sent.',
				)
			} catch (resetErr) {
				const msg = String(resetErr?.message || '')
				if (/over_email_send_rate_limit|rate limit/i.test(msg)) {
					return redirectWithMessage(
						'warn',
						'Too many reset emails were requested recently. Please wait a few minutes and try again.',
					)
				}
				if (/redirect|allow list|not allowed/i.test(msg)) {
					return redirectWithMessage(
						'error',
						'Reset link configuration needs updating. Please add this URL to Supabase Auth redirect allow-list.',
					)
				}
				return redirectWithMessage(
					'error',
					'Could not send reset email right now. Please try again shortly.',
				)
			}
		}

		if (mode === 'reset-complete') {
			const accessToken = (params.get('accessToken') || '').trim()
			const resetPassword = params.get('resetPassword') || ''
			const resetPasswordConfirm = params.get('resetPasswordConfirm') || ''

			if (!accessToken) {
				return redirectWithMessage(
					'error',
					'Recovery token missing. Please use the reset link from your email again.',
				)
			}
			if (!resetPassword || resetPassword.length < 8) {
				return redirectWithMessage(
					'error',
					'Password must be at least 8 characters.',
				)
			}
			if (resetPassword !== resetPasswordConfirm) {
				return redirectWithMessage('error', 'Passwords do not match.')
			}

			await resetPasswordWithRecoveryToken(accessToken, resetPassword)
			return redirectWithMessage('ok', 'Password updated. You can sign in now.')
		}

		if (!email || !password) {
			return redirectWithMessage('error', 'Missing email or password')
		}

		let session
		if (mode === 'signup') {
			const signUp = await passwordSignUp(
				email,
				password,
				firstName,
				emailRedirectTo,
			)
			session = signUp?.session || null

			if (!session) {
				try {
					session = await passwordSignIn(email, password)
				} catch (signinAfterSignupErr) {
					const msg = String(signinAfterSignupErr?.message || '')
					if (/confirm|not confirmed/i.test(msg)) {
						return redirectWithMessage(
							'warn',
							'Account created. Please confirm your email before signing in.',
						)
					}
					return redirectWithMessage(
						'error',
						'Account created, but sign in failed. Please try signing in again.',
					)
				}
			}
		} else {
			session = await passwordSignIn(email, password)
		}

		await ensureWriterProfile(session.user)
		return {
			statusCode: 302,
			headers: {
				Location: '/.netlify/functions/writer-dashboard',
				'Set-Cookie': writerAuthCookie(session.access_token),
			},
			body: '',
		}
	} catch (err) {
		const msg = String(err?.message || '')
		if (/confirm|not confirmed/i.test(msg)) {
			return redirectWithMessage(
				'warn',
				'Please confirm your email before signing in.',
			)
		}
		if (/already registered|already exists/i.test(msg)) {
			return redirectWithMessage(
				'warn',
				'That email already has an account. Try signing in instead.',
			)
		}
		if (/invalid login credentials/i.test(msg)) {
			return redirectWithMessage('error', 'Invalid email or password.')
		}
		if (/over_email_send_rate_limit|rate limit/i.test(msg)) {
			return redirectWithMessage(
				'warn',
				'Too many requests in a short time. Please wait a few minutes and try again.',
			)
		}
		return redirectWithMessage(
			'error',
			'Request failed. Please check your details and try again.',
		)
	}
}

