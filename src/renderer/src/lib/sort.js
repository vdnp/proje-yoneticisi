export const SORTS = ['custom', 'modified', 'opened', 'name', 'favorite']

// Custom order: projects not placed yet (newly added) come first, newest
// first; then everything by its saved position.
function byCustom(a, b) {
  const ao = a.order ?? null
  const bo = b.order ?? null
  if (ao === null && bo === null) return (b.createdAt || 0) - (a.createdAt || 0)
  if (ao === null) return -1
  if (bo === null) return 1
  return ao - bo
}

const BY = {
  custom: byCustom,
  name: (a, b) => a.name.localeCompare(b.name),
  opened: (a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0),
  favorite: (a, b) =>
    Number(b.favorite) - Number(a.favorite) || (b.lastModified || 0) - (a.lastModified || 0),
  modified: (a, b) => (b.lastModified || 0) - (a.lastModified || 0)
}

export function sortProjects(list, sort) {
  // Pinned projects always float to the top, whatever the sort.
  return [...list].sort(
    (a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (BY[sort] || BY.modified)(a, b)
  )
}

// The full custom order, ignoring pins (they only affect display).
export function customOrderIds(projects) {
  return [...projects].sort(byCustom).map((p) => p.id)
}

// Move `moving` (ids, kept in their current relative order) next to
// `targetId` in `orderedIds`: before it, or after it when `after` is true.
export function moveIds(orderedIds, moving, targetId, after) {
  const set = new Set(moving)
  if (set.has(targetId)) return orderedIds
  const kept = orderedIds.filter((id) => !set.has(id))
  const block = orderedIds.filter((id) => set.has(id))
  const at = kept.indexOf(targetId) + (after ? 1 : 0)
  return [...kept.slice(0, at), ...block, ...kept.slice(at)]
}
