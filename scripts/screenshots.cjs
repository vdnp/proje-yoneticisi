// Regenerates the README screenshots from the browser preview, which runs on
// the fictional sample data in src/renderer/src/lib/mockApi.js — never on
// anyone's real projects.
//
//   npm run dev:web          (in one terminal)
//   npm run screenshots      (in another)
//
// Output: docs/screenshots/*.png
const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const BASE = process.env.SHOT_URL || 'http://localhost:5199/'
const OUT = path.join(__dirname, '..', 'docs', 'screenshots')

// A throwaway profile, so the preview always starts from the sample data.
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pm-shots-')))

// Each language gets its own window; closing one must not quit the app
// (Electron's default once the last window is gone).
app.on('window-all-closed', () => {})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function run(win, js) {
  await win.webContents.executeJavaScript(js)
  await wait(700)
}

async function shoot(win, name) {
  const image = await win.webContents.capturePage()
  fs.writeFileSync(path.join(OUT, name), image.toPNG())
  console.log('saved', name)
}

const clickText = (text) =>
  `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)})?.click()`
const openCard = (name) =>
  `[...document.querySelectorAll('div[draggable="true"]')].find(c => c.querySelector('h3')?.textContent === ${JSON.stringify(name)})?.click()`

async function capture(lang) {
  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    useContentSize: true,
    backgroundColor: '#0b0d12',
    webPreferences: { backgroundThrottling: false }
  })
  // The dev server occasionally aborts the very first navigation of a fresh
  // window (ERR_FAILED); a short retry is enough.
  for (let attempt = 1; ; attempt++) {
    try {
      await win.loadURL(`${BASE}?lang=${lang}`)
      break
    } catch (err) {
      if (attempt >= 3) throw err
      await wait(1000)
    }
  }
  await run(win, 'localStorage.clear(); location.reload()')
  await wait(800)

  const suffix = lang === 'en' ? '' : `-${lang}`
  const tasksLabel = lang === 'en' ? 'All tasks' : 'Tüm Görevler'

  await shoot(win, `home${suffix}.png`)

  await run(win, `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))`)
  await shoot(win, `palette${suffix}.png`)
  await run(win, `document.querySelector('[role="dialog"] input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`)

  await run(win, openCard('acme-dashboard'))
  await shoot(win, `detail${suffix}.png`)

  await run(win, clickText(tasksLabel))
  await shoot(win, `tasks${suffix}.png`)

  win.destroy()
}

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  try {
    for (const lang of ['en', 'tr']) await capture(lang)
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
  app.quit()
})
