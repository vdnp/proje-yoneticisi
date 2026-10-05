import { useState } from 'react'
import Modal from './Modal.jsx'
import { Check, Trash } from './Icons.jsx'
import { cn } from '../lib/utils.js'
import { GROUP_COLOR_LIST } from '../lib/groups.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

const inputCls =
  'w-full rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-sm text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20'

// `group` = null → create mode; otherwise edit mode.
export default function GroupModal({ group, onClose }) {
  const addGroup = useStore((s) => s.addGroup)
  const updateGroup = useStore((s) => s.updateGroup)
  const removeGroup = useStore((s) => s.removeGroup)
  const { t } = useI18n()

  const [name, setName] = useState(group?.name || '')
  const [color, setColor] = useState(group?.color || 'indigo')

  const save = () => {
    if (!name.trim()) return
    if (group) updateGroup(group.id, { name: name.trim(), color })
    else addGroup(name, color)
    onClose()
  }

  const destroy = () => {
    if (confirm(t('groupModal.confirmDelete', { name: group.name }))) {
      removeGroup(group.id)
      onClose()
    }
  }

  return (
    <Modal title={group ? t('groupModal.editTitle') : t('groupModal.newTitle')} onClose={onClose} width="max-w-sm">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-content-secondary">
            {t('groupModal.name')}
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder={t('groupModal.namePlaceholder')}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-content-secondary">
            {t('groupModal.color')}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {GROUP_COLOR_LIST.map((c) => (
              <button
                key={c.id}
                title={t(`colors.${c.id}`)}
                aria-label={t(`colors.${c.id}`)}
                onClick={() => setColor(c.id)}
                style={{ backgroundColor: c.hex }}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-surface-card transition',
                  color === c.id ? 'ring-content-secondary' : 'ring-transparent hover:ring-surface-border'
                )}
              >
                {color === c.id && <Check size={16} className="text-[#151a23]" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        {group ? (
          <button
            onClick={destroy}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-content-secondary transition hover:bg-surface-hover hover:text-rose-400"
          >
            <Trash size={15} /> {t('common.delete')}
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-content-secondary transition hover:bg-surface-hover"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={save}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-onbrand transition hover:brightness-110"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
