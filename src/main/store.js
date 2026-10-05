import { app } from 'electron'
import { join } from 'path'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  copyFileSync
} from 'fs'
import { DEFAULT_DATA, hydrate } from './schema.js'

// Simple JSON-file persistence in the OS user-data directory.
// e.g. C:\Users\<user>\AppData\Roaming\project-manager\data.json
const DATA_DIR = app.getPath('userData')
const DATA_FILE = join(DATA_DIR, 'data.json')
const BACKUP_FILE = DATA_FILE + '.bak'

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
