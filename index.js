import { Lexer } from 'marked'
import * as octicons from '@primer/octicons'

const ALERT_RE = /^\[!([a-z][a-z0-9_-]*)\][ \t]*(?:\n|$)/i
const OCTICON_MAP =
  octicons.default && typeof octicons.default === 'object'
    ? octicons.default
    : octicons['module.exports'] && typeof octicons['module.exports'] === 'object'
      ? octicons['module.exports']
      : octicons

const DEFAULT_ALERTS = Object.freeze({
  note: { title: 'Note', icon: 'info' },
  tip: { title: 'Tip', icon: 'light-bulb' },
  important: { title: 'Important', icon: 'report' },
  warning: { title: 'Warning', icon: 'alert' },
  caution: { title: 'Caution', icon: 'stop' }
})

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase()
}

function slugifyKey(value) {
  return normalizeKey(value).replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function humanizeKey(value) {
  const key = normalizeKey(value)
  if (!key) return ''
  return key.split(/[-_]+/g).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildAlerts(options) {
  const map = {}

  for (const [key, config] of Object.entries(DEFAULT_ALERTS)) {
    map[key] = { ...config }
  }

  if (options.alerts && typeof options.alerts === 'object') {
    for (const [key, config] of Object.entries(options.alerts)) {
      const normalized = normalizeKey(key)
      if (!normalized || !config || typeof config !== 'object') continue
      map[normalized] = { ...(map[normalized] || {}), ...config }
    }
  }

  if (options.titles && typeof options.titles === 'object') {
    for (const [key, title] of Object.entries(options.titles)) {
      const normalized = normalizeKey(key)
      if (!normalized) continue
      map[normalized] = { ...(map[normalized] || {}), title: String(title) }
    }
  }

  if (options.icons && typeof options.icons === 'object') {
    for (const [key, icon] of Object.entries(options.icons)) {
      const normalized = normalizeKey(key)
      if (!normalized) continue
      map[normalized] = { ...(map[normalized] || {}), icon }
    }
  }

  return map
}

function renderIcon(icon, context, iconOptions) {
  if (icon === false || icon == null) return ''

  if (typeof icon === 'function') {
    return icon(context) || ''
  }

  if (typeof icon !== 'string') return ''

  const rawIcon = icon.trimStart()
  if (rawIcon.startsWith('<')) return rawIcon

  const iconName = icon.toLowerCase()
  const octicon = OCTICON_MAP[iconName]
  if (!octicon || typeof octicon.toSVG !== 'function') return ''

  const customClass = iconOptions.class ? ` ${iconOptions.class}` : ''
  return octicon.toSVG({
    ...iconOptions,
    class: `marked-github-alert-icon${customClass}`
  })
}

export function markedGithubAlerts(options = {}) {
  const alerts = buildAlerts(options)
  const iconOptions = { width: 16, height: 16, ...options.iconOptions }

  return {
    extensions: [
      {
        name: 'blockquote',
        renderer(token) {
          const text = typeof token?.text === 'string' ? token.text : ''
          const match = ALERT_RE.exec(text)
          if (!match) return false

          const alertType = normalizeKey(match[1])
          const alert = alerts[alertType]
          if (!alert) return false

          const alertClass = slugifyKey(alertType)
          const title = escapeHtml(alert.title || humanizeKey(alertType))
          const bodyMarkdown = text.slice(match[0].length)
          const bodyTokens = bodyMarkdown.trim() ? Lexer.lex(bodyMarkdown, this.parser.options) : []
          const bodyHtml = this.parser.parse(bodyTokens)
          const iconHtml = renderIcon(alert.icon, { type: alertType, title }, iconOptions)

          return `<div class="marked-github-alert marked-github-alert-${alertClass}">
<p class="marked-github-alert-title">${iconHtml}<span>${title}</span></p>
${bodyHtml}</div>
`
        }
      }
    ]
  }
}
