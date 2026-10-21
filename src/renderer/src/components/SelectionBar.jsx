import { useState } from 'react'
import { Star, Pin, Tag, Link, Trash, X, Layers } from './Icons.jsx'
import { cn } from '../lib/utils.js'
import { useI18n } from '../lib/i18n.js'
import { groupColorHex } from '../lib/groups.js'
import Select from './Select.jsx'
import useStore from '../store/useStore.js'

function BarButton({ icon: Icon, label, onClick, tone = 'default', disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
        tone === 'danger'
          ? 'text-content-secondary hover:bg-rose-500/15 hover:text-rose-400'
          : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-content-secondary'
      )}
    >
      <Icon size={14} /> {label}
    </button>
  )
}

// Bottom bar shown while projects are selected (Ctrl/Shift+click, Ctrl+A).
export default function SelectionBar({ ids, onClear }) {
  const projects = useStore((s) => s.projects)
  const groups = useStore((s) => s.groups)
  const updateProjects = useStore((s) => s.updateProjects)
  const addTag = useStore((s) => s.addTag)
  const linkProjects = useStore((s) => s.linkProjects)
  const removeProjects = useStore((s) => s.removeProjects)
  const { t } = useI18n()
  const [tagging, setTagging] = useState(false)
  const [tag, setTag] = useState('')
  const [notice, setNotice] = useState('')

  const selected = projects.filter((p) => ids.includes(p.id))
  const allFavorite = selected.length > 0 && selected.every((p) => p.favorite)
  const allPinned = selected.length > 0 && selected.every((p) => p.pinned)

  const flash = (text) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 2000)
  }

  const submitTag = () => {
    if (!tag.trim()) return
    addTag(ids, tag)
    flash(t('selection.tagged', { tag: tag.trim() }))
    setTag('')
    setTagging(false)
  }

  // No confirm: the undo toast can bring them back.
  const remove = () => {
    removeProjects(ids)
    onClear()
  }

  return (
    <div className="flex animate-fadein flex-wrap items-center gap-1 border-t border-surface-border bg-surface-card px-4 py-2">
      <span className="mr-2 text-xs font-semibold text-content-primary">
        {t('selection.count', { count: ids.length })}
      </span>

      <BarButton
        icon={Star}
        label={allFavorite ? t('selection.unfavorite') : t('selection.favorite')}
        onClick={() => updateProjects(ids, { favorite: !allFavorite })}
      />
      <BarButton
        icon={Pin}
        label={allPinned ? t('selection.unpin') : t('selection.pin')}
        onClick={() => updateProjects(ids, { pinned: !allPinned })}
      />

      <Select
        size="xs"
        value=""
        icon={Layers}
        placeholder={t('selection.moveToGroup')}
        label={t('selection.moveToGroup')}
        onChange={(v) => {
          updateProjects(ids, { groupId: v === '-' ? null : v })
          flash(t('selection.moved'))
        }}
        options={[
          ...groups.map((g) => ({ value: g.id, label: g.name, dot: groupColorHex(g.color) })),
          { value: '-', label: t('detail.noGroup') }
        ]}
        className="mx-1"
      />

      {tagging ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitTag()
          }}
          className="flex items-center gap-1"
        >
          <input
            autoFocus
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                setTagging(false)
              }
            }}
            placeholder={t('selection.tagPlaceholder')}
            className="w-32 rounded-md border border-surface-border bg-surface-bg px-2 py-1 text-xs text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-onbrand">
            {t('common.add')}
          </button>
        </form>
      ) : (
        <BarButton icon={Tag} label={t('selection.addTag')} onClick={() => setTagging(true)} />
      )}

      <BarButton
        icon={Link}
        label={t('selection.link')}
        disabled={ids.length < 2}
        onClick={() => {
          linkProjects(ids)
          flash(t('selection.linked'))
        }}
      />
      <BarButton icon={Trash} label={t('selection.remove')} tone="danger" onClick={remove} />

      {notice && (
        <span className="ml-2 animate-fadein text-xs font-medium text-emerald-400" role="status">
          {notice}
        </span>
      )}

      <button
        onClick={onClear}
        title={t('selection.clear')}
        aria-label={t('selection.clear')}
        className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-content-faint transition hover:bg-surface-hover hover:text-content-primary"
      >
        <X size={15} />
      </button>
    </div>
  )
}
