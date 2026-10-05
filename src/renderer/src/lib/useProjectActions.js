import api from './api.js'
import { useI18n, errorText } from './i18n.js'
import useStore from '../store/useStore.js'

// Centralizes the "quick actions". Each successful open bumps the project's
// lastOpenedAt / openCount via markOpened.
export function useProjectActions() {
  const markOpened = useStore((s) => s.markOpened)
  const checkMissing = useStore((s) => s.checkMissing)
  const settings = useStore((s) => s.settings)
  const { t } = useI18n()

  const resolveEditorCommand = (project) =>
    project.editorCommand || settings.defaultEditor || 'code'

  // A 'not_found' result means the folder vanished since the last check:
  // re-check so the card flips to its "folder not found" state.
  const reportFailure = (project, res, fallback) => {
    if (res?.error === 'not_found') {
      checkMissing()
      alert(t('actions.missing', { path: project.path }))
    } else {
      alert(fallback)
    }
  }

  const needsPath = (project) => {
    if (project.path) return true
    alert(t('actions.noPath'))
    return false
  }

  return {
    openInEditor: async (project) => {
      if (!needsPath(project)) return
      const command = resolveEditorCommand(project)
      const res = await api.openInEditor(command, project.path)
      if (res?.ok) return markOpened(project.id)
      if (res?.error === 'command_not_found') return alert(t('actions.commandNotFound', { command }))
      reportFailure(project, res, t('actions.editorFailed', { command }))
    },
    openInTerminal: async (project) => {
      if (!needsPath(project)) return
      const res = await api.openInTerminal(project.path)
      if (res?.ok) return markOpened(project.id)
      reportFailure(project, res, t('actions.terminalFailed'))
    },
    openInExplorer: async (project) => {
      if (!needsPath(project)) return
      const res = await api.openInExplorer(project.path)
      if (res?.ok) return markOpened(project.id)
      reportFailure(project, res, errorText(t, res?.error))
    },
    openGithub: async (project) => {
      if (!project.gitUrl) return alert(t('actions.noGithub'))
      await api.openExternal(project.gitUrl)
      markOpened(project.id)
    }
  }
}
