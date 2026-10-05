// Lightweight fuzzy matcher: the query must appear as a subsequence of the
// text (so "ad" matches "acme-dashboard"), scored so that better matches rank first.
//
// Scoring favours: consecutive runs, matches at word boundaries, matches at the
// start, and shorter targets. Returns -1 when there is no match.

function normalize(s) {
  return (s || '').toLocaleLowerCase('tr')
}

export function fuzzyScore(query, text) {
  const q = normalize(query)
  const t = normalize(text)
  if (!q) return 0
  if (!t) return -1

  let score = 0
  let ti = 0
  let prevMatched = false

  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi]
    let found = -1
    while (ti < t.length) {
      if (t[ti] === ch) {
        found = ti
        break
      }
      ti++
    }
    if (found === -1) return -1

    score += 1
    if (prevMatched) score += 5 // consecutive characters
    if (found === 0) score += 8 // matches the very start
    else if (/[\s\-_./\\]/.test(t[found - 1])) score += 4 // word boundary

    prevMatched = true
    ti = found + 1
    if (qi < q.length - 1 && t[ti] !== q[qi + 1]) prevMatched = false
  }

  // Prefer tighter matches: shorter text and an exact substring hit.
  score -= Math.floor(t.length / 20)
  if (t.includes(q)) score += 10
  if (t === q) score += 20
  return score
}

// Best score across several fields (name, description, tags...).
export function fuzzyScoreAny(query, fields) {
  let best = -1
  for (const f of fields) {
    if (!f) continue
    const s = fuzzyScore(query, f)
    if (s > best) best = s
  }
  return best
}
