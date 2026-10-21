import api from './api.js'
import { useI18n, errorText } from './i18n.js'
import useStore from '../store/useStore.js'
import { showAlert } from './dialogs.js'
import { launchPlan } from '../../../shared/links.js'

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
      showAlert(t('actions.missing', { path: project.path }))
    } else {
      showAlert(fallback)
    }
  }

  const needsPath = (project) => {
    if (project.path) return true
    showAlert(t('actions.noPath'))
    return false
  }

  return {
    openInEditor: async (project) => {
      if (!needsPath(project)) return
      const command = resolveEditorCommand(project)
      const res = await api.openInEditor(command, project.path)
      if (res?.ok) return markOpened(project.id)
      if (res?.error === 'command_not_found') return showAlert(t('actions.commandNotFound', { command }))
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
    // Open the project and its linked projects, each in its own editor, and
    // start their dev scripts. One summary alert lists whatever failed.
    launch: async (project) => {
      const plan = launchPlan(project, useStore.getState().projects, settings.defaultEditor)
      if (!plan.length) return showAlert(t('actions.noPath'))
      const results = (await api.launch(plan)) || []
      const problems = []
      for (const r of results) {
        const step = plan.find((s) => s.id === r.id)
        if (r.ok) markOpened(r.id)
        else if (r.error === 'command_not_found') {
          problems.push(`${r.name}: ${t('actions.commandNotFound', { command: step?.command })}`)
        } else problems.push(`${r.name}: ${errorText(t, r.error)}`)
        if (r.scriptError) {
          const failed = t('actions.scriptFailed', { script: step?.script })
          problems.push(`${r.name}: ${failed} ${errorText(t, r.scriptError)}`)
        }
      }
      if (results.some((r) => r.error === 'not_found')) checkMissing()
      if (problems.length) showAlert(`${t('actions.launchProblems')}\n\n${problems.join('\n')}`)
    },
    openGithub: async (project) => {
      if (!project.gitUrl) return showAlert(t('actions.noGithub'))
      await api.openExternal(project.gitUrl)
      markOpened(project.id)
    }
  }
}
