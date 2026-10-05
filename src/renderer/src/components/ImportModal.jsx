import Modal from './Modal.jsx'
import { Layers, RefreshCw } from './Icons.jsx'
import { useI18n } from '../lib/i18n.js'

function Choice({ icon: Icon, title, desc, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={
        'flex w-full items-start gap-3 rounded-xl border border-surface-border p-3.5 text-left transition ' +
        (danger ? 'hover:border-rose-500/50 hover:bg-rose-500/5' : 'hover:border-brand/50 hover:bg-brand/5')
      }
    >
      <Icon size={18} className={danger ? 'mt-0.5 text-rose-400' : 'mt-0.5 text-brand'} />
      <span>
        <span className="block text-sm font-semibold text-content-primary">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-content-secondary">{desc}</span>
      </span>
    </button>
  )
}

// Shown after a backup file has been read: merge it in, or replace everything.
export default function ImportModal({ data, onMerge, onReplace, onClose }) {
  const { t } = useI18n()

  return (
    <Modal title={t('importModal.title')} onClose={onClose} width="max-w-md">
      <p className="mb-4 text-sm text-content-secondary">
        {t('importModal.body', {
          projects: data.projects?.length || 0,
          groups: data.groups?.length || 0
        })}
      </p>
      <div className="space-y-2">
        <Choice icon={Layers} title={t('importModal.merge')} desc={t('importModal.mergeDesc')} onClick={onMerge} />
        <Choice
          icon={RefreshCw}
          title={t('importModal.replace')}
          desc={t('importModal.replaceDesc')}
          onClick={onReplace}
          danger
        />
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm font-medium text-content-secondary transition hover:bg-surface-hover"
        >
          {t('common.cancel')}
        </button>
      </div>
    </Modal>
  )
}
