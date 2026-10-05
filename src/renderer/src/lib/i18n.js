import { useCallback } from 'react'
import useStore from '../store/useStore.js'
import tr from '../locales/tr.js'
import en from '../locales/en.js'

// A deliberately tiny i18n layer: nested dictionaries, `{name}` interpolation
// and `_one` / `_other` plural variants. Adding a language = adding a file in
// ../locales and an entry below.
const DICTS = { tr, en }

export const LANGUAGES = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'English' }
]

// 'auto' (and anything unknown) follows the system language.
export function resolveLanguage(setting) {
  if (DICTS[setting]) return setting
  const system = (typeof navigator !== 'undefined' && navigator.language) || 'en'
  return system.toLowerCase().startsWith('tr') ? 'tr' : 'en'
}

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

// Plural variant from this dictionary if it has one, else the plain key.
// Resolved per dictionary, so a Turkish lookup never borrows an English
// plural form.
function pick(dict, key, count) {
  if (typeof count === 'number') {
    const plural = lookup(dict, count === 1 ? `${key}_one` : `${key}_other`)
    if (typeof plural === 'string') return plural
  }
  const value = lookup(dict, key)
  return typeof value === 'string' ? value : undefined
}

export function translate(lang, key, vars) {
  const count = vars?.count
  const text = pick(DICTS[lang] || DICTS.en, key, count) ?? pick(DICTS.en, key, count) ?? key
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match))
}

export function useI18n() {
  const lang = useStore((s) => resolveLanguage(s.settings.language))
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])
  return { t, lang }
}

// Main-process errors arrive as codes ('not_found', ...). Unknown codes (or a
// raw exception string) fall back to a generic message.
export function errorText(t, code) {
  const key = `errors.${code}`
  const text = code ? t(key) : key
  return text === key ? t('errors.unknown') : text
}
