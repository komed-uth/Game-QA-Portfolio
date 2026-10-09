# Retrospective follow-up validation (#33)

Base: `15a1ebffe0e4f618f1fa342ee423b22012209a55` (fetched main). Work is isolated from the original checkout's unrelated edits.

## Changes

- Overlay readiness parses every supplied report's embedded `meerkatData` before preview/browser startup. Empty screenshot path lists print one real-overlay `SKIP` per report. Missing/malformed data fails; non-empty lists indicate path data only, without claiming file availability or certification.
- A test-only route supplies a clearly labeled synthetic SVG and screenshot metadata to the existing Very High report generator. Browser checks use the actual chart middle-click gesture, decode the resulting overlay image, and verify report-owned dismissal and portfolio-modal behavior. Original captures and published reports are unchanged.
- `npm run check:reports` (or `node scripts/check-browser.mjs --reports-only`) runs report checks plus the overlay fixture. `npm run check:browser` retains all existing checks and adds the fixture. Unknown arguments fail before startup.
- Owned previews bind port 0 and expose their own confirmed URL. Explicit-port rejection remains strict; concurrent owned previews allocate distinct listening ports.
- WinGet installed `GitHub.cli` 2.102.0 permanently for the Windows user, verified the package hash, and registered its alias/user PATH. `gh --version` and `gh api user --jq .login` succeed through the persistent alias; identity is `komed-uth`. Existing desktop processes may need reopening to inherit the updated user PATH.

## Checks

- `npm run check:overlays`: three parser/readiness tests passed; all five real report lists print `SKIP`, and fixture coverage is labeled separately.
- `npm run build`: passed TypeScript and production build.
- `npm run check:preview`: both occupied-port rejection and concurrent preview allocation checks passed.
- `node scripts/check-browser.mjs --unknown`: exits with usage error before readiness, preview, or browser startup.

## Limits

Synthetic fixture coverage verifies report/modal integration. Real capture certification still requires populated screenshot paths and the corresponding original image files. Readiness inspects local supplied evidence, including with `PORTFOLIO_URL`; it does not certify remote preview assets. The workstation CLI installation is local setup, not software distributed by this repository.

## Rendered results and review

- `BROWSER_CHANNEL=msedge npm run check:reports`: passed the synthetic overlay fixture and all report checks, including all six choices across ten viewports, original tabs, iframe keyboard behavior, and position/reset behavior.
- `BROWSER_CHANNEL=msedge npm run check:browser`: passed the complete portfolio suite, including existing image/gallery/video-selection, touch, focus, dismissal, scroll, transition and responsive checks, plus the synthetic overlay and report checks.
- The focused and complete runs coexisted on confirmed owned preview URLs at ports 62801 and 62909. Their logs identified the selected suite and printed all five real-overlay skips before browser startup.
- Self-review against the user request: full CI default retained; no production/evidence-file changes or new harness/dependencies; local-data readiness and synthetic coverage clearly separated; persistent CLI setup verified. Fixture backdrop checks follow image inspection, which exits native middle-button autoscroll before dismissal.

The existing GitHub workflow is retained: its `check:preview` command also runs the overlay-data parser tests, and its default `check:browser` performs readiness before browser startup. Publishing does not require a workflow-file edit or additional token scopes.

## PR #34 review follow-up

The optional P3 duplicated-matching concern at reviewed head `46a8085b7a2f0de7122ccbc4fa338cef5ac631f9` is resolved: `report-overlay-data.mjs` owns one script-matching expression and the replacement helper; the fixture calls that helper. Replacement validates the original JSON, retaining missing/malformed-data failures, and preserves script tags and all surrounding report HTML.

Validation: `npm run check:overlays` passed five parser/replacement checks and retained all five real-capture skips; `npm run check:preview` passed all seven parser/preview checks; `npm run build` passed TypeScript and production build; `BROWSER_CHANNEL=msedge npm run check:reports` passed the synthetic overlay and all six reports across ten viewports. Capture evidence, fixture labeling, focused selection, and complete-suite defaults are unchanged. The review's skill-setup note is outside this focused revision.
