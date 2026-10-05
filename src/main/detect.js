// Project fingerprinting: languages, frameworks and package manager.
// Pure fs/path only (no Electron), so it can be run and tested standalone.
//
// Three layers, cheapest first:
//   1. marker files   — Cargo.toml, go.mod, pom.xml, *.csproj, ...
//   2. manifest deps  — regex/JSON over the manifest to spot frameworks
//   3. extension census — a bounded walk, for projects with no manifest at all
import { join, extname, basename } from 'path'
import { readFileSync, existsSync, readdirSync } from 'fs'

// Directories never worth walking into.
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'out', 'release',
  'target', 'bin', 'obj', 'vendor', 'venv', '.venv', 'env', '__pycache__',
  '.next', '.nuxt', '.svelte-kit', 'coverage', '.gradle', '.idea', '.vs',
  'Library', 'Temp', 'Logs', 'Pods', 'DerivedData', '.terraform', '.cache'
])

// File extension → language.
const EXT_LANG = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript', '.mts': 'TypeScript', '.cts': 'TypeScript',
  '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.vue': 'Vue', '.svelte': 'Svelte', '.astro': 'Astro',
  '.py': 'Python', '.ipynb': 'Jupyter',
  '.rs': 'Rust', '.go': 'Go',
  '.java': 'Java', '.kt': 'Kotlin', '.kts': 'Kotlin', '.scala': 'Scala', '.groovy': 'Groovy',
  '.cs': 'C#', '.vb': 'VB.NET', '.fs': 'F#',
  '.c': 'C', '.h': 'C',
  '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++', '.hpp': 'C++', '.hh': 'C++',
  '.m': 'Objective-C', '.mm': 'Objective-C', '.swift': 'Swift',
  '.rb': 'Ruby', '.php': 'PHP', '.dart': 'Dart',
  '.lua': 'Lua', '.pl': 'Perl', '.r': 'R', '.jl': 'Julia',
  '.ex': 'Elixir', '.exs': 'Elixir', '.erl': 'Erlang',
  '.hs': 'Haskell', '.clj': 'Clojure', '.cljs': 'Clojure',
  '.zig': 'Zig', '.nim': 'Nim', '.cr': 'Crystal', '.v': 'V',
  '.f90': 'Fortran', '.f': 'Fortran', '.cob': 'COBOL',
  '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell',
  '.ps1': 'PowerShell', '.bat': 'Batch', '.cmd': 'Batch',
  '.sql': 'SQL', '.html': 'HTML', '.htm': 'HTML',
  '.css': 'CSS', '.scss': 'CSS', '.sass': 'CSS', '.less': 'CSS',
  '.sol': 'Solidity', '.tf': 'Terraform', '.gd': 'GDScript',
  '.asm': 'Assembly', '.s': 'Assembly', '.elm': 'Elm', '.ml': 'OCaml',
  '.md': null, '.json': null, '.yml': null, '.yaml': null, '.toml': null,
  '.xml': null, '.txt': null, '.lock': null, '.svg': null
}

// Marker file (or extension) at the project root → language + package manager.
// `glob: ext` means "any file with this extension in the root".
const MARKERS = [
  { file: 'Cargo.toml', lang: 'Rust', pm: 'cargo' },
  { file: 'go.mod', lang: 'Go', pm: 'go' },
  { file: 'pom.xml', lang: 'Java', pm: 'maven' },
  { file: 'build.gradle', lang: 'Java', pm: 'gradle' },
  { file: 'build.gradle.kts', lang: 'Kotlin', pm: 'gradle' },
  { file: 'build.sbt', lang: 'Scala', pm: 'sbt' },
  { file: 'composer.json', lang: 'PHP', pm: 'composer' },
  { file: 'Gemfile', lang: 'Ruby', pm: 'bundler' },
  { file: 'pubspec.yaml', lang: 'Dart', pm: 'pub' },
  { file: 'Package.swift', lang: 'Swift', pm: 'swiftpm' },
  { file: 'mix.exs', lang: 'Elixir', pm: 'hex' },
  { file: 'rebar.config', lang: 'Erlang', pm: 'rebar' },
  { file: 'deps.edn', lang: 'Clojure', pm: 'clojure' },
  { file: 'project.clj', lang: 'Clojure', pm: 'lein' },
  { file: 'stack.yaml', lang: 'Haskell', pm: 'stack' },
  { file: 'dune-project', lang: 'OCaml', pm: 'dune' },
  { file: 'shard.yml', lang: 'Crystal', pm: 'shards' },
  { file: 'pyproject.toml', lang: 'Python', pm: 'poetry' },
  { file: 'Pipfile', lang: 'Python', pm: 'pipenv' },
  { file: 'requirements.txt', lang: 'Python', pm: 'pip' },
  { file: 'setup.py', lang: 'Python', pm: 'pip' },
  { file: 'environment.yml', lang: 'Python', pm: 'conda' },
  { file: 'CMakeLists.txt', lang: 'C++', pm: 'cmake' },
  { file: 'Makefile', lang: null, pm: 'make' },
  { file: 'deno.json', lang: 'TypeScript', pm: 'deno' },
  { file: 'tsconfig.json', lang: 'TypeScript', pm: null },
  { ext: '.csproj', lang: 'C#', pm: 'nuget' },
  { ext: '.fsproj', lang: 'F#', pm: 'nuget' },
  { ext: '.sln', lang: 'C#', pm: 'nuget' },
  { ext: '.cabal', lang: 'Haskell', pm: 'cabal' },
  { ext: '.gemspec', lang: 'Ruby', pm: 'bundler' }
]

// JS package managers, most specific lockfile first.
const JS_LOCKS = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm']
]

// Tool / platform markers that are not really "languages".
const TOOL_MARKERS = [
  { file: 'Dockerfile', tag: 'Docker' },
  { file: 'docker-compose.yml', tag: 'Docker' },
  { file: 'compose.yaml', tag: 'Docker' },
  { file: 'project.godot', tag: 'Godot' },
  { file: 'Cargo.toml', dep: /tauri/, tag: 'Tauri' },
  { ext: '.uproject', tag: 'Unreal' },
  { dir: 'ProjectSettings', andDir: 'Assets', tag: 'Unity' },
  { dir: '.github', tag: null } // walked but not tagged
]

// Framework detection: <manifest file> + regex over its text → tag.
// Regexes target dependency declarations, so a stray word in a README or a
// comment cannot produce a false badge.
const DEP_RULES = [
  // --- JavaScript / TypeScript (package.json) ---
  { file: 'package.json', re: /"next"\s*:/, tag: 'Next.js' },
  { file: 'package.json', re: /"nuxt"\s*:/, tag: 'Nuxt' },
  { file: 'package.json', re: /"@remix-run\//, tag: 'Remix' },
  { file: 'package.json', re: /"@sveltejs\/kit"\s*:/, tag: 'SvelteKit' },
  { file: 'package.json', re: /"react"\s*:/, tag: 'React' },
  { file: 'package.json', re: /"react-native"\s*:/, tag: 'React Native' },
  { file: 'package.json', re: /"expo"\s*:/, tag: 'Expo' },
  { file: 'package.json', re: /"vue"\s*:/, tag: 'Vue' },
  { file: 'package.json', re: /"svelte"\s*:/, tag: 'Svelte' },
  { file: 'package.json', re: /"@angular\/core"\s*:/, tag: 'Angular' },
  { file: 'package.json', re: /"solid-js"\s*:/, tag: 'Solid' },
  { file: 'package.json', re: /"astro"\s*:/, tag: 'Astro' },
  { file: 'package.json', re: /"@nestjs\/core"\s*:/, tag: 'NestJS' },
  { file: 'package.json', re: /"express"\s*:/, tag: 'Express' },
  { file: 'package.json', re: /"fastify"\s*:/, tag: 'Fastify' },
  { file: 'package.json', re: /"electron"\s*:/, tag: 'Electron' },
  { file: 'package.json', re: /"tailwindcss"\s*:/, tag: 'Tailwind' },
  { file: 'package.json', re: /"vite"\s*:/, tag: 'Vite' },
  { file: 'package.json', re: /"three"\s*:/, tag: 'Three.js' },
  { file: 'package.json', re: /"prisma"\s*:/, tag: 'Prisma' },

  // --- Python ---
  { file: ['requirements.txt', 'pyproject.toml', 'Pipfile'], re: /\bdjango\b/i, tag: 'Django' },
  { file: ['requirements.txt', 'pyproject.toml', 'Pipfile'], re: /\bflask\b/i, tag: 'Flask' },
  { file: ['requirements.txt', 'pyproject.toml', 'Pipfile'], re: /\bfastapi\b/i, tag: 'FastAPI' },
  { file: ['requirements.txt', 'pyproject.toml', 'Pipfile'], re: /\bstreamlit\b/i, tag: 'Streamlit' },
  { file: ['requirements.txt', 'pyproject.toml', 'Pipfile'], re: /\b(torch|pytorch)\b/i, tag: 'PyTorch' },
  { file: ['requirements.txt', 'pyproject.toml', 'Pipfile'], re: /\btensorflow\b/i, tag: 'TensorFlow' },
  { file: ['requirements.txt', 'pyproject.toml', 'Pipfile'], re: /\bpandas\b/i, tag: 'Pandas' },
  { file: ['requirements.txt', 'pyproject.toml', 'Pipfile'], re: /\bscrapy\b/i, tag: 'Scrapy' },

  // --- Rust ---
  { file: 'Cargo.toml', re: /^\s*actix-web\s*=/m, tag: 'Actix' },
  { file: 'Cargo.toml', re: /^\s*axum\s*=/m, tag: 'Axum' },
  { file: 'Cargo.toml', re: /^\s*rocket\s*=/m, tag: 'Rocket' },
  { file: 'Cargo.toml', re: /^\s*bevy\s*=/m, tag: 'Bevy' },
  { file: 'Cargo.toml', re: /^\s*tauri\s*=/m, tag: 'Tauri' },

  // --- Go ---
  { file: 'go.mod', re: /gin-gonic\/gin/, tag: 'Gin' },
  { file: 'go.mod', re: /labstack\/echo/, tag: 'Echo' },
  { file: 'go.mod', re: /gofiber\/fiber/, tag: 'Fiber' },

  // --- PHP / Ruby / Java / Dart ---
  { file: 'composer.json', re: /"laravel\/framework"/, tag: 'Laravel' },
  { file: 'composer.json', re: /"symfony\//, tag: 'Symfony' },
  { file: 'Gemfile', re: /\brails\b/i, tag: 'Rails' },
  { file: 'Gemfile', re: /\bsinatra\b/i, tag: 'Sinatra' },
  { file: ['pom.xml', 'build.gradle', 'build.gradle.kts'], re: /springframework|spring-boot/i, tag: 'Spring' },
  { file: ['build.gradle', 'build.gradle.kts'], re: /com\.android\.application/, tag: 'Android' },
  { file: 'pubspec.yaml', re: /^\s*flutter\s*:/m, tag: 'Flutter' },

  // --- .NET ---
  { file: 'Directory.Build.props', re: /Microsoft\.NET\.Sdk\.Web/, tag: 'ASP.NET' }
]

function readText(dir, file) {
  try {
    return readFileSync(join(dir, file), 'utf-8')
  } catch {
    return ''
  }
}

function rootEntries(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

// Walk the tree (bounded) counting source files per language. This is what
// lets us tag a project that has no manifest at all — a folder of Lua mods,
// a pile of shell scripts, a static HTML site.
function census(root, maxDepth = 4, maxFiles = 4000) {
  const counts = new Map()
  let seen = 0
  const stack = [[root, 0]]

  while (stack.length && seen < maxFiles) {
    const [dir, depth] = stack.pop()
    for (const e of rootEntries(dir)) {
      if (seen >= maxFiles) break
      if (e.isDirectory()) {
        if (depth >= maxDepth) continue
        if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue
        stack.push([join(dir, e.name), depth + 1])
      } else if (e.isFile()) {
        const lang = EXT_LANG[extname(e.name).toLowerCase()]
        if (!lang) continue
        counts.set(lang, (counts.get(lang) || 0) + 1)
        seen++
      }
    }
  }
  return counts
}

// Keep the languages that actually carry the project: anything with a
// meaningful share of the source files, plus always the top one.
function significantLanguages(counts, { minShare = 0.05, max = 5 } = {}) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  if (!total) return []
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, n], i) => i === 0 || n / total >= minShare)
    .slice(0, max)
    .map(([lang]) => lang)
}

export function detectPackageManager(folderPath) {
  for (const [lock, pm] of JS_LOCKS) {
    if (existsSync(join(folderPath, lock))) return pm
  }
  if (existsSync(join(folderPath, 'package.json'))) return 'npm'

  const names = rootEntries(folderPath).map((e) => e.name)
  for (const m of MARKERS) {
    if (!m.pm) continue
    if (m.file && names.includes(m.file)) return m.pm
    if (m.ext && names.some((n) => n.toLowerCase().endsWith(m.ext))) return m.pm
  }
  return ''
}

// Full fingerprint of a folder.
export function detectProject(folderPath) {
  const names = rootEntries(folderPath).map((e) => e.name)
  const dirs = new Set(
    rootEntries(folderPath).filter((e) => e.isDirectory()).map((e) => e.name)
  )
  const hasFile = (f) => names.includes(f)
  const hasExt = (ext) => names.some((n) => n.toLowerCase().endsWith(ext))

  const languages = new Set()
  const frameworks = new Set()

  // 1. marker files
  for (const m of MARKERS) {
    const hit = (m.file && hasFile(m.file)) || (m.ext && hasExt(m.ext))
    if (hit && m.lang) languages.add(m.lang)
  }
  if (hasFile('package.json') && !hasFile('deno.json')) {
    languages.add(hasFile('tsconfig.json') ? 'TypeScript' : 'JavaScript')
  }

  // 2. framework rules over manifest text
  const textCache = new Map()
  const textOf = (f) => {
    if (!textCache.has(f)) textCache.set(f, hasFile(f) ? readText(folderPath, f) : '')
    return textCache.get(f)
  }
  for (const rule of DEP_RULES) {
    const files = Array.isArray(rule.file) ? rule.file : [rule.file]
    if (files.some((f) => rule.re.test(textOf(f)))) frameworks.add(rule.tag)
  }

  // tools / engines
  for (const t of TOOL_MARKERS) {
    if (!t.tag) continue
    if (t.file && hasFile(t.file)) {
      if (!t.dep || t.dep.test(textOf(t.file))) frameworks.add(t.tag)
    }
    if (t.ext && hasExt(t.ext)) frameworks.add(t.tag)
    if (t.dir && dirs.has(t.dir) && (!t.andDir || dirs.has(t.andDir))) frameworks.add(t.tag)
  }

  // 3. extension census — fills in languages markers can't know about
  const counts = census(folderPath)
  significantLanguages(counts).forEach((l) => languages.add(l))

  // A TypeScript project always drags in a few .js config files; don't let
  // that show up as a second headline language.
  if (languages.has('TypeScript') && (counts.get('JavaScript') || 0) < (counts.get('TypeScript') || 0)) {
    languages.delete('JavaScript')
  }

  return {
    languages: [...languages].slice(0, 5),
    frameworks: [...frameworks].slice(0, 6),
    packageManager: detectPackageManager(folderPath),
    fileCounts: Object.fromEntries(counts)
  }
}

// Languages + frameworks, deduped — what the UI shows as tags.
export function detectTags(folderPath, detected) {
  const d = detected || detectProject(folderPath)
  return [...new Set([...d.languages, ...d.frameworks])].slice(0, 8)
}

// Is this folder the root of a project (for the bulk scan)? True when it has a
// VCS folder or any recognised manifest — not merely because it holds source
// files, so we don't flag every nested source directory.
export function isProjectRoot(folderPath) {
  const names = rootEntries(folderPath).map((e) => e.name)
  if (names.includes('.git') || names.includes('.hg') || names.includes('.svn')) return true
  for (const m of MARKERS) {
    if (m.file && names.includes(m.file)) return true
    if (m.ext && names.some((n) => n.toLowerCase().endsWith(m.ext))) return true
  }
  if (names.includes('package.json') || names.includes('project.godot')) return true
  if (names.some((n) => n.toLowerCase().endsWith('.uproject'))) return true
  return false
}

// Every tag the detector can produce, plus the ones older versions produced
// ('Node'). Re-detection replaces these and leaves any other tag alone, so a
// tag the user typed themselves ("Client work", "CLI") survives.
export const KNOWN_TAGS = new Set([
  ...Object.values(EXT_LANG).filter(Boolean),
  ...MARKERS.map((m) => m.lang).filter(Boolean),
  ...DEP_RULES.map((r) => r.tag),
  ...TOOL_MARKERS.map((t) => t.tag).filter(Boolean),
  'JavaScript',
  'TypeScript',
  'Node'
])

// Fresh detection merged with the user's own tags.
export function mergeDetectedTags(currentTags, detected) {
  const own = (currentTags || []).filter((tag) => !KNOWN_TAGS.has(tag))
  return [...new Set([...detected.languages, ...detected.frameworks, ...own])].slice(0, 10)
}

export { basename, SKIP_DIRS }
