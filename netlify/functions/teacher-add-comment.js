import { json, requireTeacher, sbInsert } from './_lib/teacher-auth.js'

export async function handler(event) {
	if (event.httpMethod !== 'POST') return json(405, { ok: false })

	const auth = await requireTeacher(event)
	if (auth.error) return auth.error

	try {
		const body = JSON.parse(event.body || '{}')
		const submissionId = body.submissionId
		const submissionVersionId = body.submissionVersionId
		const paragraphId = body.paragraphId
		const commentBody = String(body.body || '').trim()
		const visibility = body.visibility === 'private' ? 'private' : 'writer'

		if (!submissionId || !submissionVersionId || !paragraphId || !commentBody) {
			return json(400, { ok: false, error: 'Missing required fields' })
		}

		const row = await sbInsert('comments', {
			submission_id: submissionId,
			submission_version_id: submissionVersionId,
			paragraph_id: paragraphId,
			author_id: auth.user.id,
			body: commentBody,
			visibility,
			status: 'open',
		})

		return json(200, { ok: true, comment: row })
	} catch (e) {
		return json(500, { ok: false, error: e.message })
	}
}
