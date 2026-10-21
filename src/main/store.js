import { app } from 'electron'
import { join } from 'path'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  copyFileSync,
  readdirSync,
  rmSync
} from 'fs'
import { DEFAULT_DATA, hydrate } from './schema.js'
import { snapshotName, snapshotDate, sortSnapshots, snapshotsToPrune } from './snapshots.js'

// Simple JSON-file persistence in the OS user-data directory.
// e.g. C:\Users\<user>\AppData\Roaming\project-manager\data.json
const DATA_DIR = app.getPath('userData')
const DATA_FILE = join(DATA_DIR, 'data.json')
const BACKUP_FILE = DATA_FILE + '.bak'
const SNAPSHOT_DIR = join(DATA_DIR, 'backups')

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

export function loadData() {
  try {
    ensureDir()
    if (!existsSync(DATA_FILE)) {
      writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8')
      return structuredClone(DEFAULT_DATA)
    }
    return hydrate(JSON.parse(readFileSync(DATA_FILE, 'utf-8')))
  } catch (err) {
    console.error('[store] loadData failed:', err)
    // Fall back to the last good backup before giving up on the user's data.
    try {
      if (existsSync(BACKUP_FILE)) {
        console.warn('[store] recovered from .bak')
        return hydrate(JSON.parse(readFileSync(BACKUP_FILE, 'utf-8')))
      }
    } catch {
      /* ignore */
    }
    return structuredClone(DEFAULT_DATA)
  }
}

export function saveData(data) {
  try {
    ensureDir()
    // Keep a .bak of the last good file, then write atomically (temp + rename)
    // so a crash mid-write can never leave a corrupt data.json.
    if (existsSync(DATA_FILE)) {
      try {
        copyFileSync(DATA_FILE, BACKUP_FILE)
      } catch {
        /* backup is best-effort */
      }
      takeDailySnapshot()
    }
    const tmp = DATA_FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    renameSync(tmp, DATA_FILE)
    return { ok: true }
  } catch (err) {
    console.error('[store] saveData failed:', err)
    return { ok: false, error: String(err) }
  }
}

export function getDataFilePath() {
  return DATA_FILE
}

// ---- Daily snapshots ----
// The first save of each day copies the file as it was before that save into
// backups/, so each snapshot is how the data looked when the day started.
// Only the newest few are kept (see snapshots.js).
function takeDailySnapshot() {
  try {
    const file = join(SNAPSHOT_DIR, snapshotName(new Date()))
    if (existsSync(file)) return
    mkdirSync(SNAPSHOT_DIR, { recursive: true })
    copyFileSync(DATA_FILE, file)
    for (const name of snapshotsToPrune(readdirSync(SNAPSHOT_DIR))) {
      rmSync(join(SNAPSHOT_DIR, name), { force: true })
    }
  } catch (err) {
    console.error('[store] daily snapshot failed:', err)
  }
}

// [{ name, date: 'YYYY-MM-DD', projects }] newest first. Files that can't be
// read as a backup are left out.
export function listSnapshots() {
  try {
    if (!existsSync(SNAPSHOT_DIR)) return []
    return sortSnapshots(readdirSync(SNAPSHOT_DIR)).flatMap((name) => {
      const res = readSnapshot(name)
      return res.ok ? [{ name, date: snapshotDate(name), projects: res.data.projects.length }] : []
    })
  } catch {
    return []
  }
}

// `name` comes from the renderer, so only a plain snapshot file name is
// accepted; it is always resolved inside the backups folder.
export function readSnapshot(name) {
  if (!snapshotDate(name)) return { ok: false, error: 'invalid_backup' }
  try {
    const parsed = JSON.parse(readFileSync(join(SNAPSHOT_DIR, name), 'utf-8'))
    if (!parsed || !Array.isArray(parsed.projects)) return { ok: false, error: 'invalid_backup' }
    return { ok: true, data: hydrate(parsed) }
  } catch {
    return { ok: false, error: 'invalid_backup' }
  }
}
