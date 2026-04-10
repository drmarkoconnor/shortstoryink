import { clearAuthCookie } from './_lib/teacher-auth.js'

export async function handler() {
	return {
		statusCode: 302,
		headers: {
			Location: '/.netlify/functions/teacher-login',
			'Set-Cookie': clearAuthCookie(),
		},
		body: '',
	}
}

