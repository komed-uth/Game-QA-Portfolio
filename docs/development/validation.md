# Validation and publishing

## Rendered portfolio checks

From the repository root:

```sh
npm ci
npx playwright install chromium
npm run build
npm run check:preview
npm run check:browser
```

The preview-startup check holds a port open and verifies that startup rejects it without probing the existing server. The browser command starts an isolated Vite production preview on port 4175, runs the visitor-facing checks, and closes its browser and preview on success or failure. Readiness requires the spawned Vite process's own listening confirmation; another server on that port cannot satisfy it. Build first so the checks inspect current source. Set `PORTFOLIO_URL` to check an already running preview instead. Set `BROWSER_CHANNEL=msedge` to use installed Microsoft Edge; the default is Playwright Chromium.

The pull-request workflow runs the build and these checks on Linux. It installs Chromium and its OS dependencies. The standalone scripts cover screenshot opening/navigation, swipes, all six reports, scroll memory, dismissal, focus, 44px gallery actions, exit/reduced-motion animations and ten responsive viewports.

Report-owned high-resolution image overlays reference files outside the supplied evidence. Their full path needs those fixtures before it can be certified. Charts, chart tooltips, toggles, documentation tabs, iframe link-focused dismissal, all six original tabs, and report layouts across ten viewports are checked with the supplied reports. External documentation responses are stubbed; destination URLs and modal behavior are verified. Overall is also checked for two-axis position restoration after immediate dismissal. Viewport checks are not physical-device certification.

## Publishing readiness

Inspect the branch and remote history before publishing:

```sh
git status --short
git remote -v
git fetch origin
git log --left-right --oneline origin/main...HEAD
```

Stage explicit task files so unrelated local changes stay outside the commit. Check the active account through GitHub CLI when available or the connected GitHub profile before writing remotely. The repository owner is `komed-uth`; this workstation's Git credential previously authenticated as `komeduth` and was denied write access. Use the owner-authenticated connector when Git authentication is unavailable. Credential setup belongs to the account owner; never print stored credentials.

When transplanting commits onto remote history, compare the resulting file tree with the tested source before updating the ref. Preserve the remote head using an expected-SHA check. Verify the published head and PR file list afterwards.

## Host runtime failures

This session's sandbox failed before commands and browser-control tools started, with `helper_unknown_error: setup refresh had errors`. Commands worked through approved escalated execution. Repository changes cannot repair that host startup failure; diagnose the host runtime separately. Use approved tool execution without changing sandbox protections.

## Searching generated reports

Report HTML contains long embedded data and minified scripts. Keep search output bounded:

```sh
rg -n --max-columns 200 --max-columns-preview 'pattern' 'public/Performance-Testing-Mobile/Full Report'
```

Read a small excerpt around a match instead of printing entire embedded lines.
