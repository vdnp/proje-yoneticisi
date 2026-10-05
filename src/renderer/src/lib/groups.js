// Group colors — a restrained, consistent palette shared by the sidebar dots,
// card accents and the group editor. Values are plain hex so they can be used
// for inline borders/dots regardless of theme. Display names live in the
// locale files under `colors.<id>`.
export const GROUP_COLORS = {
  indigo: '#a5b4fc',
  violet: '#c4b5fd',
  sky: '#7dd3fc',
  teal: '#5eead4',
  emerald: '#86efac',
  amber: '#fcd34d',
  rose: '#fda4af',
  pink: '#f9a8d4'
}

export const GROUP_COLOR_LIST = Object.entries(GROUP_COLORS).map(([id, hex]) => ({ id, hex }))

export function groupColorHex(colorId) {
  return GROUP_COLORS[colorId] || GROUP_COLORS.indigo
}

// The color a project should show: its own override, else its group's.
export function projectColorHex(project, groups) {
  if (project.color) return groupColorHex(project.color)
  const g = groups.find((x) => x.id === project.groupId)
  return g ? groupColorHex(g.color) : ''
}
