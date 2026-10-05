import { app, shell, BrowserWindow, ipcMain, dialog, globalShortcut, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { spawn, execFile } from 'child_process'
import { loadData, saveData, getDataFilePath } from './store.js'
import { hydrate } from './schema.js'
import {
  inspectFolder,
  getScripts,
  scanRoot,
  getReadme,
  checkPaths,
  redetect
} from './inspect.js'
import { getLastCommit, getGitStatus } from './git.js'
import { setLanguage, t } from './i18n.js'
import { trayIcon32 } from './trayIcon.js'

let mainWindow = null
let splashWindow = null
let tray = null
let currentShortcut = ''
let minimizeToTray = true // kept in sync with settings; controls close behavior

const ICON_PATH = join(__dirname, '../../build/icon.ico')

// Only ever hand http(s) links to the OS. A project's gitUrl or a link inside
// a README could be any scheme (file:, ms-settings:, a custom protocol...).
function isSafeExternal(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

// ---- Splash screen --------------------------------------------------------

function splashHtml() {
  return `<!doctype html><html><head><meta charset="utf-8" />
<style>
  html,body{margin:0;height:100%;background:transparent;overflow:hidden;
    font-family:'Segoe UI',system-ui,sans-serif;-webkit-user-select:none;cursor:default}
  .card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:20px;background:#12141c;border:1px solid #262b37;border-radius:20px}
  .logo{width:92px;height:92px;animation:pop .5s cubic-bezier(.2,.9,.3,1.2)}
  .title{color:#e8ebf0;font-size:20px;font-weight:600;letter-spacing:.2px}
  .sub{color:#6c7484;font-size:12px}
  .bar{width:190px;height:4px;border-radius:4px;background:#262b37;overflow:hidden}
  .bar>i{display:block;height:100%;width:45%;border-radius:4px;
    background:linear-gradient(90deg,#818cf8,#4f46e5);animation:slide 1.1s ease-in-out infinite}
  @keyframes slide{0%{transform:translateX(-130%)}100%{transform:translateX(320%)}}
  @keyframes pop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}
</style></head><body>
  <div class="card">
    <svg class="logo" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="56" fill="#f4f5f8"/>
      <g stroke="#151a23" stroke-width="8" stroke-linecap="round">
        <line x1="52" y1="34" x2="104" y2="34"/><line x1="152" y1="34" x2="204" y2="34"/>
        <line x1="52" y1="222" x2="104" y2="222"/><line x1="152" y1="222" x2="204" y2="222"/>
        <line x1="34" y1="52" x2="34" y2="104"/><line x1="34" y1="152" x2="34" y2="204"/>
        <line x1="222" y1="52" x2="222" y2="104"/><line x1="222" y1="152" x2="222" y2="204"/>
      </g>
      <g stroke="#151a23" stroke-width="7">
        <rect x="20" y="20" width="28" height="28" rx="7" fill="#e4e7ec"/>
        <rect x="208" y="20" width="28" height="28" rx="7" fill="#e4e7ec"/>
        <rect x="20" y="208" width="28" height="28" rx="7" fill="#e4e7ec"/>
        <rect x="208" y="208" width="28" height="28" rx="7" fill="#e4e7ec"/>
      </g>
      <g stroke="#151a23" stroke-width="6" stroke-linejoin="round">
        <rect x="70" y="70" width="46" height="34" rx="7" fill="#fb7185"/>
        <rect x="124" y="70" width="62" height="34" rx="7" fill="#93c5fd"/>
        <rect x="70" y="112" width="116" height="30" rx="7" fill="#fb923c"/>
        <rect x="70" y="150" width="34" height="36" rx="7" fill="#86efac"/>
        <rect x="111" y="150" width="34" height="36" rx="7" fill="#c4b5fd"/>
        <rect x="152" y="150" width="34" height="36" rx="7" fill="#fde047"/>
      </g>
      <g stroke="#151a23" stroke-width="5" stroke-linecap="round">
        <line x1="80" y1="82" x2="106" y2="82"/><line x1="80" y1="92" x2="100" y2="92"/>
        <line x1="84" y1="121" x2="172" y2="121"/><line x1="84" y1="132" x2="172" y2="132"/>
        <line x1="119" y1="162" x2="137" y2="162"/><line x1="119" y1="172" x2="137" y2="172"/>
      </g>
    </svg>
    <div style="text-align:center;display:flex;flex-direction:column;gap:6px">
      <div class="title">${t('appName')}</div>
      <div class="sub">${t('splashSub')}</div>
    </div>
    <div class="bar"><i></i></div>
  </div>
</body></html>`
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 440,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    show: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  })
  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml()))
  splashWindow.once('ready-to-show', () => splashWindow && splashWindow.show())
}

// ---- Main window ----------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: '#0b0d12',
    autoHideMenuBar: true,
    title: t('appName'),
    icon: existsSync(ICON_PATH) ? ICON_PATH : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // The renderer shows third-party content (README files from any repo),
      // so it runs sandboxed. The preload only needs `electron`, which
      // sandboxed preloads can still require.
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close()
      splashWindow = null
    }
    mainWindow.show()
  })

  // Close button: hide to tray instead of quitting (when enabled).
  mainWindow.on('close', (e) => {
    if (minimizeToTray && !app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  // Keep the custom title bar's maximize/restore icon in sync.
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:maximized', true))
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximized', false))

  // New windows (target=_blank) go to the real browser, never a child window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternal(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  // The app window itself must never navigate away from the app (e.g. a stray
  // link click in a rendered README). Dev-server reloads are still allowed.
  mainWindow.webContents.on('will-navigate', (e, url) => {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl && url.startsWith(devUrl)) return
    e.preventDefault()
    if (isSafeExternal(url)) shell.openExternal(url)
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function showMainWindow() {
  if (!mainWindow) return createWindow()
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

// ---- System tray ----------------------------------------------------------

// Launch a project's editor straight from the tray, and let the renderer
// record the open (lastOpenedAt / openCount) so stats stay accurate.
function openProjectFromTray(project, settings) {
  const command = project.editorCommand || settings.defaultEditor || 'code'
  launchCommand(command, project.path)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('project:opened', project.id)
  }
}

function buildTrayMenu(data) {
  const projects = data.projects || []
  const settings = data.settings || {}

  const toItem = (p) => ({
    label: p.name,
    click: () => openProjectFromTray(p, settings)
  })

  const favorites = projects.filter((p) => p.favorite).slice(0, 8)
  const recents = projects
    .filter((p) => p.lastOpenedAt)
    .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
    .slice(0, 5)

  const template = [{ label: t('appName'), enabled: false }, { type: 'separator' }]

  if (favorites.length) {
    template.push({ label: t('trayFavorites'), submenu: favorites.map(toItem) })
  }
  if (recents.length) {
    template.push({ label: t('trayRecent'), submenu: recents.map(toItem) })
  }
  if (favorites.length || recents.length) {
    template.push({ type: 'separator' })
  }

  template.push(
    { label: t('trayOpen'), click: showMainWindow },
    {
      label: t('trayQuit'),
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  )

  return Menu.buildFromTemplate(template)
}

// Rebuilt whenever the renderer persists data, so the tray always reflects
// the current favorites / recents and language.
function refreshTray(data) {
  if (!tray) return
  tray.setToolTip(t('appName'))
  tray.setContextMenu(buildTrayMenu(data || loadData()))
}

function createTray() {
  tray = new Tray(nativeImage.createFromDataURL(trayIcon32))
  refreshTray()
  tray.on('click', showMainWindow)
  tray.on('double-click', showMainWindow)
}

// ---- Launchers ------------------------------------------------------------

// Spawn a detached process and report whether it started.
function startDetached(cmd, args, options) {
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, { detached: true, stdio: 'ignore', ...options })
      child.on('error', (err) => resolve({ ok: false, error: String(err) }))
      child.on('spawn', () => {
        child.unref()
        resolve({ ok: true })
      })
    } catch (err) {
      resolve({ ok: false, error: String(err) })
    }
  })
}

// Editor CLIs (code, code-insiders, cursor) are .cmd shims on Windows, so they
// need the shell. With shell:true Node joins args unquoted, hence the explicit
// quotes — otherwise a path with a space opens two folders, and one with an
// `&` would run a command. Windows paths can't contain `"`.
async function launchCommand(command, folderPath) {
  if (!command) return { ok: false, error: 'no_command' }
  if (!folderPath || !existsSync(folderPath)) return { ok: false, error: 'not_found' }
  // Through the shell, a missing command still "starts" (cmd prints an error
  // and exits), so check a bare command name exists first. Commands given as
  // a full path or with arguments are left to the shell.
  if (/^[\w.-]+$/.test(command) && !(await commandExists(command))) {
    return { ok: false, error: 'command_not_found' }
  }
  return startDetached(command, [`"${folderPath}"`], { shell: true, windowsHide: true })
}

function commandExists(command) {
  return new Promise((resolve) => {
    execFile('where', [command], { windowsHide: true, timeout: 3000 }, (err) => resolve(!err))
  })
}

// Windows Terminal when it's installed, the classic console otherwise.
async function openTerminal(folderPath) {
  if (!folderPath || !existsSync(folderPath)) return { ok: false, error: 'not_found' }
  // wt treats `;` as a command separator, so it has to be escaped in the path.
  const wt = await startDetached('wt.exe', ['-d', folderPath.replace(/;/g, '\\;')], {})
  if (wt.ok) return wt
  return startDetached('cmd.exe', ['/c', 'start', '', 'cmd.exe', '/k', `cd /d "${folderPath}"`], {})
}

const SAFE_SCRIPT_NAME = /^[\w:.@/+-]+$/
const JS_PMS = new Set(['npm', 'yarn', 'pnpm', 'bun'])

// Run a package.json script in its own visible terminal window, so the user
// can watch output and Ctrl+C it. The script name ends up inside a cmd.exe
// command line, so it must be a script this package.json actually declares
// and contain no shell metacharacters; the package manager is detected here
// rather than trusted from the renderer.
function runScript(folderPath, script) {
  if (!folderPath || !existsSync(folderPath)) return Promise.resolve({ ok: false, error: 'not_found' })
  const pkg = getScripts(folderPath)
  if (!pkg.ok || !Object.prototype.hasOwnProperty.call(pkg.scripts, script)) {
    return Promise.resolve({ ok: false, error: 'unknown_script' })
  }
  if (!SAFE_SCRIPT_NAME.test(script)) return Promise.resolve({ ok: false, error: 'unsafe_script' })

  const pm = JS_PMS.has(pkg.packageManager) ? pkg.packageManager : 'npm'
  // yarn takes the script name directly; npm/pnpm/bun need `run`.
  const cmd = pm === 'yarn' ? `yarn ${script}` : `${pm} run ${script}`
  return startDetached('cmd.exe', ['/c', 'start', '', 'cmd.exe', '/k', `cd /d "${folderPath}" && ${cmd}`], {})
}

// ---- IPC registration -----------------------------------------------------

function registerIpc() {
  ipcMain.handle('data:load', () => loadData())
  ipcMain.handle('data:save', (_e, data) => {
    const res = saveData(data)
    setLanguage(data?.settings?.language)
    refreshTray(data)
    return res
  })
  ipcMain.handle('data:path', () => getDataFilePath())
  ipcMain.handle('app:version', () => app.getVersion())

  ipcMain.handle('data:export', async (_e, data) => {
    const date = new Date().toISOString().slice(0, 10)
    const result = await dialog.showSaveDialog(mainWindow, {
      title: t('exportTitle'),
      defaultPath: `project-manager-backup-${date}.json`,
      filters: [{ name: t('jsonFiles'), extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { ok: false, canceled: true }
    try {
      writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
      return { ok: true, path: result.filePath }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  ipcMain.handle('data:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: t('importTitle'),
      properties: ['openFile'],
      filters: [{ name: t('jsonFiles'), extensions: ['json'] }]
    })
    if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true }
    try {
      const parsed = JSON.parse(readFileSync(result.filePaths[0], 'utf-8'))
      if (!parsed || !Array.isArray(parsed.projects)) return { ok: false, error: 'invalid_backup' }
      // Same normalisation as loading data.json, so a backup from an older
      // version (or a hand-edited one) comes back in the current shape.
      return { ok: true, data: hydrate(parsed) }
    } catch {
      return { ok: false, error: 'invalid_backup' }
    }
  })

  ipcMain.handle('dialog:selectFolder', async (_e, defaultPath) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: t('pickFolder'),
      defaultPath: defaultPath || undefined,
      properties: ['openDirectory']
    })
    if (result.canceled || !result.filePaths.length) return { ok: false }
    return { ok: true, path: result.filePaths[0] }
  })

  ipcMain.handle('project:inspect', (_e, folderPath) => inspectFolder(folderPath))
  ipcMain.handle('project:redetect', (_e, { folderPath, tags }) => redetect(folderPath, tags))
  ipcMain.handle('project:scanRoot', (_e, rootPath) => scanRoot(rootPath))
  ipcMain.handle('project:scripts', (_e, folderPath) => getScripts(folderPath))
  ipcMain.handle('project:runScript', (_e, { folderPath, script }) => runScript(folderPath, script))
  ipcMain.handle('project:readme', (_e, folderPath) => getReadme(folderPath))
  ipcMain.handle('fs:checkPaths', (_e, paths) => checkPaths(paths))

  ipcMain.handle('git:lastCommit', (_e, folderPath) => getLastCommit(folderPath))
  ipcMain.handle('git:status', (_e, folderPath) => getGitStatus(folderPath))

  ipcMain.handle('open:editor', (_e, { command, folderPath }) => launchCommand(command, folderPath))
  ipcMain.handle('open:terminal', (_e, folderPath) => openTerminal(folderPath))

  ipcMain.handle('open:explorer', (_e, folderPath) => {
    if (!folderPath || !existsSync(folderPath)) return { ok: false, error: 'not_found' }
    shell.showItemInFolder(folderPath)
    return { ok: true }
  })

  ipcMain.handle('open:external', async (_e, url) => {
    if (!isSafeExternal(url)) return { ok: false }
    await shell.openExternal(url)
    return { ok: true }
  })

  ipcMain.handle('settings:autoLaunch', (_e, enabled) => {
    try {
      app.setLoginItemSettings({ openAtLogin: !!enabled })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:minimizeToTray', (_e, enabled) => {
    minimizeToTray = !!enabled
    return { ok: true }
  })

  ipcMain.handle('settings:shortcut', (_e, accelerator) => registerGlobalShortcut(accelerator))

  // Custom window controls
  ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize())
  ipcMain.on('window:maximizeToggle', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('window:close', () => mainWindow && mainWindow.close())
  ipcMain.handle('window:isMaximized', () => !!(mainWindow && mainWindow.isMaximized()))
}

function registerGlobalShortcut(accelerator) {
  try {
    if (currentShortcut) {
      globalShortcut.unregister(currentShortcut)
      currentShortcut = ''
    }
    if (!accelerator) return { ok: true }
    // The global shortcut surfaces the window AND opens the command palette,
    // so it works as a launcher even while the app is hidden in the tray.
    const ok = globalShortcut.register(accelerator, () => {
      showMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('palette:open')
      }
    })
    if (ok) currentShortcut = accelerator
    return { ok }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

// ---- App lifecycle --------------------------------------------------------

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', showMainWindow)

  app.whenReady().then(() => {
    let settings = {}
    try {
      settings = loadData().settings || {}
    } catch {
      /* fall back to defaults */
    }
    // Language first: the splash, tray and window title read it.
    setLanguage(settings.language)

    registerIpc()
    createSplash()
    createWindow()
    createTray()

    // Restore persisted OS-affecting settings.
    try {
      minimizeToTray = settings.minimizeToTray !== false
      if (settings.globalShortcut) registerGlobalShortcut(settings.globalShortcut)
      app.setLoginItemSettings({ openAtLogin: !!settings.autoLaunch })
    } catch {
      /* ignore */
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // With tray + minimize-to-tray, the app stays alive after the window closes.
  app.on('window-all-closed', () => {
    if (!minimizeToTray && process.platform !== 'darwin') app.quit()
  })

  app.on('before-quit', () => {
    app.isQuitting = true
  })

  app.on('will-quit', () => globalShortcut.unregisterAll())
}
