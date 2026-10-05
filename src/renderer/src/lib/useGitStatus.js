import { useEffect, useReducer } from 'react'
import api from './api.js'

// Shared git-status cache. Each card subscribes by path; every path is
// fetched at most once per TTL, and at most MAX_PARALLEL `git status`
// processes run at a time so a long project list doesn't spawn dozens at once.
const TTL = 60_000
const MAX_PARALLEL = 4

const cache = new Map() // path -> { data, at }
const inflight = new Set()
const listeners = new Map() // path -> Set<() => void>
const queue = []
let running = 0

function notify(path) {
  listeners.get(path)?.forEach((fn) => fn())
}

function pump() {
  while (running < MAX_PARALLEL && queue.length) {
    const path = queue.shift()
    running++
    Promise.resolve(api.getGitStatus(path))
      .catch(() => null)
      .then((data) => {
        cache.set(path, { data, at: Date.now() })
        inflight.delete(path)
        running--
        notify(path)
        pump()
      })
  }
}

function request(path) {
  if (inflight.has(path)) return
  inflight.add(path)
  queue.push(path)
  pump()
}

function isStale(path) {
  const entry = cache.get(path)
  return !entry || Date.now() - entry.at > TTL
}

// Returns undefined while loading, null when the folder isn't a repo (or git
// is unavailable), otherwise the status object from the main process.
export function useGitStatus(path) {
  const [, rerender] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    if (!path) return
    const set = listeners.get(path) || new Set()
    set.add(rerender)
    listeners.set(path, set)
    if (isStale(path)) request(path)
    return () => set.delete(rerender)
  }, [path])

  if (!path) return null
  const entry = cache.get(path)
  return entry ? entry.data : undefined
}

// Re-read every status someone is looking at (e.g. when the window regains
// focus after a commit in the editor). Cached values stay visible meanwhile.
export function refreshGitStatuses() {
  for (const [path, set] of listeners) {
    if (set.size) request(path)
  }
}
