import { describe, it, expect } from '@jest/globals'
import { Marked } from 'marked'
import { markedGithubAlerts } from '../index.js'

function render(src, options) {
  const marked = new Marked()
  marked.use(markedGithubAlerts(options))
  return marked.parse(src)
}

describe('markedGithubAlerts', () => {
  it('renders default GFM note alert', () => {
    const html = render('> [!NOTE]\n> Useful information.')
    expect(html).toMatch(/<div class="marked-github-alert marked-github-alert-note">/)
    expect(html).toMatch(/<p class="marked-github-alert-title">/)
    expect(html).toMatch(/<span>Note<\/span>/)
    expect(html).toMatch(/Useful information\./)
  })

  it('keeps normal blockquotes untouched', () => {
    const html = render('> plain blockquote')
    expect(html).toMatch(/<blockquote>/)
    expect(html).not.toMatch(/marked-github-alert/)
  })

  it('supports title and icon overrides', () => {
    const html = render('> [!NOTE]\n> body', {
      titles: { note: 'Heads up' },
      icons: { note: '<svg data-custom-icon="1"></svg>' }
    })
    expect(html).toMatch(/<span>Heads up<\/span>/)
    expect(html).toMatch(/data-custom-icon="1"/)
  })

  it('supports custom HTML icon overrides', () => {
    const html = render('> [!TIP]\n> body', {
      icons: { tip: '  <span data-custom-html-icon="1">!</span>' }
    })
    expect(html).toMatch(/data-custom-html-icon="1"/)
  })

  it('renders default octicons for built-in alerts', () => {
    const html = render('> [!TIP]\n> body')
    expect(html).toMatch(/marked-github-alert-icon/)
    expect(html).toMatch(/octicon/)
  })

  it('supports custom alert types', () => {
    const html = render('> [!FACT]\n> one\n>\n> - two', {
      alerts: {
        fact: { title: 'Fact', icon: false }
      }
    })
    expect(html).toMatch(/marked-github-alert-fact/)
    expect(html).toMatch(/<span>Fact<\/span>/)
    expect(html).toMatch(/<ul>/)
    expect(html).not.toMatch(/marked-github-alert-icon/)
  })

  it('ignores markers with trailing text on the same line', () => {
    const html = render('> [!NOTE] trailing text')
    expect(html).toMatch(/<blockquote>/)
    expect(html).not.toMatch(/marked-github-alert/)
  })

  it('renders alert with no body', () => {
    const html = render('> [!NOTE]')
    expect(html).toMatch(/marked-github-alert-note/)
    expect(html).toMatch(/<span>Note<\/span>/)
  })

  it('does not treat Object.prototype keys as alert types', () => {
    const html = render('> [!CONSTRUCTOR]\n> body')
    expect(html).toMatch(/<blockquote>/)
    expect(html).not.toMatch(/marked-github-alert/)
  })

  it('resolves document-level link references inside alerts', () => {
    const html = render('> [!NOTE]\n> See [ref]\n\n[ref]: http://example.com')
    expect(html).toMatch(/<a href="http:\/\/example\.com">ref<\/a>/)
  })
})
