import { contextBridge, ipcRenderer, webUtils } from 'electron'

// The single surface the renderer is allowed to touch. Mirrored (as a mock)
// in src/renderer/src/lib/mockApi.js for the browser-only preview build.
const api = {
  isElectron: true,
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  getDataPath: () => ipcRenderer.invoke('data:path'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  exportData: (data) => ipcRenderer.invoke('data:export', data),
  importData: () => ipcRenderer.invoke('data:import'),

  selectFolder: (defaultPath) => ipcRenderer.invoke('dialog:selectFolder', defaultPath),
  inspectFolder: (folderPath) => ipcRenderer.invoke('project:inspect', folderPath),
  redetect: (folderPath, tags) => ipcRenderer.invoke('project:redetect', { folderPath, tags }),
  scanRoot: (rootPath) => ipcRenderer.invoke('project:scanRoot', rootPath),
  getScripts: (folderPath) => ipcRenderer.invoke('project:scripts', folderPath),
  runScript: (folderPath, script) => ipcRenderer.invoke('project:runScript', { folderPath, script }),
  getReadme: (folderPath) => ipcRenderer.invoke('project:readme', folderPath),
  checkPaths: (paths) => ipcRenderer.invoke('fs:checkPaths', paths),
  getLastCommit: (folderPath) => ipcRenderer.invoke('git:lastCommit', folderPath),
  getGitStatus: (folderPath) => ipcRenderer.invoke('git:status', folderPath),

  openInEditor: (command, folderPath) =>
    ipcRenderer.invoke('open:editor', { command, folderPath }),
  openInTerminal: (folderPath) => ipcRenderer.invoke('open:terminal', folderPath),
  openInExplorer: (folderPath) => ipcRenderer.invoke('open:explorer', folderPath),
  openExternal: (url) => ipcRenderer.invoke('open:external', url),

  setAutoLaunch: (enabled) => ipcRenderer.invoke('settings:autoLaunch', enabled),
  setMinimizeToTray: (enabled) => ipcRenderer.invoke('settings:minimizeToTray', enabled),
  setGlobalShortcut: (accelerator) => ipcRenderer.invoke('settings:shortcut', accelerator),

  // Custom window controls (frameless title bar)
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximizeToggle: () => ipcRenderer.send('window:maximizeToggle'),
  windowClose: () => ipcRenderer.send('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onWindowMaximize: (cb) => {
    const listener = (_e, val) => cb(val)
    ipcRenderer.on('window:maximized', listener)
    return () => ipcRenderer.removeListener('window:maximized', listener)
  },

  // Drag & drop: Electron 32+ removed File.path, so the real path must be
  // resolved through webUtils.
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file)
    } catch {
      return ''
    }
  },

  // Fired when the tray menu launches a project, so the renderer can record it.
  onProjectOpened: (cb) => {
    const listener = (_e, id) => cb(id)
    ipcRenderer.on('project:opened', listener)
    return () => ipcRenderer.removeListener('project:opened', listener)
  },

  // Fired by the global shortcut so the palette opens even from the tray.
  onOpenPalette: (cb) => {
    const listener = () => cb()
    ipcRenderer.on('palette:open', listener)
    return () => ipcRenderer.removeListener('palette:open', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
