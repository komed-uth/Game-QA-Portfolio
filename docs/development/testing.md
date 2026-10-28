# Testing reference

[Task index](validation.md).

## Skills and legacy links

After building current source, run `node scripts/check-browser.mjs --skills-only` for the rendered Skills and ticket #77 content checks. It uses the existing preview, diagnostics, and recorded-run workflow and is also included in `npm run check:browser`. It checks the exact owner-approved capabilities/tools copy and section order (QA capabilities, then Tools); absent Interests and development, workflow, draft labels and Skills coverage; absence of the removed planned coverage on Portfolio, Skills, About me, legacy and fallback routes; normal separation after the Regulus Skills evidence link; direct links, reload, back/forward, the legacy `#/about` redirect, title/active navigation, all four capability/tool evidence links, Android report and PIX inspection, keyboard navigation, skip link, page-change scroll, and eleven narrow/wide layouts. It retains 1366px and 360px Skills screenshots in `.scratch/issue77-visuals/` and captures the Regulus-to-next-showcase transition in `.scratch/issue88-visuals/` for visual review. Coverage screenshots are no longer captured.

The Android-report and PIX evidence links focus and reveal the corresponding Skills evidence row; no new evidence viewer is introduced. **Authorization snapshot (2026-10-12):** the owner authorized implementation, testing, push, and PR for #77 and confirmed Project Regulus as the planned coverage's project. That instruction did not include merge or deployment. See [#77](https://github.com/komed-uth/Game-QA-Portfolio/issues/77) and [#88](https://github.com/komed-uth/Game-QA-Portfolio/issues/88) for current tracker state and superseding scope. The issue-77 validation file records historical acceptance and review evidence; #88 supersedes planned-coverage retention and placement, with current implementation evidence in the issue-88 validation file.

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

The pull-request workflow runs the build and these checks on Linux. It installs Chromium and its OS dependencies. The standalone scripts cover gameplay preview browsing/selection, screenshot opening/navigation, swipes, both performance images, the retained Very High report, scroll memory, dismissal, focus, 44px gallery actions, exit/reduced-motion animations and ten responsive viewports.

Gameplay photo checks verify visible 300ms ease-in/out overlap and completion in all shared galleries, complete framing without zoom, retained backdrops during delayed loading/decoding or failure, Retry and original-file access, stale decode/transition results, interrupted fade continuity, latest selection, video cancellation, active-media reselection, and modal opener restoration after an interrupted fade. Loading and transitions block photo opening; reduced motion skips fades. Gameplay checks cover both showcases at ten viewports, keyboard focus without selection, main-photo swipe direction, player identity, native touch and mouse dragging, horizontal wheel input, visible scrollbar dragging, and finite strip scrolling. All five galleries are checked for absent preview arrows and compact spacing. Headless checks retain visible scrollbars so their thumb is actually exercised. Representative empty, single-item, and long media lists are built in memory and served only to isolated test contexts; production content is unchanged.

Before browser startup, overlay readiness inspects every supplied local HTML report's embedded `meerkatData` JSON. Empty screenshot path lists print an explicit `SKIP` for real capture overlay checks; missing or malformed report data fails. Non-empty lists indicate available path data, without claiming the files exist or their interaction passed. `npm run check:overlays` runs this inspection and its parser checks without a browser. Charts, chart tooltips, toggles, documentation tabs, iframe link-focused dismissal, the original Very High HTML tab, and report layouts across eleven viewports are checked with the retained report. External documentation responses are stubbed; destination URLs and modal behavior are verified. Very High retains visit-local inspection position and resets after reload. Viewport checks are not physical-device certification.

## Focused report checks and overlay fixture

Use `npm run check:report-layout` (or `node scripts/check-browser.mjs --report-layout-only`) for quick feedback after report layout changes. Build current source first. It checks both ordered Skills rows, the exact 1196 by 735 Regulus screenshot, Portfolio project links, absence of six choices, eleven viewports including both sides of the inclusive 900px boundary, desktop/mobile reading order, complete image framing, 44px controls and overflow. It opens both local images with the keyboard and checks originals, background locking and focus restoration; it does not load the HTML report or inspect its charts, capture overlays or position memory.

Run `npm run check:reports` for report interactions and the synthetic overlay fixture using the same runner as the full suite. The runner also accepts `node scripts/check-browser.mjs --reports-only`. `npm run check:browser` remains the complete suite and is the CI default. Unknown arguments fail before preview/browser startup.

The complete and focused report suites run the quick layout check as well as interactive inspection of the retained Very High report across the viewport matrix. During layout iteration use the quick command, then run the complete suite once after the final source change. All selectors are mutually exclusive. Keep validation inputs unchanged during a run.

The synthetic fixture is routed into the existing Very High report in an isolated browser context. It supplies screenshot metadata and a clearly labeled SVG image, then exercises the real chart's middle-click image gesture, image loading, report-owned close/backdrop, portfolio modal retention, and iframe Escape. Its output explicitly identifies fixture coverage. Original HTML reports and capture evidence are unchanged; real capture certification still needs populated screenshot paths and their actual image files.

In complete/report runs, readiness inspects the local supplied report data, including when `PORTFOLIO_URL` selects an external preview. It does not attest to the data or assets on that remote site.

## Focused gameplay checks

Run `npm run check:gameplay` (or `node scripts/check-browser.mjs --gameplay-only`) for both gameplay showcases and the temporary empty/single/long portfolio lists. Gameplay checks exercise the ten-viewport matrix in normal and reduced motion, including rapid focus/selection and pointer interruption of scrolling. The complete suite remains the CI default. Focus selectors are mutually exclusive; invalid combinations fail before preview/browser startup.

For a smaller affected scope after building current source:

| Command | Direct selector | Scope |
| --- | --- | --- |
| `npm run check:video` | `--video-only` | Existing controlled YouTube completion and transition checks. This fixture does not certify live provider availability. |
| `npm run check:gameplay-layout` | `--gameplay-layout-only` | Shared gameplay layout assertions, responsive framing, absent caption/slideshow actions and usable remaining action targets. |
| `npm run check:gallery-keyboard` | `--gallery-keyboard-only` | Existing showcase resize and keyboard scenario: visible focus, preview traversal, modal focus return and selection continuity. |

Direct selectors use `node scripts/check-browser.mjs <selector>`. They share the complete suite's assertions, preview ownership/cleanup, failure artifacts, input fingerprints and terminal summaries. Their output names the selected scope; a focused pass is not complete portfolio validation. Existing complete-suite groups, including Skills and About me, remain required. Follow the implementation/review/publishing order above: affected focused checks first, fixed-point review next, then complete validation against stable inputs.

Native-touch preparation uses `scripts/browser/native-scroll.mjs` at actual native-scroll callers. It bounds settling and ends native scrolling through a verified noninteractive region while asserting no dialog opened. The scenario still performs its own separate activation and real-dialog assertion. Diagnose touch failures with the short rendered reproduction described in the [#27 evidence](../evidence/issue-27/validation.md); extra delay alone is not a fix.

## Gameplay photo progression

Regulus the Advent and Father, Son & Holy Guns advance fully displayed photos after five seconds. All six project showcases omit slideshow controls entirely under #125, including hover/focus actions and tab stops. Each video visit requests muted playback from the beginning through the official YouTube IFrame API on the privacy-enhanced embed; natural completion advances once, or waits until every temporary suspension reason clears. Replay and manual selection cancel deferred completion. Loading, failure, hover, keyboard focus, dragging, offscreen/hidden state and modal inspection suspend progression. Resumption gives photos a fresh full interval and never restarts selected video. Reduced motion keeps progression manual and cancels active progression when enabled during a visit. That suspension remains latched for the mounted visit even if the preference is later disabled; manual photo transitions remain immediate while reduced motion is enabled. Image-only placeholder showcases retain 6.5-second dwell and their existing interface. Video has no timer-based skip. Mixed-media changes wait for playback or decoded photos, then use the shared 300ms overlap. Blocked autoplay reveals native Play; eight seconds after the latest video selection or Retry, a usable player is revealed or an error with Retry appears. Outgoing videos keep playing through their visible fade and are released afterwards.

The complete and focused gameplay suites include rendered slideshow checks with Playwright's paused browser clock; readiness polling advances render frames while dwell assertions use controlled time. They exercise both photo sequences, manual interval reset, active reselection, independent timers, slow loading beyond one dwell, failure/Retry, combined hover/focus and visibility reasons, pointer release outside the gallery, native touch panning through pointer cancellation until actual finger release, offscreen/resumption, native modal close, reduced motion, and route reset. Hidden-tab event handling uses controlled document visibility in the rendered browser; it is not physical background-tab/device certification. Existing checks retain real mouse/touch browsing, scrollbar dragging, ten responsive viewports, photo fades, and representative list fixtures. Third-party autoplay remains subject to the browser/provider.

## Focused photo and evidence checks

Run `npm run check:photos` for the manual photo lifecycle in both gameplay showcases. Run `npm run check:evidence` for image/report evidence inspection and its interaction checks. These use `--photos-only` and `--evidence-only` in the same runner as the complete suite; selectors remain mutually exclusive. `npm run check:browser` remains the CI default.

## Browser-run diagnostics

Every check prints START, then checks input stability before reporting PASS/FAIL with elapsed time. Failed checks save `trace.zip`, `failure.json`, and a viewport `screenshot.png` beneath a unique `.scratch/browser-checks/<check>-.../` directory before the runner closes its browser context. Diagnostics include the named check and assertion scenario, page URL, focused element, selected gameplay media, photo phase/readiness and load dimensions, DOM hover/focus, document visibility, viewport/scroll position, and gallery bounds/intersection. These are observable browser snapshots, not internal timer or suspension-state probes. Screenshot or page-state collection failures are recorded in the JSON while the original assertion and trace are preserved. Successful traces are discarded. The runner and temporary mobile/fixture contexts share failure capture through `withBrowserContext`. The saved trace and page diagnostics come from the innermost failing context before it closes; propagated errors keep that evidence. Artifact-write failures are reported while preserving the original assertion.

Open a saved trace with `npx playwright show-trace <path-to-trace.zip>`. The PR workflow uploads run summaries/logs and any browser failure evidence with seven-day retention, including successful runs. Both `.scratch/browser-runs/` and `.scratch/browser-checks/` are Git-ignored.

Report checks emit PROGRESS checkpoints with elapsed time and current viewport/report/opener context. These identify work in progress, not passing assertions. Failure JSON records the last checkpoint plus the observable selected quality, output/opener names, modal title and iframe source. Other checks retain their existing diagnostics. Input-stability validation still controls the final PASS/FAIL result.

Every browser command prints `RUN EVIDENCE` with a unique `.scratch/browser-runs/run-.../` directory. `output.log` preserves streamed standard output and errors. `progress.jsonl` appends snapshots as the worker reports progress; each complete line is a JSON checkpoint. On completion, `summary.json` is created atomically. Both record the selected suite/checks, starting commit and tracked-change flag, a fingerprint of the validation inputs, check durations/results, and status. The commit identifies history; the fingerprint also identifies uncommitted source and built inputs. External preview runs fingerprint local inputs only.

`passed` requires every selected check and the final input-stability gate to succeed. `failed`, `obsolete`, `interrupted`, and `incomplete` are unsuccessful outcomes. A `running` checkpoint without final completion is unfinished evidence, including after forced termination; individual check passes do not establish a suite pass. Read `summary.json` after a terminal/session interruption; when it is absent, inspect the last complete JSON line in `progress.jsonl`, ignoring any partial final line. Normal interruption requests worker cleanup; abrupt termination may leave only its last checkpoint. Append-only progress avoids replacing a file while a Windows reader has it open.

`npm run check:runner` verifies selector routing, invalid arguments before startup, real Playwright trace capture, failure cleanup, edit detection, persisted subprocess results/interruption and repeatable report generation. It also checks gallery action targets in the rendered production portfolio while photo/video changes add or remove controls, and verifies that zero-sized and undersized visible actions still fail. Build current source before running the runner checks; CI runs them after building and installing Chromium.

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
      selectors: ['#android-reports', '#pix-capture'],
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

The complete and focused gameplay suites include a controlled YouTube provider boundary in the rendered production portfolio. It checks both repeating sequences, API origin/privacy configuration, muted playback requests, no skip for incomplete/paused/buffering/blocked/error states, hover/focus/touch/visibility/offscreen deferral, replay before and after callbacks, manual override, manual reduced-motion selection/replay, teardown-generated completion, route reset and player independence. The controlled player boundary also verifies both video/photo overlap directions, playback/decode readiness, manual Play, exact eight-second usable/unavailable fallbacks, failure/Retry, interrupted fades, stale events and cleanup in desktop/mobile motion modes. A hung API request is bounded and Retry fetches again. This fixture verifies application behavior; it does not certify provider playback.

After building, run `node scripts/browser/check-youtube-live.mjs` to check both actual embeds. It uses the official player methods to seek near the end, observes genuine completion during keyboard inspection, replays from the beginning, clears inspection without replacing replay, and observes a later eligible completion advance to the first photo. It writes `.scratch/real-video-evidence.json` and exits nonzero if either embed fails those checks. This is an explicit network-dependent verification, outside deterministic CI; provider availability and autoplay remain subject to the browser/YouTube.

## Focused About me checks

After building, run `node scripts/check-browser.mjs --about-me-only` for the exact #77 approved biography, absence of drafts/gaming anecdote/optional assets, LinkedIn activation, direct/reload/history navigation, legacy QA approach redirect, skip link, keyboard focus, scroll reset, and eleven responsive widths. This check also runs in the complete suite. It saves full-page 390px and 1366px captures under `.scratch/issue77-visuals/` for visual review. LinkedIn is intercepted at the external boundary to verify the destination and new-tab activation without relying on provider availability.

All page copy, projects, media references, shared evidence and site content are editable in `src/data.ts`. Biography copy uses `aboutMePage`; the shared contact destination uses `siteContent.contact.destination`. `npm run check:content-workflow` exercises edits to this single file through validation, builds, live updates and rendered pages. Run it sequentially: it temporarily edits content and restores the original file and production build. Browser checks compare rendered wording with the owner-approved issue copy; they do not independently certify personal experience or grant deployment permission.

## Slideshow control removal

Under [#125](https://github.com/komed-uth/Game-QA-Portfolio/issues/125), `check:slideshow` verifies all six project showcases have no slideshow action (including hidden accessible controls), no added tab stop, and only the normal 12px preview-strip gap. It covers initial video/photo presentation, hover, keyboard focus, desktop/tablet/phone widths, and native touch selection in both motion modes. Normal motion retains five-second video-showcase photo dwell and 6.5-second image-only dwell; reduced motion remains manual. The existing photo/video, inspection, overlapping-suspension, responsive and empty/single/long-list checks remain in the complete suite.
