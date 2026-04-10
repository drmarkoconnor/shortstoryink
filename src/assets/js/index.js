// Phase 2: intentionally minimal.

// Workshop submission editor (progressive enhancement)
import './submission-editor.js'

// /try/ submission gate + local API submit (progressive enhancement)
;(function () {
	var form = document.querySelector('.ss-try__form')
	if (!form) return

	var draft = document.getElementById('try-draft')
	var gate = form.querySelector('[data-try-gate]')
	var success = form.querySelector('[data-try-success]')
	var openGate = form.querySelector('[data-try-submit]')
	var keepWriting = form.querySelector('[data-try-keepwriting]')
	var err = form.querySelector('[data-try-drafterror]')
	var email =
		document.getElementById('try-email') ||
		form.querySelector('input[name="email"]')
	var firstName = form.querySelector('input[name="firstName"]')
	var finalSubmit = form.querySelector('[data-try-finalsubmit]')
	var another = form.querySelector('[data-try-another]')

	if (!draft || !gate || !openGate || !keepWriting) return

	function draftHasText() {
		return (draft.value || '').trim().length >= 10
	}

	function showError(message) {
		if (!err) return
		err.textContent =
			message || 'Add a few lines first — even a paragraph is enough.'
		err.hidden = false
	}

	function hideError() {
		if (!err) return
		err.hidden = true
		err.textContent = ''
	}

	function showGate() {
		gate.hidden = false
		keepWriting.hidden = false
		if (typeof gate.scrollIntoView === 'function') {
			gate.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
		}
		if (email) email.focus()
	}

	function hideGate() {
		gate.hidden = true
		keepWriting.hidden = true
		hideError()
		draft.focus()
	}

	function showSuccess() {
		if (!success) return
		success.hidden = false
		gate.hidden = true
		keepWriting.hidden = true
		if (typeof success.scrollIntoView === 'function') {
			success.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
		}
	}

	function hideSuccess() {
		if (!success) return
		success.hidden = true
	}

	openGate.addEventListener('click', function () {
		hideError()
		if (!draftHasText()) {
			showError('Add a few lines first — even a paragraph is enough.')
			draft.focus()
			return
		}
		showGate()
	})

	keepWriting.addEventListener('click', hideGate)

	form.addEventListener('submit', async function (e) {
		e.preventDefault()

		// Only handle final gate submit.
		var submitter = e.submitter
		if (!submitter || !submitter.matches('[data-try-finalsubmit]')) return

		hideError()

		if (!draftHasText()) {
			showError('Add a few lines first — even a paragraph is enough.')
			draft.focus()
			return
		}

		// Native email validation
		if (!form.reportValidity()) return

		if (finalSubmit) finalSubmit.disabled = true

		try {
			var response = await fetch('/.netlify/functions/try-submit', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					draft: (draft.value || '').trim(),
					email: (email && email.value ? email.value : '').trim(),
					firstName: (firstName && firstName.value
						? firstName.value
						: ''
					).trim(),
				}),
			})

			var data = await response.json().catch(function () {
				return {}
			})

			if (!response.ok || !data.ok) {
				throw new Error(data.error || 'Submission failed')
			}

			showSuccess()
		} catch (_) {
			showError('Could not submit right now. Please try again.')
		} finally {
			if (finalSubmit) finalSubmit.disabled = false
		}
	})

	if (another) {
		another.addEventListener('click', function () {
			form.reset()
			hideSuccess()
			hideGate()
		})
	}
})()

// If the module executes, we can mark the page as JS-capable.
document.documentElement.dataset.ssJs = 'on'

