// Linked projects (e.g. a frontend and its backend) and the "launch" plan
// built from them. Pure and dependency-free: the main process (tray, data
// loading) and the renderer both import it.
//
// A link is symmetric: if A lists B, B lists A. `links` holds project ids.

// Drop links to projects that no longer exist (or to the project itself) and
// make every link two-way. Returns a new array; projects whose links didn't
// change are passed through untouched.
export function sanitizeLinks(projects) {
  const ids = new Set(projects.map((p) => p.id))
  const pairs = new Map(projects.map((p) => [p.id, new Set()]))
  for (const p of projects) {
    for (const other of Array.isArray(p.links) ? p.links : []) {
      if (other === p.id || !ids.has(other)) continue
      pairs.get(p.id).add(other)
      pairs.get(other).add(p.id)
    }
  }
  return projects.map((p) => {
    const links = [...pairs.get(p.id)]
    const before = Array.isArray(p.links) ? p.links : []
    const same = before.length === links.length && links.every((id) => before.includes(id))
    return same ? p : { ...p, links }
  })
}

// Connect every project in `ids` to every other one.
export function linkAll(projects, ids) {
  const set = new Set(ids)
  return sanitizeLinks(
    projects.map((p) =>
      set.has(p.id) ? { ...p, links: [...new Set([...(p.links || []), ...ids])] } : p
    )
  )
}

export function unlinkPair(projects, a, b) {
  return projects.map((p) => {
    if (p.id === a) return { ...p, links: (p.links || []).filter((id) => id !== b) }
    if (p.id === b) return { ...p, links: (p.links || []).filter((id) => id !== a) }
    return p
  })
}

export function linkedProjects(project, projects) {
  const links = project.links || []
  return projects.filter((p) => links.includes(p.id))
}

// "Launch" does more than "open in editor" only when there is something extra
// to do: linked projects to open alongside, or a dev script to start.
export function isLaunchable(project) {
  return (project.links || []).length > 0 || !!project.startScript
}

// Everything a launch does, in order: the project itself first, then its
// linked projects. Each opens in its own editor; `script` is the
// package.json script to start in a terminal ('' = none). Projects without a
// folder path are skipped.
export function launchPlan(project, projects, defaultEditor) {
  return [project, ...linkedProjects(project, projects)]
    .filter((p) => p.path)
    .map((p) => ({
      id: p.id,
      name: p.name,
      path: p.path,
      command: p.editorCommand || defaultEditor || 'code',
      script: p.startScript || ''
    }))
}
