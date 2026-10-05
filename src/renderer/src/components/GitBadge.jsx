import { GitBranch } from './Icons.jsx'
import { useGitStatus } from '../lib/useGitStatus.js'
import { useI18n } from '../lib/i18n.js'

// Compact branch + changes chip for cards and rows. Renders nothing while
// loading or for folders that aren't git repositories.
export default function GitBadge({ path }) {
  const status = useGitStatus(path)
  const { t } = useI18n()
  if (!status) return null

  const dirty = status.changed + status.untracked
  const branch = status.branch || t('git.detached')
  const details = [
    `${t('git.branch')}: ${branch}`,
    status.changed ? t('git.changes', { count: status.changed }) : null,
    status.untracked ? t('git.untracked', { count: status.untracked }) : null,
    status.ahead ? t('git.ahead', { count: status.ahead }) : null,
    status.behind ? t('git.behind', { count: status.behind }) : null,
    !dirty && !status.ahead && !status.behind ? t('git.clean') : null
  ].filter(Boolean)

  return (
    <span className="inline-flex min-w-0 items-center gap-1" title={details.join('\n')}>
      <GitBranch size={13} className="shrink-0" />
      <span className="max-w-[96px] truncate">{branch}</span>
      {dirty > 0 && <span className="shrink-0 font-medium text-amber-400">●{dirty}</span>}
      {status.ahead > 0 && <span className="shrink-0 text-sky-400">↑{status.ahead}</span>}
      {status.behind > 0 && <span className="shrink-0 text-rose-400">↓{status.behind}</span>}
    </span>
  )
}
