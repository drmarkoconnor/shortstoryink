import { clearWriterAuthCookie } from './_lib/writer-auth.js'

export async function handler() {
	return {
		statusCode: 302,
		headers: {
			Location: '/.netlify/functions/writer-login',
			'Set-Cookie': clearWriterAuthCookie(),
		},
		body: '',
	}
}
