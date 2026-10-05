import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FileText, ChevronDown, ChevronUp } from './Icons.jsx'
import { renderMarkdown } from '../lib/markdown.js'
import { useI18n } from '../lib/i18n.js'
import api from '../lib/api.js'

// The project's README, rendered (Markdown) or shown verbatim (.txt).
// Collapsed to a preview until the user expands it.
export default function ReadmeCard({ path }) {
  const { t } = useI18n()
  const [readme, setReadme] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    let alive = true
    setReadme(null)
    setExpanded(false)
    if (path) api.getReadme(path).then((res) => alive && setReadme(res?.ok ? res : null))
    return () => {
      alive = false
    }
  }, [path])

  const html = useMemo(
    () => (readme?.markdown ? renderMarkdown(readme.content) : null),
    [readme]
  )

  // Only offer "show all" when the preview actually cuts content off.
  useLayoutEffect(() => {
    const el = bodyRef.current
    if (el && !expanded) setOverflowing(el.scrollHeight > el.clientHeight + 4)
  }, [html, readme, expanded])

  if (!readme) return null

  // Links in a README must never navigate the app window: http(s) goes to the
  // browser, everything else (relative paths, anchors) is ignored.
  const onClick = (e) => {
    const link = e.target.closest('a')
    if (!link) return
    e.preventDefault()
    const href = link.getAttribute('href') || ''
    if (/^https?:\/\//i.test(href)) api.openExternal(href)
  }

  return (
    <div className="mt-6 rounded-2xl border border-surface-border bg-surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-content-primary">
          <FileText size={16} /> {readme.name}
        </h3>
        {(overflowing || expanded) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-content-secondary transition hover:text-content-primary"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? t('detail.collapse') : t('detail.showAll')}
          </button>
        )}
      </div>

      <div className="relative">
        <div ref={bodyRef} className={expanded ? '' : 'max-h-80 overflow-hidden'} onClick={onClick}>
          {html !== null ? (
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-content-secondary">
              {readme.content}
            </pre>
          )}
        </div>
        {!expanded && overflowing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-card to-transparent" />
        )}
      </div>

      {readme.truncated && expanded && (
        <p className="mt-3 text-[11px] text-content-faint">{t('detail.readmeTruncated')}</p>
      )}
    </div>
  )
}
