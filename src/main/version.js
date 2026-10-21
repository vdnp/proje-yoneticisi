// Version helpers for the update check. Pure, no Electron imports.

// "v1.4.0" / "1.4.0" -> [1, 4, 0]; anything else (pre-releases included) -> null.
export function parseVersion(text) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(text || '').trim())
  return m ? m.slice(1).map(Number) : null
}

export function isNewer(latest, current) {
  const a = parseVersion(latest)
  const b = parseVersion(current)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return false
}
