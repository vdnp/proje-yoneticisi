import { marked } from 'marked'
import DOMPurify from 'dompurify'

// READMEs come from whatever repo the user cloned, so their HTML is untrusted:
// everything goes through DOMPurify before it touches the DOM. (The page CSP
// already blocks inline scripts; this is the second layer.)

// Relative image paths can't load inside the app; strip their src so the
// browser doesn't show broken-image icons (CSS hides src-less images).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src') || ''
    if (!/^(https:|data:image\/)/i.test(src)) node.removeAttribute('src')
    node.setAttribute('loading', 'lazy')
  }
})

export function renderMarkdown(text) {
  const html = marked.parse(text || '', { gfm: true, async: false })
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe'],
    FORBID_ATTR: ['style']
  })
}
