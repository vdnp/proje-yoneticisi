// Daily snapshots of data.json (backups/data-YYYY-MM-DD.json). Pure, no
// Electron or fs imports; store.js does the file work.

export const KEEP_SNAPSHOTS = 7

const SNAPSHOT_NAME = /^data-(\d{4}-\d{2}-\d{2})\.json$/

// Local date, so a new snapshot starts at the user's midnight, not UTC's.
export function snapshotName(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `data-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

// "YYYY-MM-DD" for a snapshot file name, or null for anything else. Also
// the guard for names coming from the renderer: no separators, no "..".
export function snapshotDate(name) {
  const m = typeof name === 'string' ? SNAPSHOT_NAME.exec(name) : null
  return m ? m[1] : null
}

// Snapshot names newest first; other files in the folder are ignored.
export function sortSnapshots(names) {
  return names.filter((n) => snapshotDate(n)).sort().reverse()
}

// The snapshots to delete so that only the newest `keep` remain.
export function snapshotsToPrune(names, keep = KEEP_SNAPSHOTS) {
  return sortSnapshots(names).slice(keep)
}
