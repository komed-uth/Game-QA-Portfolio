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

Gameplay checks also verify 100ms outgoing and 150ms incoming photo fades without zoom, stable delayed/failing loads, Retry and original-file access, stale responses, latest selection, video cancellation, active-media reselection, loading-chain fade-in, and modal opener restoration after an interrupted fade. Loading and transitions block photo opening; reduced motion skips fades. Gameplay checks cover both showcases at ten viewports, keyboard focus without selection, main-photo swipe direction, player identity, native touch and mouse dragging, horizontal wheel input, visible scrollbar dragging, and finite strip scrolling. All five galleries are checked for absent preview arrows and compact spacing. Headless checks retain visible scrollbars so their thumb is actually exercised. Representative empty, single-item, and long media lists are built in memory and served only to isolated test contexts; production content is unchanged.

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

Windows WinGet launchers may also fail with `ResourceUnavailable`, `No application is associated with the specified file`, or access-denied errors even when GitHub CLI and ripgrep are installed. Git fetch can fail separately because `.git/FETCH_HEAD` is protected. Run the preflight once in the intended execution context; for these host failures use approved execution, then retain the working result for the session. Actual missing tools, expired authentication and network failures need their own diagnosis. Keep credentials and permissions under the owner's control.

## Workstation preflight

Run `npm run check:workstation` from the intended checkout before exploration. It needs Node and npm but no installed project dependencies. It checks Git and ripgrep launchers, obtains only the GitHub login through `gh api user`, and verifies Git metadata write access with an empty temporary directory that it removes. It changes no history, configuration, credentials or permissions and installs nothing. A missing capability produces a nonzero exit and a pointer to the execution guidance above. Successful account access confirms identity, not repository write permission or fresh remote history; follow the synchronization and publishing steps separately.

## Bounded tool discovery

Discover matching tool names first, then read the metadata/schema for the one selected tool. Keep descriptions out of inventory output and bound the number of matches; narrow the query when it is still broad. For dynamic tool discovery, project matches to names before printing rather than printing complete tool objects. When a host startup fails with the documented sandbox error, use the approved execution fallback above.

## Searching generated reports

Report HTML contains long embedded data and minified scripts. Keep search output bounded:

```sh
rg -n --max-columns 200 --max-columns-preview 'pattern' 'public/Performance-Testing-Mobile/Full Report'
```

Read a small excerpt around a match instead of printing entire embedded lines.

## Bounded merge inspection

Inspect filenames first when incoming work includes generated HTML or image evidence:

```sh
git diff --name-status HEAD <remote>/<branch>
git diff HEAD <remote>/<branch> -- src scripts package.json .github
git merge-tree --write-tree --name-only HEAD <remote>/<branch>
```

The last command reports the candidate tree and conflict paths (exit 1 means conflicts); it creates Git objects without changing the checkout or refs. Request a text diff for a specific documentation file when needed, and inspect images visually. This keeps generated report data and image contents out of merge-inspection output.

## Focused report checks and overlay fixture

Use `npm run check:report-layout` (or `node scripts/check-browser.mjs --report-layout-only`) for quick feedback after report layout changes. Build current source first. It checks presentation, all six selection contexts, eleven viewports including both sides of the inclusive 900px boundary, resize continuity, reading and keyboard order, wrapping, 44px controls, spacing and overflow. It opens only the local Overall summary to check keyboard opening and focus restoration from both entry points; it does not load the five HTML reports or inspect their charts, capture overlays or position memory.

Run `npm run check:reports` for report interactions and the synthetic overlay fixture using the same runner as the full suite. The runner also accepts `node scripts/check-browser.mjs --reports-only`. `npm run check:browser` remains the complete suite and is the CI default. Unknown arguments fail before preview/browser startup.

The complete and focused report suites run the quick layout check as well as exhaustive inspection of all six reports across the viewport matrix. During layout iteration use the quick command, then run the complete suite once after the final source change. All selectors are mutually exclusive. Keep validation inputs unchanged during a run.

The synthetic fixture is routed into the existing Very High report in an isolated browser context. It supplies screenshot metadata and a clearly labeled SVG image, then exercises the real chart's middle-click image gesture, image loading, report-owned close/backdrop, portfolio modal retention, and iframe Escape. Its output explicitly identifies fixture coverage. Original HTML reports and capture evidence are unchanged; real capture certification still needs populated screenshot paths and their actual image files.

In complete/report runs, readiness inspects the local supplied report data, including when `PORTFOLIO_URL` selects an external preview. It does not attest to the data or assets on that remote site.

## Workstation GitHub CLI

GitHub CLI is installed persistently through WinGet for this Windows user (`GitHub.cli`, user scope). WinGet manages its `gh` alias and user PATH entry. Fresh shells use `gh` directly; an already-running desktop app may need reopening to inherit the updated PATH. Existing keyring authentication is reused. Check identity with `gh api user --jq .login` without exposing credentials.

## Focused gameplay checks

Run `npm run check:gameplay` (or `node scripts/check-browser.mjs --gameplay-only`) for both gameplay showcases and the temporary empty/single/long portfolio lists. Gameplay checks exercise the ten-viewport matrix in normal and reduced motion, including rapid focus/selection and pointer interruption of scrolling. The complete suite remains the CI default. Focus selectors are mutually exclusive; invalid combinations fail before preview/browser startup.

## Workstation search tooling

Ripgrep is installed persistently through WinGet for this Windows user (`BurntSushi.ripgrep.MSVC`, user scope). Fresh shells use `rg` through WinGet’s managed alias and user PATH. An already-running desktop app may need reopening to inherit the updated PATH. Verify with `rg --version`.

## Gameplay photo progression

Regulus the Advent and Father, Son & Holy Guns advance fully displayed photos after five seconds and show independent visit-local Pause slideshow / Resume slideshow controls beside their captions. Each video visit requests muted playback from the beginning through the official YouTube IFrame API on the privacy-enhanced embed; natural completion advances once, or waits until every suspension reason and explicit Pause clears. Replay and manual selection cancel deferred completion. Loading, failure, hover, keyboard focus, dragging, offscreen/hidden state and modal inspection suspend progression. Resumption gives photos a fresh full interval and never restarts selected video. Reduced motion initially pauses progression and cancels active progression when enabled during a visit; explicit Resume permits progression with immediate photo changes. Image-only placeholder showcases retain 6.5-second dwell and their existing interface. Video has no timer-based skip or API-failure fallback.

The complete and focused gameplay suites include rendered slideshow checks with Playwright's paused browser clock; readiness polling advances render frames while dwell assertions use controlled time. They exercise both photo sequences, manual interval reset, active reselection, independent timers, slow loading beyond one dwell, failure/Retry, combined hover/focus and visibility reasons, pointer release outside the gallery, native touch panning through pointer cancellation until actual finger release, offscreen/resumption, native modal close, reduced motion, and route reset. Hidden-tab event handling uses controlled document visibility in the rendered browser; it is not physical background-tab/device certification. Existing checks retain real mouse/touch browsing, scrollbar dragging, ten responsive viewports, photo fades, and representative list fixtures. Third-party autoplay remains subject to the browser/provider.

## Focused photo and evidence checks

Run `npm run check:photos` for the manual photo lifecycle in both gameplay showcases. Run `npm run check:evidence` for image/report evidence inspection and its interaction checks. These use `--photos-only` and `--evidence-only` in the same runner as the complete suite; selectors remain mutually exclusive. `npm run check:browser` remains the CI default.

## Browser-run diagnostics

Every check prints START, then checks input stability before reporting PASS/FAIL with elapsed time. Failed checks save `trace.zip`, `failure.json`, and a viewport `screenshot.png` beneath a unique `.scratch/browser-checks/<check>-.../` directory before the runner closes its browser context. Diagnostics include the named check and assertion scenario, page URL, focused element, selected gameplay media, photo phase/readiness and load dimensions, DOM hover/focus, document visibility, viewport/scroll position, and gallery bounds/intersection. These are observable browser snapshots, not internal timer or suspension-state probes. Screenshot or page-state collection failures are recorded in the JSON while the original assertion and trace are preserved. Successful traces are discarded. The runner and temporary mobile/fixture contexts share failure capture through `withBrowserContext`. The saved trace and page diagnostics come from the innermost failing context before it closes; propagated errors keep that evidence. Artifact-write failures are reported while preserving the original assertion.

Open a saved trace with `npx playwright show-trace <path-to-trace.zip>`. The PR workflow uploads run summaries/logs and any browser failure evidence with seven-day retention, including successful runs. Both `.scratch/browser-runs/` and `.scratch/browser-checks/` are Git-ignored.

Report checks emit PROGRESS checkpoints with elapsed time and current viewport/report/opener context. These identify work in progress, not passing assertions. Failure JSON records the last checkpoint plus the observable selected quality, output/opener names, modal title and iframe source. Other checks retain their existing diagnostics. Input-stability validation still controls the final PASS/FAIL result.

Every browser command prints `RUN EVIDENCE` with a unique `.scratch/browser-runs/run-.../` directory. `output.log` preserves streamed standard output and errors. `progress.jsonl` appends snapshots as the worker reports progress; each complete line is a JSON checkpoint. On completion, `summary.json` is created atomically. Both record the selected suite/checks, starting commit and tracked-change flag, a fingerprint of the validation inputs, check durations/results, and status. The commit identifies history; the fingerprint also identifies uncommitted source and built inputs. External preview runs fingerprint local inputs only.

`passed` requires every selected check and the final input-stability gate to succeed. `failed`, `obsolete`, `interrupted`, and `incomplete` are unsuccessful outcomes. A `running` checkpoint without final completion is unfinished evidence, including after forced termination; individual check passes do not establish a suite pass. Read `summary.json` after a terminal/session interruption; when it is absent, inspect the last complete JSON line in `progress.jsonl`, ignoring any partial final line. Normal interruption requests worker cleanup; abrupt termination may leave only its last checkpoint. Append-only progress avoids replacing a file while a Windows reader has it open.

`npm run check:runner` verifies selector routing, invalid arguments before startup, real Playwright trace capture, failure cleanup, edit detection, persisted subprocess results/interruption and repeatable report generation. CI runs it after installing Chromium.

Generated public report copies use LF endings through `.gitattributes` and report synchronization, so CRLF original checkouts do not create mixed-ending build output. Synchronization skips copies whose output already matches. Original report files are read without modification. Repeated builds should leave generated tracked copies clean.

The same command also verifies report progress isolation and diagnostics, missing-tool preflight behavior, and full-page screenshot clipping below the current viewport.

## Visual-region captures

Reuse `scripts/browser/capture-region.mjs` for visual evidence. `captureRegion(page, { selectors, path })` waits for fonts, measures the union of the requested regions in document coordinates, and uses full-page clipping so content outside the current viewport is captured. Missing or zero-area regions fail clearly. The helper creates the output directory and leaves browser, context, preview and page cleanup with the caller. Capture a freshly built source and wait for any relevant images or animations before calling it.

For a temporary capture script in `.scratch/`, follow the existing cleanup pattern:

```js
import { chromium } from 'playwright';
import { startPreview } from '../scripts/browser/preview-server.mjs';
import { withBrowserContext } from '../scripts/browser/run-browser-check.mjs';
import { captureRegion } from '../scripts/browser/capture-region.mjs';

const server = await startPreview();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  await withBrowserContext(browser, { viewport: { width: 390, height: 845 } }, async context => {
    const page = await context.newPage();
    await page.goto(server.url);
    await captureRegion(page, {
      selectors: ['#report-heading', '.report-output', '.report-controls'],
      path: '.scratch/report-phone.png',
    });
  });
} finally {
  try { await browser?.close(); } finally { server.kill(); }
}
```

Use the same helper for before/after builds; baseline construction remains specific to the ticket. The automated regression checks an offscreen union and invalid regions without starting a production preview.

## Validation input stability

The runner fingerprints source, check scripts, public evidence, the production build, report originals and relevant package/build configuration before loading checks, and compares their contents before each check result and after the run. Changed, added, removed or renamed inputs produce OBSOLETE with the affected paths and a rebuild/rerun instruction. An obsolete assertion remains available as the error cause; an obsolete check emits neither its ordinary PASS nor FAIL, and obsolete runs never print the final portfolio PASS.

Diagnostics, dependencies and documentation are excluded. This is a comparison of starting and ending file contents: timestamp-only changes and edits restored to identical bytes are not detected. Build current source before checking it, and keep validation inputs unchanged until the run completes. With `PORTFOLIO_URL`, this still checks local input stability rather than attesting to remote site contents.

## Focused slideshow checks

Run `npm run check:slideshow` (or `node scripts/check-browser.mjs --slideshow-only`) for slideshow progression and inspection safeguards in both gameplay showcases, including its native-touch scenario. This selects only the slideshow check; it does not build the longer-list fixtures or run the photo, responsive browsing, or report suites. Build current source first. The full `npm run check:browser` suite remains the CI gate, and all focus selectors are mutually exclusive.

## Placeholder project showcases

Run `npm run check:placeholders` for the Invictus: Lost Soul, The Collectors, and MeowMoney image-only showcases. This check is also included in the complete and focused gameplay suites. It verifies placeholder fields, all fifteen local designed panels (five per project), thumbnail selection and browsing, modal wrapping/synchronization/focus, selection, modal, and slideshow independence across all three new galleries, plus existing gallery/report selection independence, keyboard and native touch interactions, vertical page scrolling, and eleven responsive viewports in both motion modes, including 899, 900, and 901px. It uses the published paused-clock readiness utilities for the 6.5-second slideshow, inspection suspension, manual reset, live reduced motion, delayed loading, failure, and Retry checks.

The existing video-and-image regression scenarios remain scoped to Regulus and Father, Son & Holy Guns; image-only behavior has its own rendered-homepage check. SVG label checks confirm project and mock text in the served panels, alongside decoded images and complete framing. Review representative main-image/modal renders for visual acceptance. Mock panels do not certify gameplay evidence, and native-touch browser checks are not physical-device certification. No website deployment is part of tickets #58 or #59.

## Video completion checks

The complete and focused gameplay suites include a controlled YouTube provider boundary in the rendered production portfolio. It checks both repeating sequences, API origin/privacy configuration, muted playback requests, no skip for incomplete/paused/buffering/blocked/error states, hover/focus/touch/visibility/offscreen deferral, replay before and after callbacks, manual override, explicit Pause persistence, reduced-motion Resume, teardown-generated completion, route reset and player independence. This fixture verifies application behavior; it does not certify provider playback.

After building, run `node scripts/browser/check-youtube-live.mjs` to check both actual embeds. It uses the official player methods to seek near the end, observes genuine completion while paused, replays from the beginning, resumes without replacing replay, and observes a later eligible completion advance to the first photo. It writes `.scratch/real-video-evidence.json` and exits nonzero if either embed fails those checks. This is an explicit network-dependent verification, outside deterministic CI; provider availability and autoplay remain subject to the browser/YouTube.
