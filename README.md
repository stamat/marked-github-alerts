# marked-github-alerts [![npm version](https://img.shields.io/npm/v/marked-github-alerts)](https://www.npmjs.com/package/marked-github-alerts)

A lightweight [`marked`](https://www.npmjs.com/package/marked) extension for GitHub-style GFM alerts.

It converts:

```md
> [!NOTE]
> This is a note.
```

into:

```html
<div class="marked-github-alert marked-github-alert-note">
  <p class="marked-github-alert-title">...</p>
  <p>This is a note.</p>
</div>
```

Default alert types match GitHub: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`.
Icons come from [`@primer/octicons`](https://www.npmjs.com/package/@primer/octicons).

## Install

```bash
npm install marked-github-alerts
```

## Usage

```js
import { Marked } from "marked";
import { markedGithubAlerts } from "marked-github-alerts";
import "marked-github-alerts/styles.css";

const marked = new Marked();
marked.use(markedGithubAlerts());

const html = marked.parse("> [!WARNING]\n> Back up your data.");
```

## Options

```js
marked.use(
  markedGithubAlerts({
    // add or override alert configs
    alerts: {
      fact: { title: "Fact", icon: "beaker" },
    },

    // quick title overrides
    titles: {
      note: "Heads up",
    },

    // quick icon overrides: octicon name, raw HTML/SVG, false, or function
    icons: {
      tip: "zap",
      warning: false,
      important: '<span class="my-alert-icon" aria-hidden="true">❗</span>',
    },

    // passed to octicon.toSVG
    iconOptions: {
      width: 16,
      height: 16,
    },
  }),
);
```

## Styles

`styles.css` is optional and includes:

- base alert layout
- GitHub-like light and dark colors
- `prefers-color-scheme` support
- manual overrides via `.marked-github-alert-theme-light` / `.marked-github-alert-theme-dark`

Colors reference [Primer primitives](https://primer.style/primitives/) variables (`--fgColor-accent`, `--fgColor-danger`, ...) with GitHub hex fallbacks. If your page loads Primer's theme CSS (e.g. from [`@primer/primitives`](https://www.npmjs.com/package/@primer/primitives)), alerts pick up your theme automatically — no extra wiring needed.

## License

MIT
