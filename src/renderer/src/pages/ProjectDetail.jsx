import { useEffect, useState } from 'react'
import TodoList from '../components/TodoList.jsx'
import TagBadge from '../components/TagBadge.jsx'
import PackageManagerBadge from '../components/PackageManagerBadge.jsx'
import ReadmeCard from '../components/ReadmeCard.jsx'
import {
  ArrowLeft,
  Star,
  Pin,
  Code,
  Folder,
  Github,
  Trash,
  Clock,
  Edit,
  Check,
  Play,
  Terminal,
  GitBranch,
  RefreshCw,
  AlertTriangle
} from '../components/Icons.jsx'
import { cn, relativeTime, formatDate, samePath } from '../lib/utils.js'
import { GROUP_COLOR_LIST } from '../lib/groups.js'
import { useProjectActions } from '../lib/useProjectActions.js'
import { useGitStatus } from '../lib/useGitStatus.js'
import { useI18n, errorText } from '../lib/i18n.js'
import api from '../lib/api.js'
import useStore from '../store/useStore.js'

const inputCls =
  'w-full rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-sm text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20'

function ActionBtn({ icon: Icon, label, onClick, disabled, tone = 'default' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
        tone === 'primary'
          ? 'border-transparent bg-brand text-onbrand hover:brightness-110'
          : 'border-surface-border bg-surface-card text-content-primary hover:border-brand/40 hover:bg-surface-hover',
        disabled && 'cursor-not-allowed opacity-40 hover:border-surface-border hover:bg-surface-card'
      )}
    >
      <Icon size={16} /> {label}
    </button>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-bg px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-content-faint">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-content-primary">{value}</div>
    </div>
  )
}

// Repository link + git status + last commit.
function RepoCard({ project, onOpenGithub }) {
  const { t } = useI18n()
  const status = useGitStatus(project.path)
  const [commit, setCommit] = useState(undefined) // undefined = loading, null = none

  useEffect(() => {
    let alive = true
    setCommit(undefined)
    if (project.path) api.getLastCommit(project.path).then((c) => alive && setCommit(c))
    else setCommit(null)
    return () => {
      alive = false
    }
  }, [project.path])

  const dirty = status ? status.changed + status.untracked : 0

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-content-primary">
        <Github size={16} /> {t('detail.repository')}
      </h3>
      {project.gitUrl ? (
        <button onClick={onOpenGithub} className="break-all text-left text-sm text-brand hover:underline">
          {project.gitUrl}
        </button>
      ) : (
        <p className="text-sm text-content-faint">{t('detail.noRemote')}</p>
      )}

      <div className="mt-3 space-y-1.5 border-t border-surface-border pt-3 text-xs">
        {status === undefined ? (
          <p className="text-content-faint">{t('git.loading')}</p>
        ) : status === null ? (
          <p className="text-content-faint">{t('git.notRepo')}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1 font-medium text-content-primary">
                <GitBranch size={13} /> {status.branch || t('git.detached')}
              </span>
              <span className="text-content-faint">
                {status.upstream ? `→ ${status.upstream}` : t('git.noUpstream')}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {dirty === 0 && !status.ahead && !status.behind && (
                <span className="text-emerald-400">{t('git.clean')}</span>
              )}
              {status.changed > 0 && (
                <span className="text-amber-400">{t('git.changes', { count: status.changed })}</span>
              )}
              {status.untracked > 0 && (
                <span className="text-amber-400">{t('git.untracked', { count: status.untracked })}</span>
              )}
              {status.ahead > 0 && (
                <span className="text-sky-400">↑ {t('git.ahead', { count: status.ahead })}</span>
              )}
              {status.behind > 0 && (
                <span className="text-rose-400">↓ {t('git.behind', { count: status.behind })}</span>
              )}
            </div>
          </>
        )}

        {status !== null && (
          <div className="flex items-center gap-2 pt-1 text-content-secondary">
            <Clock size={13} className="shrink-0" />
            {commit === undefined ? (
              <span className="text-content-faint">{t('common.loading')}</span>
            ) : commit === null ? (
              <span className="text-content-faint">{t('git.noCommit')}</span>
            ) : (
              <span className="truncate" title={`${commit.subject} · ${commit.author}`}>
                <span className="font-mono text-content-primary">{commit.hash}</span> · {commit.subject} ·{' '}
                {commit.author}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectDetail({ projectId, onBack }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const projects = useStore((s) => s.projects)
  const groups = useStore((s) => s.groups)
  const settings = useStore((s) => s.settings)
  const missing = useStore((s) => !!(project && s.missing[project.path]))
  const updateProject = useStore((s) => s.updateProject)
  const removeProject = useStore((s) => s.removeProject)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const togglePin = useStore((s) => s.togglePin)
  const setProjectGroup = useStore((s) => s.setProjectGroup)
  const checkMissing = useStore((s) => s.checkMissing)
  const actions = useProjectActions()
  const { t, lang } = useI18n()

  const [editMeta, setEditMeta] = useState(false)
  const [scripts, setScripts] = useState({}) // package.json scripts, read live
  const [scriptPm, setScriptPm] = useState('')
  const [ranScript, setRanScript] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let alive = true
    setScripts({})
    setScriptPm('')
    if (project?.path) {
      api.getScripts(project.path).then((res) => {
        if (!alive || !res?.ok) return
        setScripts(res.scripts || {})
        setScriptPm(res.packageManager || '')
      })
    }
    return () => {
      alive = false
    }
  }, [project?.path])

  const flash = (text) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 2500)
  }

  if (!project) {
    return <div className="grid h-full place-items-center text-content-faint">{t('detail.notFound')}</div>
  }

  const editors = settings.editors || []

  const runScript = async (name) => {
    const res = await api.runScript(project.path, name)
    if (res?.ok) {
      setRanScript(name)
      setTimeout(() => setRanScript(''), 2500)
    } else {
      alert(`${t('detail.scriptFailed')}\n${errorText(t, res?.error)}`)
    }
  }

  const confirmRemove = () => {
    if (confirm(t('detail.confirmRemove', { name: project.name }))) {
      removeProject(project.id)
      onBack()
    }
  }

  const redetectTags = async () => {
    const res = await api.redetect(project.path, project.tags)
    if (!res?.ok) return alert(errorText(t, res?.error))
    updateProject(project.id, res.data)
    flash(t('detail.redetected'))
  }

  // Point a project at its new folder after a move; notes, todos and stats
  // are kept, detection is refreshed for the new location.
  const relocate = async () => {
    const res = await api.selectFolder(settings.defaultRoot || '')
    if (!res.ok) return
    if (projects.some((p) => p.id !== project.id && samePath(p.path, res.path))) {
      return alert(t('addModal.alreadyAdded'))
    }
    const [detected, inspected] = await Promise.all([
      api.redetect(res.path, project.tags),
      api.inspectFolder(res.path)
    ])
    updateProject(project.id, {
      path: res.path,
      ...(detected.ok ? detected.data : {}),
      gitUrl: project.gitUrl || (inspected.ok ? inspected.data.gitUrl : ''),
      lastModified: inspected.ok ? inspected.data.lastModified : project.lastModified
    })
    await checkMissing()
    flash(t('detail.relocated'))
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-surface-border bg-surface-bg/90 px-6 py-3 backdrop-blur">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-content-secondary transition hover:bg-surface-hover hover:text-content-primary"
        >
          <ArrowLeft size={16} /> {t('common.back')}
        </button>
        {notice && (
          <span className="animate-fadein text-xs font-medium text-emerald-400" role="status">
            {notice}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => togglePin(project.id)}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl border border-surface-border transition hover:bg-surface-hover',
              project.pinned ? 'text-brand' : 'text-content-faint'
            )}
            title={project.pinned ? t('card.unpin') : t('card.pin')}
            aria-label={project.pinned ? t('card.unpin') : t('card.pin')}
          >
            <Pin size={18} fill={project.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => toggleFavorite(project.id)}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl border border-surface-border transition hover:bg-surface-hover',
              project.favorite ? 'text-amber-400' : 'text-content-faint'
            )}
            title={project.favorite ? t('card.unfavorite') : t('card.favorite')}
            aria-label={project.favorite ? t('card.unfavorite') : t('card.favorite')}
          >
            <Star size={18} fill={project.favorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={confirmRemove}
            className="grid h-9 w-9 place-items-center rounded-xl border border-surface-border text-content-faint transition hover:border-rose-500/40 hover:text-rose-400"
            title={t('detail.removeFromList')}
            aria-label={t('detail.removeFromList')}
          >
            <Trash size={18} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-6">
        {missing && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <AlertTriangle size={20} className="shrink-0 text-rose-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-content-primary">{t('detail.missingTitle')}</div>
              <div className="break-all text-xs text-content-secondary">
                {t('detail.missingBody', { path: project.path })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={relocate}
                className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-onbrand transition hover:brightness-110"
              >
                {t('detail.relocate')}
              </button>
              <button
                onClick={confirmRemove}
                className="rounded-xl border border-surface-border px-3 py-2 text-sm font-medium text-content-secondary transition hover:bg-surface-hover"
              >
                {t('detail.removeFromList')}
              </button>
            </div>
          </div>
        )}

        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editMeta ? (
              <input
                value={project.name}
                onChange={(e) => updateProject(project.id, { name: e.target.value })}
                className={inputCls + ' text-lg font-bold'}
              />
            ) : (
              <h1 className="truncate text-2xl font-bold text-content-primary">{project.name}</h1>
            )}
            <p className="mt-1 break-all text-xs text-content-faint">{project.path || '—'}</p>
          </div>
          <button
            onClick={() => setEditMeta((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-sm text-content-secondary transition hover:bg-surface-hover"
          >
            {editMeta ? <Check size={15} /> : <Edit size={15} />}
            {editMeta ? t('common.done') : t('common.edit')}
          </button>
        </div>

        {/* editable meta */}
        {editMeta ? (
          <div className="mt-4 space-y-3">
            <textarea
              value={project.description}
              onChange={(e) => updateProject(project.id, { description: e.target.value })}
              rows={2}
              placeholder={t('detail.descriptionPlaceholder')}
              className={inputCls + ' resize-none'}
            />
            <input
              value={project.gitUrl}
              onChange={(e) => updateProject(project.id, { gitUrl: e.target.value })}
              placeholder={t('detail.remotePlaceholder')}
              className={inputCls}
            />
            <input
              value={(project.tags || []).join(', ')}
              onChange={(e) =>
                updateProject(project.id, {
                  tags: e.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                })
              }
              placeholder={t('detail.tagsPlaceholder')}
              className={inputCls}
            />
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-content-secondary">
              {project.description || t('detail.noDescription')}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <PackageManagerBadge pm={project.packageManager} tags={project.tags} />
              {(project.tags || []).map((tag) => (
                <TagBadge key={tag} label={tag} />
              ))}
              {!missing && (
                <button
                  onClick={redetectTags}
                  title={t('detail.redetect')}
                  aria-label={t('detail.redetect')}
                  className="grid h-6 w-6 place-items-center rounded-md text-content-faint transition hover:bg-surface-hover hover:text-content-primary"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>
          </>
        )}

        {/* actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <ActionBtn
            icon={Code}
            label={t('detail.actions.openEditor')}
            tone="primary"
            onClick={() => actions.openInEditor(project)}
          />
          <ActionBtn
            icon={Terminal}
            label={t('detail.actions.openTerminal')}
            onClick={() => actions.openInTerminal(project)}
          />
          <ActionBtn
            icon={Folder}
            label={t('detail.actions.showFolder')}
            onClick={() => actions.openInExplorer(project)}
          />
          <ActionBtn
            icon={Github}
            label={t('detail.actions.openGithub')}
            disabled={!project.gitUrl}
            onClick={() => actions.openGithub(project)}
          />
        </div>

        {/* per-project editor + group + color */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-content-secondary">{t('detail.editor')}:</span>
            <select
              value={project.editorCommand || ''}
              onChange={(e) => updateProject(project.id, { editorCommand: e.target.value })}
              className="rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-sm text-content-primary focus:outline-none"
            >
              <option value="">{t('detail.defaultEditor', { name: settings.defaultEditor })}</option>
              {editors.map((ed) => (
                <option key={ed.id} value={ed.command}>
                  {ed.label} ({ed.command})
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-content-secondary">{t('detail.group')}:</span>
            <select
              value={project.groupId || ''}
              onChange={(e) => setProjectGroup(project.id, e.target.value || null)}
              className="rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-sm text-content-primary focus:outline-none"
            >
              <option value="">{t('detail.noGroup')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-content-secondary">{t('detail.color')}:</span>
            <div className="flex items-center gap-1.5">
              <button
                title={t('detail.useGroupColor')}
                aria-label={t('detail.useGroupColor')}
                onClick={() => updateProject(project.id, { color: '' })}
                className={cn(
                  'grid h-6 w-6 place-items-center rounded-full border border-surface-border text-[10px] text-content-faint transition',
                  !project.color && 'ring-2 ring-content-secondary ring-offset-2 ring-offset-surface-bg'
                )}
              >
                —
              </button>
              {GROUP_COLOR_LIST.map((c) => (
                <button
                  key={c.id}
                  title={t(`colors.${c.id}`)}
                  aria-label={t(`colors.${c.id}`)}
                  onClick={() => updateProject(project.id, { color: c.id })}
                  style={{ backgroundColor: c.hex }}
                  className={cn(
                    'h-6 w-6 rounded-full transition',
                    project.color === c.id && 'ring-2 ring-content-secondary ring-offset-2 ring-offset-surface-bg'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox
            label={t('detail.stats.lastOpened')}
            value={relativeTime(project.lastOpenedAt, lang, t('common.never'))}
          />
          <StatBox label={t('detail.stats.openCount')} value={project.openCount || 0} />
          <StatBox
            label={t('detail.stats.lastModified')}
            value={relativeTime(project.lastModified, lang, t('common.never'))}
          />
          <StatBox label={t('detail.stats.added')} value={formatDate(project.createdAt, lang)} />
        </div>

        {/* repo / notes */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <RepoCard project={project} onOpenGithub={() => actions.openGithub(project)} />

          <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-content-primary">{t('detail.notes')}</h3>
            <textarea
              value={project.notes || ''}
              onChange={(e) => updateProject(project.id, { notes: e.target.value })}
              rows={5}
              placeholder={t('detail.notesPlaceholder')}
              className={inputCls + ' resize-y'}
            />
          </div>
        </div>

        {/* package.json scripts */}
        {Object.keys(scripts).length > 0 && (
          <div className="mt-6 rounded-2xl border border-surface-border bg-surface-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-content-primary">
                <Terminal size={16} /> {t('detail.scripts')}
              </h3>
              <PackageManagerBadge pm={scriptPm || project.packageManager} />
            </div>

            <div className="flex flex-col gap-1.5">
              {Object.entries(scripts).map(([name, cmd]) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-bg px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-content-primary">{name}</span>
                    <span className="block truncate font-mono text-[11px] text-content-faint">{cmd}</span>
                  </span>
                  <button
                    onClick={() => runScript(name)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                      ranScript === name
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-surface-hover text-content-secondary hover:bg-brand hover:text-onbrand'
                    )}
                  >
                    {ranScript === name ? (
                      <>
                        <Check size={13} /> {t('detail.started')}
                      </>
                    ) : (
                      <>
                        <Play size={13} /> {t('detail.run')}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-2 text-[11px] text-content-faint">{t('detail.scriptsHint')}</p>
          </div>
        )}

        {/* todos */}
        <div className="mt-6 rounded-2xl border border-surface-border bg-surface-card p-4">
          <TodoList project={project} />
        </div>

        {/* README */}
        {!missing && <ReadmeCard path={project.path} />}
      </div>
    </div>
  )
}
