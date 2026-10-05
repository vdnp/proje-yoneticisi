// Browser-only fallback backend. Used when window.api is missing (i.e. the
// `dev:web` / `build:web` preview that runs the renderer in a plain browser).
// Persists to localStorage so the preview behaves like the real app.
// All sample data below is fictional.

const now = Date.now()
const day = 86400000
const hour = 3600000

// `?lang=tr` / `?lang=en` picks the sample data language (handy for
// screenshots); otherwise it follows the browser.
const urlLang = (() => {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    return q === 'tr' || q === 'en' ? q : null
  } catch {
    return null
  }
})()
const lang = urlLang || ((navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en')
const L = (tr, en) => (lang === 'tr' ? tr : en)
const todos = (prefix, items) => items.map(([text, done], i) => ({ id: `${prefix}${i}`, text, done }))

const SAMPLE = {
  version: 3,
  projects: [
    {
      id: 'p1',
      name: 'acme-dashboard',
      description: L(
        'Müşteri paneli: gerçek zamanlı satış grafikleri ve rol tabanlı erişim.',
        'Customer dashboard with live sales charts and role-based access.'
      ),
      path: 'C:\\Projects\\acme-dashboard',
      gitUrl: 'https://github.com/example/acme-dashboard',
      tags: ['TypeScript', 'React', 'Vite', 'Tailwind'],
      languages: ['TypeScript'],
      frameworks: ['React', 'Vite', 'Tailwind'],
      packageManager: 'pnpm',
      favorite: true,
      pinned: true,
      groupId: 'g1',
      color: '',
      editorCommand: '',
      notes: L('Sürüm öncesi: grafik önbelleğini kontrol et.', 'Before release: double-check chart caching.'),
      todos: todos('a', [
        [L('Oturum zaman aşımını düzelt', 'Fix session timeout'), true],
        [L('CSV dışa aktarma', 'CSV export'), true],
        [L('Karanlık tema grafik renkleri', 'Dark theme chart colors'), false],
        [L('E2E testlerini CI’ya ekle', 'Add E2E tests to CI'), false]
      ]),
      lastModified: now - day,
      lastOpenedAt: now - hour * 3,
      openCount: 42,
      createdAt: now - day * 60
    },
    {
      id: 'p2',
      name: 'inventory-api',
      description: L(
        'Depo stok takibi için REST API, PostgreSQL ile.',
        'REST API for warehouse stock tracking, backed by PostgreSQL.'
      ),
      path: 'C:\\Projects\\inventory-api',
      gitUrl: 'https://github.com/example/inventory-api',
      tags: ['Go', 'Gin', 'Docker'],
      languages: ['Go'],
      frameworks: ['Gin', 'Docker'],
      packageManager: 'go',
      favorite: false,
      pinned: true,
      groupId: 'g1',
      color: '',
      editorCommand: '',
      notes: '',
      todos: todos('b', [
        [L('Sayfalama parametrelerini doğrula', 'Validate pagination params'), false],
        [L('Rate limit middleware', 'Rate limit middleware'), false]
      ]),
      lastModified: now - day * 2,
      lastOpenedAt: now - day,
      openCount: 18,
      createdAt: now - day * 45
    },
    {
      id: 'p3',
      name: 'weather-cli',
      description: L(
        'Terminalde hava durumu: renkli çıktı, çevrimdışı önbellek.',
        'Weather in your terminal: colored output and an offline cache.'
      ),
      path: 'C:\\Projects\\weather-cli',
      gitUrl: 'https://github.com/example/weather-cli',
      tags: ['Rust', 'CLI'],
      languages: ['Rust'],
      frameworks: [],
      packageManager: 'cargo',
      favorite: true,
      pinned: false,
      groupId: 'g2',
      color: '',
      editorCommand: '',
      notes: '',
      todos: todos('c', [[L('Saatlik tahmin görünümü', 'Hourly forecast view'), true]]),
      lastModified: now - day * 5,
      lastOpenedAt: now - day * 3,
      openCount: 9,
      createdAt: now - day * 30
    },
    {
      id: 'p4',
      name: 'portfolio-site',
      description: L('Kişisel portfolyo ve blog.', 'Personal portfolio and blog.'),
      path: 'C:\\Projects\\portfolio-site',
      gitUrl: 'https://github.com/example/portfolio-site',
      tags: ['TypeScript', 'Astro', 'Tailwind'],
      languages: ['TypeScript'],
      frameworks: ['Astro', 'Tailwind'],
      packageManager: 'npm',
      favorite: false,
      pinned: false,
      groupId: 'g2',
      color: '',
      editorCommand: '',
      notes: '',
      todos: todos('d', [
        [L('Yeni blog yazısı: monorepo düzeni', 'New post: monorepo layout'), false],
        [L('Görselleri AVIF’e çevir', 'Convert images to AVIF'), true]
      ]),
      lastModified: now - day * 3,
      lastOpenedAt: now - day * 2,
      openCount: 12,
      createdAt: now - day * 90
    },
    {
      id: 'p5',
      name: 'ml-experiments',
      description: L(
        'Görüntü sınıflandırma denemeleri ve not defterleri.',
        'Image classification experiments and notebooks.'
      ),
      path: 'C:\\Projects\\ml-experiments',
      gitUrl: '',
      tags: ['Python', 'Jupyter', 'PyTorch'],
      languages: ['Python', 'Jupyter'],
      frameworks: ['PyTorch'],
      packageManager: 'poetry',
      favorite: false,
      pinned: false,
      groupId: null,
      color: '',
      editorCommand: '',
      notes: '',
      todos: [],
      lastModified: now - day * 9,
      lastOpenedAt: null,
      openCount: 0,
      createdAt: now - day * 9
    },
    {
      id: 'p6',
      name: 'pixel-quest',
      description: L('2D platform oyunu, game jam projesi.', '2D platformer from a game jam.'),
      path: 'C:\\Projects\\pixel-quest',
      gitUrl: 'https://github.com/example/pixel-quest',
      tags: ['C#', 'Unity'],
      languages: ['C#'],
      frameworks: ['Unity'],
      packageManager: '',
      favorite: false,
      pinned: false,
      groupId: 'g3',
      color: '',
      editorCommand: '',
      notes: '',
      todos: todos('f', [
        [L('Boss savaşı animasyonları', 'Boss fight animations'), false],
        [L('Ses seviyesi ayarı', 'Volume settings'), false],
        [L('Kaydetme sistemi', 'Save system'), true]
      ]),
      lastModified: now - day * 4,
      lastOpenedAt: now - day * 4,
      openCount: 6,
      createdAt: now - day * 20
    }
  ],
  groups: [
    { id: 'g1', name: L('İş', 'Work'), color: 'indigo' },
    { id: 'g2', name: L('Kişisel', 'Personal'), color: 'emerald' },
    { id: 'g3', name: 'Freelance', color: 'amber' }
  ],
  settings: {
    theme: 'dark',
    language: urlLang || 'auto',
    accent: 'indigo',
    minimizeToTray: true,
    defaultEditor: 'code-insiders',
    editors: [
      { id: 'code-insiders', label: 'VS Code Insiders', command: 'code-insiders' },
      { id: 'code', label: 'VS Code', command: 'code' },
      { id: 'cursor', label: 'Cursor', command: 'cursor' }
    ],
    defaultRoot: 'C:\\Projects',
    autoLaunch: false,
    globalShortcut: 'CommandOrControl+Shift+P',
    viewMode: 'grid'
  }
}

// Deterministic fake git status per sample project.
const GIT = {
  'acme-dashboard': { branch: 'main', upstream: 'origin/main', ahead: 1, behind: 0, changed: 3, untracked: 0 },
  'inventory-api': { branch: 'develop', upstream: 'origin/develop', ahead: 0, behind: 2, changed: 0, untracked: 0 },
  'weather-cli': { branch: 'main', upstream: 'origin/main', ahead: 0, behind: 0, changed: 0, untracked: 0 },
  'portfolio-site': { branch: 'main', upstream: 'origin/main', ahead: 0, behind: 0, changed: 0, untracked: 1 },
  'pixel-quest': { branch: 'feature/boss-fight', upstream: '', ahead: 0, behind: 0, changed: 5, untracked: 2 }
}

const README = `# Example project

A short description of what this project does.

## Getting started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Features

- Live dashboard with **real-time** updates
- Role-based access control
- CSV export

| Command | Description |
| --- | --- |
| \`pnpm dev\` | Start the dev server |
| \`pnpm build\` | Production build |

> Contributions are welcome — see [the contributing guide](https://example.com/contributing).
`

const KEY = 'pm_mock_data_v2'
const nameOf = (path) => (path || '').split('\\').pop()

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  localStorage.setItem(KEY, JSON.stringify(SAMPLE))
  return structuredClone(SAMPLE)
}

let counter = 0
const uid = () => `mock_${Date.now()}_${counter++}`
const preview = (what) => alert(`${what} — ${L('tarayıcı önizlemesinde devre dışı', 'disabled in the browser preview')}`)

const mockApi = {
  isElectron: false,
  loadData: async () => read(),
  saveData: async (data) => {
    localStorage.setItem(KEY, JSON.stringify(data))
    return { ok: true }
  },
  getDataPath: async () => L('(tarayıcı önizlemesi — localStorage)', '(browser preview — localStorage)'),
  getAppVersion: async () => 'web-preview',

  // Export downloads the JSON; import uses a file picker. Both stay in the browser.
  exportData: async (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'project-manager-backup.json'
    a.click()
    URL.revokeObjectURL(a.href)
    return { ok: true, path: a.download }
  },
  importData: () =>
    new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json,.json'
      input.onchange = async () => {
        try {
          const parsed = JSON.parse(await input.files[0].text())
          if (!Array.isArray(parsed.projects)) return resolve({ ok: false, error: 'invalid_backup' })
          resolve({ ok: true, data: { groups: [], settings: {}, ...parsed } })
        } catch {
          resolve({ ok: false, error: 'invalid_backup' })
        }
      }
      input.click()
    }),

  selectFolder: async () => ({ ok: true, path: 'C:\\Projects\\new-project-' + uid() }),
  inspectFolder: async (folderPath) => ({
    ok: true,
    data: {
      name: nameOf(folderPath),
      description: '',
      gitUrl: '',
      hasGit: false,
      languages: ['TypeScript'],
      frameworks: ['React'],
      packageManager: 'pnpm',
      tags: ['TypeScript', 'React'],
      lastModified: Date.now()
    }
  }),
  redetect: async (folderPath, tags) => ({
    ok: true,
    data: { languages: [], frameworks: [], packageManager: '', tags: tags || [] }
  }),
  scanRoot: async (rootPath) => ({
    ok: true,
    projects: [
      ['billing-service', ['Kotlin', 'Spring'], 'gradle'],
      ['docs-site', ['TypeScript', 'Next.js'], 'yarn'],
      ['home-automation', ['Python', 'FastAPI'], 'pip'],
      ['mobile-app', ['Dart', 'Flutter'], 'pub']
    ].map(([n, tags], i, arr) => ({
      path: `${rootPath}\\${n}`,
      name: n,
      description: '',
      gitUrl: i % 2 ? `https://github.com/example/${n}` : '',
      hasGit: i % 2 === 1,
      languages: [tags[0]],
      frameworks: [tags[1]],
      packageManager: arr[i][2],
      tags,
      lastModified: Date.now() - i * day
    }))
  }),
  getScripts: async (folderPath) =>
    nameOf(folderPath) === 'acme-dashboard' || nameOf(folderPath) === 'portfolio-site'
      ? {
          ok: true,
          packageManager: nameOf(folderPath) === 'acme-dashboard' ? 'pnpm' : 'npm',
          scripts: { dev: 'vite', build: 'vite build', test: 'vitest run', lint: 'eslint .' }
        }
      : { ok: false, scripts: {} },
  runScript: async (folderPath, script) => {
    preview(script)
    return { ok: true }
  },
  getReadme: async (folderPath) =>
    GIT[nameOf(folderPath)] ? { ok: true, name: 'README.md', content: README, markdown: true } : { ok: false },
  checkPaths: async (paths) => Object.fromEntries((paths || []).map((p) => [p, !p.includes('missing')])),
  getLastCommit: async (folderPath) =>
    GIT[nameOf(folderPath)]
      ? {
          hash: 'a1b2c3d',
          subject: L('grafik önbelleği eklendi', 'add chart caching'),
          author: 'Jane Doe',
          date: new Date(Date.now() - hour * 5).toISOString()
        }
      : null,
  getGitStatus: async (folderPath) => {
    const g = GIT[nameOf(folderPath)]
    return g ? { detached: false, ...g } : null
  },

  openInEditor: async (command) => {
    preview(command)
    return { ok: true }
  },
  openInTerminal: async () => {
    preview(L('Terminal', 'Terminal'))
    return { ok: true }
  },
  openInExplorer: async () => {
    preview(L('Klasörde göster', 'Show in folder'))
    return { ok: true }
  },
  openExternal: async (url) => {
    window.open(url, '_blank')
    return { ok: true }
  },
  setAutoLaunch: async () => ({ ok: true }),
  setMinimizeToTray: async () => ({ ok: true }),
  setGlobalShortcut: async () => ({ ok: true }),

  windowMinimize: () => {},
  windowMaximizeToggle: () => {},
  windowClose: () => {},
  windowIsMaximized: async () => false,
  onWindowMaximize: () => () => {},

  getPathForFile: () => '',
  onProjectOpened: () => () => {},
  onOpenPalette: () => () => {}
}

export default mockApi
