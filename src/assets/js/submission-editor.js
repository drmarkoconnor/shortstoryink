/*
  Short Story Ink — Submission Editor (v1)
  Progressive enhancement for Workshop submissions:
  - Paste normalization (keep paragraphs + italics)
  - Legacy .doc upload extraction (basic text)
  - 500-word limit
  - Minimal formatting actions (italic, scene break, no-indent)

  Notes:
  - This is intentionally modest. It’s a bridge to Phase 3 “addressable blocks”.
  - We avoid heavy rich-text editors for now.
*/

function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n))
}

function getWordCountFromText(text) {
	const words = text.trim().split(/\s+/g).filter(Boolean)
	return words.length
}

function getPlainTextFromEditor(editor) {
	return (editor.innerText || '').replace(/\u00A0/g, ' ')
}

function getWordLimit(root) {
	return Number(root.getAttribute('data-word-limit') || '500')
}

function getWords(text) {
	return text.trim().split(/\s+/g).filter(Boolean)
}

function remainingWordCapacity(root) {
	const editor = root.querySelector('[data-ss-editor]')
	if (!editor) return 0
	const limit = getWordLimit(root)
	const current = getWords(getPlainTextFromEditor(editor)).length
	return clamp(limit - current, 0, limit)
}

function updateWordCount(root) {
	const editor = root.querySelector('[data-ss-editor]')
	const counter = root.querySelector('[data-ss-wordcount]')
	const limit = getWordLimit(root)
	if (!editor || !counter) return

	const wc = getWordCountFromText(getPlainTextFromEditor(editor))
	counter.textContent = String(wc)

	// Soft UI hint
	counter
		.closest('.ss-submitteditor__meta')
		?.classList.toggle('is-over', wc > limit)
}

function normalizePastedHtmlToEditorHtml(html) {
	// Strategy: strip most tags; keep paragraphs and italics.
	// Convert <div> to <p>. Convert double <br> boundaries into paragraphs.
	// Collapse everything else to plain text.

	const parser = new DOMParser()
	const doc = parser.parseFromString(html, 'text/html')

	// Remove noise elements
	doc
		.querySelectorAll('style, meta, link, script, xml')
		.forEach((n) => n.remove())

	// Convert div to p
	doc.querySelectorAll('div').forEach((div) => {
		const p = doc.createElement('p')
		p.innerHTML = div.innerHTML
		div.replaceWith(p)
	})

	// Convert <br><br> to paragraph boundaries by walking containers.
	// We'll do a quick pass: in each paragraph-like container, replace consecutive BR with \n\n.
	doc.querySelectorAll('p, body').forEach((el) => {
		const html2 = el.innerHTML
			.replace(/<br\s*\/?>(\s*<br\s*\/?>(\s*)?)+/gi, '</p><p>')
			.replace(/<br\s*\/?>(\s*)?/gi, ' ')
		el.innerHTML = html2
	})

	// Remove all tags except p/em/i/strong/b
	const allowed = new Set(['P', 'EM', 'I', 'STRONG', 'B'])

	const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
	const toUnwrap = []
	while (walker.nextNode()) {
		const el = walker.currentNode
		if (!allowed.has(el.tagName)) toUnwrap.push(el)
	}

	for (const el of toUnwrap) {
		// Replace element with its children (unwrap)
		const parent = el.parentNode
		if (!parent) continue
		while (el.firstChild) parent.insertBefore(el.firstChild, el)
		parent.removeChild(el)
	}

	// Ensure we have paragraphs
	const ps = Array.from(doc.body.querySelectorAll('p'))
	if (ps.length === 0) {
		const text = (doc.body.textContent || '').trim()
		return text ? `<p>${escapeHtml(text)}</p>` : ''
	}

	// Clean empty paragraphs
	const parts = ps
		.map((p) => p.innerHTML.replace(/&nbsp;/g, ' ').trim())
		.filter((s) => s.length > 0)
		.map((inner) => `<p>${inner}</p>`)

	return parts.join('\n')
}

function escapeHtml(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

function trimEditorToWordLimit(root) {
	const editor = root.querySelector('[data-ss-editor]')
	const limit = getWordLimit(root)
	if (!editor) return

	const text = getPlainTextFromEditor(editor)
	const words = text.trim().split(/\s+/g).filter(Boolean)
	if (words.length <= limit) return

	const keep = words.slice(0, limit).join(' ')
	// We lose formatting when hard-trimming, but it’s a reasonable v1 backstop.
	// The more correct Phase 3 approach is block-by-block trimming.
	editor.innerHTML = `<p class="ss-noindent">${escapeHtml(keep)}</p>`
}

async function extractTextFromDoc(_file) {
	// Important: This site ships unbundled ES modules.
	// Node-focused packages like `word-extractor` can't be imported in the browser
	// without a bundler (Vite/Webpack/Rollup).
	//
	// For now, we *gracefully* disable legacy .doc extraction in-browser.
	// (We can re-enable later using a browser-capable parser or a server-side convert step.)
	throw new Error(
		"Legacy .doc import isn't available yet in this browser build. Paste text instead (or use .docx when supported).",
	)
}

function setEditorFromPlainText(editor, text) {
	const paras = text
		.split(/\n{2,}/g)
		.map((p) => p.replace(/\s+/g, ' ').trim())
		.filter(Boolean)

	// Basic heuristics:
	// - First paragraph: no-indent
	// - Scene breaks: lines that are exactly ## or ***
	const blocks = paras.map((p, idx) => {
		if (/^(##|\*\*\*|\* \* \*)$/.test(p)) {
			return `<p class="ss-scene-break">##</p>`
		}

		const klass = idx === 0 ? 'ss-noindent' : ''
		return `<p${klass ? ` class="${klass}"` : ''}>${escapeHtml(p)}</p>`
	})

	editor.innerHTML = blocks.length
		? blocks.join('\n')
		: `<p class="ss-noindent"></p>`
}

function insertSceneBreak(editor) {
	document.execCommand('insertHTML', false, '<p class="ss-scene-break">##</p>')
}

function toggleNoIndentAtSelection(editor) {
	// Find closest <p> ancestor for current selection
	const sel = window.getSelection()
	if (!sel || sel.rangeCount === 0) return
	let node = sel.anchorNode
	if (!node) return
	if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
	const p = node?.closest?.('p')
	if (!p || !editor.contains(p)) return
	p.classList.toggle('ss-noindent')
}

function wireEditor(root) {
	const editor = root.querySelector('[data-ss-editor]')
	const fileInput = root.querySelector('.ss-submitteditor__file')
	const mode = (root.getAttribute('data-ss-mode') || 'workshop').toLowerCase()
	const isFreewrite = mode === 'freewrite'
	const statusText = root.querySelector('[data-ss-status-text]')
	if (!editor) return

	function setStatus(text) {
		if (statusText) statusText.textContent = text
	}

	function failStatus(err) {
		console.error(err)
		const msg = err instanceof Error ? err.message : String(err)
		setStatus(`error — ${msg}`)
	}

	// Some environments can disable execCommand; if so, we still allow typing/paste.
	const canExec = typeof document.execCommand === 'function'

	// Freewrite: deliberately plain. No upload and we strip formatting from paste.
	if (isFreewrite) {
		root
			.querySelectorAll('[data-ss-cmd], [data-ss-action]')
			.forEach((el) => el.remove())
		root
			.querySelectorAll('.ss-submitteditor__file')
			.forEach((el) => el.remove())
	}

	updateWordCount(root)
	setStatus(isFreewrite ? 'ready (freewrite)' : 'ready (workshop)')

	editor.addEventListener('input', () => {
		trimEditorToWordLimit(root)
		updateWordCount(root)
	})

	editor.addEventListener('paste', (e) => {
		const html = e.clipboardData?.getData('text/html')
		const text = e.clipboardData?.getData('text/plain')

		if (isFreewrite) {
			// Always paste plain text (no italics / no paragraph classes).
			if (text) {
				e.preventDefault()
				document.execCommand('insertText', false, text)
			}

			setTimeout(() => {
				trimEditorToWordLimit(root)
				updateWordCount(root)
			}, 0)
			return
		}

		// If we have HTML, preserve italics and paragraphs.
		if (html) {
			e.preventDefault()
			const normalized = normalizePastedHtmlToEditorHtml(html)
			if (normalized) {
				// Cap paste by remaining word capacity (best-effort: convert to plain text if necessary)
				const cap = remainingWordCapacity(root)
				if (cap <= 0) return

				const asText = normalized
					.replace(/<\/?p[^>]*>/gi, '\n')
					.replace(/<br\s*\/?>(\s*)?/gi, '\n')
					.replace(/<[^>]+>/g, ' ')

				const clipped = getWords(asText).slice(0, cap).join(' ')
				// Insert as HTML paragraph to keep the editor structure stable.
				document.execCommand(
					'insertHTML',
					false,
					`<p>${escapeHtml(clipped)}</p>`,
				)
			}
			trimEditorToWordLimit(root)
			updateWordCount(root)
			return
		}

		// Otherwise, insert plain text (browser will create a paragraph inside the editor)
		if (text) {
			// Let it happen, then trim.
			setTimeout(() => {
				trimEditorToWordLimit(root)
				updateWordCount(root)
			}, 0)
		}
	})

	if (canExec) {
		root.querySelectorAll('[data-ss-cmd]').forEach((btn) => {
			btn.addEventListener('click', () => {
				try {
					const cmd = btn.getAttribute('data-ss-cmd')
					if (!cmd) return
					document.execCommand(cmd, false)
					editor.focus()
					updateWordCount(root)
				} catch (err) {
					failStatus(err)
				}
			})
		})
	} else {
		// Hide controls if commands aren't supported.
		root.querySelectorAll('[data-ss-cmd]').forEach((el) => el.remove())
	}

	root.querySelectorAll('[data-ss-action]').forEach((btn) => {
		btn.addEventListener('click', () => {
			try {
				const action = btn.getAttribute('data-ss-action')
				if (action === 'sceneBreak') insertSceneBreak(editor)
				if (action === 'noIndent') toggleNoIndentAtSelection(editor)
				editor.focus()
				updateWordCount(root)
			} catch (err) {
				failStatus(err)
			}
		})
	})

	fileInput?.addEventListener('change', async () => {
		const file = fileInput.files?.[0]
		if (!file) return

		try {
			setStatus(`importing ${file.name}…`)
			const text = await extractTextFromDoc(file)
			// Enforce limit at import time.
			const limit = getWordLimit(root)
			const clipped = getWords(text).slice(0, limit).join(' ')
			setEditorFromPlainText(editor, clipped)
			trimEditorToWordLimit(root)
			updateWordCount(root)
			setStatus(`imported ${file.name}`)
		} catch (err) {
			failStatus(err)
			alert('Couldn’t read that .doc file. Try copy/paste instead.')
		} finally {
			fileInput.value = ''
		}
	})
}

function initSubmissionEditors() {
	// Mark that the editor module loaded.
	document.documentElement.dataset.ssEditor = 'on'
	document
		.querySelectorAll('[data-ss-submission-editor]')
		.forEach((root) => wireEditor(root))
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initSubmissionEditors)
} else {
	initSubmissionEditors()
}

