const SUPABASE_URL =
	process.env.SUPABASE_URL ||
	(process.env.SUPABASE_PROJECT_ID
		? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
		: null)

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(statusCode, body) {
	return {
		statusCode,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	}
}

function splitParagraphs(text) {
	return text
		.split(/\n\s*\n/g)
		.map((p) => p.trim())
		.filter(Boolean)
}

function wordCount(text) {
	return text.trim().split(/\s+/).filter(Boolean).length
}

async function supabaseRest(path, { method = 'GET', body } = {}) {
	const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		method,
		headers: {
			apikey: SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
			'Content-Type': 'application/json',
			Prefer: 'return=representation',
		},
		body: body ? JSON.stringify(body) : undefined,
	})

	if (!res.ok) {
		const text = await res.text()
		throw new Error(`Supabase error (${res.status}): ${text}`)
	}

	return res.json()
}

export async function handler(event) {
	if (event.httpMethod !== 'POST') {
		return json(405, { ok: false, error: 'Method not allowed' })
	}

	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		return json(500, { ok: false, error: 'Missing Supabase env vars' })
	}

	try {
		const payload = JSON.parse(event.body || '{}')
		const draft = String(payload.draft || '').trim()
		const email = String(payload.email || '')
			.trim()
			.toLowerCase()
		const firstName = String(payload.firstName || '').trim() || null

		if (draft.length < 10) {
			return json(400, { ok: false, error: 'Draft is too short' })
		}

		if (!EMAIL_RE.test(email)) {
			return json(400, { ok: false, error: 'Valid email required' })
		}

		const now = new Date().toISOString()
		const paragraphs = splitParagraphs(draft)
		const wc = wordCount(draft)

		// 1) submission
		const [submission] = await supabaseRest('submissions?select=id', {
			method: 'POST',
			body: {
				writer_email: email,
				writer_first_name: firstName,
				status: 'submitted',
				submitted_at: now,
			},
		})

		// 2) version
		const [version] = await supabaseRest(
			'submission_versions?select=id,submission_id',
			{
				method: 'POST',
				body: {
					submission_id: submission.id,
					version_number: 1,
					body: draft,
					word_count: wc,
				},
			},
		)

		// 3) point submission -> latest version
		await supabaseRest(`submissions?id=eq.${submission.id}`, {
			method: 'PATCH',
			body: { latest_version_id: version.id },
		})

		// 4) paragraph anchors
		const paragraphRows = paragraphs.map((text, idx) => ({
			submission_version_id: version.id,
			pid: `p${idx + 1}`,
			position: idx + 1,
			text,
		}))

		if (paragraphRows.length > 0) {
			await supabaseRest('submission_paragraphs?select=id', {
				method: 'POST',
				body: paragraphRows,
			})
		}

		return json(200, {
			ok: true,
			submissionId: submission.id,
			versionId: version.id,
		})
	} catch (err) {
		return json(500, { ok: false, error: err.message })
	}
}

