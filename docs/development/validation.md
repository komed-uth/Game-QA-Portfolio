# Validation and publishing

## Rendered portfolio checks

From the repository root:

```sh
npm ci
npx playwright install chromium
npm run build
npm run check:overlays
npm run check:preview
npm run check:browser
```

The preview check runs the overlay-data parser tests and holds a port open and verifies that startup rejects it without probing the existing server. The browser command starts an isolated Vite production preview on a port allocated by the operating system, runs the visitor-facing checks, and closes its browser and preview on success or failure. Readiness requires the spawned Vite process's own listening confirmation; another server on that port cannot satisfy it. Each owned preview exposes its confirmed URL to the runner; independent check runs can coexist. Build first so the checks inspect current source. Set `PORTFOLIO_URL` to check an already running preview instead. Set `BROWSER_CHANNEL=msedge` to use installed Microsoft Edge; the default is Playwright Chromium.

The pull-request workflow runs the build and these checks on Linux. It installs Chromium and its OS dependencies. The standalone scripts cover gameplay preview browsing/selection, screenshot opening/navigation, swipes, all six reports, scroll memory, dismissal, focus, 44px gallery actions, exit/reduced-motion animations and ten responsive viewports.

Gameplay checks cover both showcases at ten viewports, keyboard focus without selection, main-photo swipe direction, player identity, native touch and mouse dragging, horizontal wheel input, visible scrollbar dragging, and finite strip controls. Headless checks retain visible scrollbars so their thumb is actually exercised. Representative empty, single-item, and long media lists are built in memory and served only to isolated test contexts; production content is unchanged.

Before browser startup, overlay readiness inspects every supplied local HTML report's embedded `meerkatData` JSON. Empty screenshot path lists print an explicit `SKIP` for real capture overlay checks; missing or malformed report data fails. Non-empty lists indicate available path data, without claiming the files exist or their interaction passed. `npm run check:overlays` runs this inspection and its parser checks without a browser. Charts, chart tooltips, toggles, documentation tabs, iframe link-focused dismissal, all six original tabs, and report layouts across ten viewports are checked with the supplied reports. External documentation responses are stubbed; destination URLs and modal behavior are verified. Overall is also checked for two-axis position restoration after immediate dismissal. Viewport checks are not physical-device certification.

## Synchronize history before implementation

Before editing, identify the intended remote and branch from the task and the checkout's upstream. Use that branch explicitly; it may differ from `main`. Inspect local changes, fetch the remote, and compare ancestry and patch equivalence:

```sh
git status --short --branch
git remote -v
git branch -vv
git fetch <remote>
git log --left-right --cherry-mark --oneline HEAD...<remote>/<branch>
git rev-list --left-right --count HEAD...<remote>/<branch>
```

Preserve uncommitted work before changing history. When behind with no local commits, fast-forward with `git merge --ff-only <remote>/<branch>`. When histories diverge, inspect the local-only commits and use the fetched remote history as the base, replaying only genuinely unpublished changes. `=` in the cherry-mark output identifies equivalent patches with different SHAs; retain the published commits instead of merging duplicate local copies. Preserve local commits on a backup branch before replacing their history, and preserve uncommitted files separately. Avoid hard resets and force pushes as routine synchronization.

Implementation starts only when the intended remote tip is an ancestor of `HEAD` (`git merge-base --is-ancestor <remote>/<branch> HEAD` succeeds) and all remaining local-only commits are understood as unpublished work. If fetching fails, report that synchronization is blocked before implementing.

## After connector-created commits

A connector can publish equivalent changes with different commit SHAs. Record its returned SHA, fetch the intended branch again, and verify that the published SHA is reachable from the fetched branch. Synchronize the local checkout onto that published history using the procedure above before further edits or a local push. Compare the resulting file tree with the tested source; revalidate if the content changed.

Completion requires the published SHA to be an ancestor of local `HEAD`, with only intentionally unpublished work remaining. If all task changes were published, local `HEAD` must equal the fetched branch tip. Confirm this using `git rev-parse HEAD <remote>/<branch>` and the left/right history checks above. Verify again after any later connector write.

## Publishing readiness

Fetch and repeat the history checks above immediately before publishing so intervening remote commits are included.

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

## Focused report checks and overlay fixture

Run `npm run check:reports` for report interactions and the synthetic overlay fixture using the same runner as the full suite. The runner also accepts `node scripts/check-browser.mjs --reports-only`. `npm run check:browser` remains the complete suite and is the CI default. Unknown arguments fail before preview/browser startup.

The synthetic fixture is routed into the existing Very High report in an isolated browser context. It supplies screenshot metadata and a clearly labeled SVG image, then exercises the real chart's middle-click image gesture, image loading, report-owned close/backdrop, portfolio modal retention, and iframe Escape. Its output explicitly identifies fixture coverage. Original HTML reports and capture evidence are unchanged; real capture certification still needs populated screenshot paths and their actual image files.

In complete/report runs, readiness inspects the local supplied report data, including when `PORTFOLIO_URL` selects an external preview. It does not attest to the data or assets on that remote site.

## Workstation GitHub CLI

GitHub CLI is installed persistently through WinGet for this Windows user (`GitHub.cli`, user scope). WinGet manages its `gh` alias and user PATH entry. Fresh shells use `gh` directly; an already-running desktop app may need reopening to inherit the updated PATH. Existing keyring authentication is reused. Check identity with `gh api user --jq .login` without exposing credentials.

## Focused gameplay checks

Run `npm run check:gameplay` (or `node scripts/check-browser.mjs --gameplay-only`) for both gameplay showcases and the temporary empty/single/long portfolio lists. Gameplay checks exercise the ten-viewport matrix in normal and reduced motion, including rapid focus/selection and pointer interruption of scrolling. The complete suite remains the CI default. Focus selectors are mutually exclusive; invalid combinations fail before preview/browser startup.

## Workstation search tooling

Ripgrep is installed persistently through WinGet for this Windows user (`BurntSushi.ripgrep.MSVC`, user scope). Fresh shells use `rg` through WinGet’s managed alias and user PATH. An already-running desktop app may need reopening to inherit the updated PATH. Verify with `rg --version`.
