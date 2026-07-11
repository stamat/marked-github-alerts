import { Lexer } from 'marked'
import octicons from '@primer/octicons'

const ALERT_RE = /^\[!([a-z][a-z0-9_-]*)\][ \t]*(?:\n|$)/i

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
  // Null prototype so lookups like alerts['constructor'] can't hit Object.prototype
  const map = Object.create(null)

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
  const octicon = Object.hasOwn(octicons, iconName) ? octicons[iconName] : null
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
          const first = token?.tokens?.[0]
          if (!first || first.type !== 'paragraph' || typeof first.text !== 'string') return false
          const match = ALERT_RE.exec(first.text)
          if (!match) return false

          const alertType = normalizeKey(match[1])
          const alert = alerts[alertType]
          if (!alert) return false

          const alertClass = slugifyKey(alertType)
          const rawTitle = alert.title || humanizeKey(alertType)
          const title = escapeHtml(rawTitle)

          // Reuse the already-lexed tokens (keeps document link refs resolved),
          // stripping the [!TYPE] marker from the first paragraph.
          const bodyTokens = token.tokens.slice(1)
          const bodyText = first.text.slice(match[0].length)
          if (bodyText.trim()) {
            const inline = first.tokens ? first.tokens.slice() : []
            if (inline[0] && typeof inline[0].raw === 'string' && inline[0].raw.startsWith(match[0])) {
              const raw = inline[0].raw.slice(match[0].length)
              if (raw) inline[0] = { ...inline[0], raw, text: raw }
              else inline.shift()
              bodyTokens.unshift({ ...first, raw: first.raw.slice(match[0].length), text: bodyText, tokens: inline })
            } else {
              // Fallback for unexpected inline shapes: re-lex the body text
              bodyTokens.unshift(...Lexer.lex(bodyText, this.parser.options))
            }
          }
          const bodyHtml = this.parser.parse(bodyTokens)
          const iconHtml = renderIcon(alert.icon, { type: alertType, title: rawTitle }, iconOptions)

          return `<div class="marked-github-alert marked-github-alert-${alertClass}">
<p class="marked-github-alert-title">${iconHtml}<span>${title}</span></p>
${bodyHtml}</div>
`
        }
      }
    ]
  }
}
