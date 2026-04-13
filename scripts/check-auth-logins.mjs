const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

if (!url || !key) {
	console.log(
		JSON.stringify(
			{ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY' },
			null,
			2,
		),
	)
	process.exit(1)
}

const emails = [
	'dr.mark.oconnor@googlemail.com',
	'drmarkoconnor@googlemail.com',
	'dr_mark_oconnor@googlemail.com',
]

for (const email of emails) {
	const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: {
			apikey: key,
			'content-type': 'application/json',
		},
		body: JSON.stringify({ email, password: 'InkTest2026!' }),
	})
	const j = await r.json().catch(() => ({}))
	console.log(
		JSON.stringify(
			{
				email,
				status: r.status,
				ok: r.ok,
				error: j?.error || j?.msg || j?.error_description || null,
				userId: j?.user?.id || null,
				accessToken: Boolean(j?.access_token),
			},
			null,
			2,
		),
	)
}

