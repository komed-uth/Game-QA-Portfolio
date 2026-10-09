# Ticket #22 validation

Implementation authorized by the user on 2026-10-09. Base: `ee91402ed21d86be8da12ba061479aed818b499b` (fetched `origin/main`). Ticket: [#22](https://github.com/komed-uth/Game-QA-Portfolio/issues/22); parent specification: [#20](https://github.com/komed-uth/Game-QA-Portfolio/issues/20). Image-modal dependency #21 is complete.

The compact report preview and shared modal were already on main. This change saves Overall's horizontal and vertical inspection coordinates when dismissal begins, matching the HTML reports' explicit close-time save. It also completes report-focused checks in the existing rendered browser runner.

## Evidence

- `npm ci`: installed locked dependencies in an isolated checkout.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; TypeScript and Vite production build.
- Focused rendered report checks: passed in headless Microsoft Edge using Playwright.
- All six choices: selection stays on the page, correct preview labels and full content, Very High default, correct original-file links and actual separate browser tabs including Overall.
- All five HTML reports: charts render, pointer hover displays chart tooltips, toggles open and close, documentation links open actual tabs (remote documentation response stubbed), inside interactions retain the portfolio modal, and portfolio scrolling stays locked.
- Focus: Shift+Tab exits the first report link to Close; Tab exits the last report link to Open original and wraps to Close; Escape from a focused report link dismisses and restores the opener and portfolio position.
- Overall: scroll both axes at phone width and close immediately with reduced motion; reopening after inspecting another report restores both coordinates.
- Reload resets all six report positions and restores Very High as default. Existing evidence-modal checks exercise independent HTML scroll restoration.
- Every report at 1920x1080, 1366x768, 390x845, 845x390, 360x840, 840x360, 1200x800, 800x1200, 899x700, and 901x700: desktop/narrow report control ordering, outside margins, internal content space, readable HTML text/Overall image, 44px modal controls, and no portfolio horizontal overflow.
- No new test harness, dependencies, deployment, or evidence-file changes. Unrelated original-workspace edits remain outside this branch.

## Limits

The supplied reports contain empty high-resolution screenshot path lists. Their chart-to-image overlay path cannot be certified end to end with the supplied data; the original report scripts remain intact. Documentation-tab tests validate their destination and portfolio behavior using a stubbed response, not the availability of the external website. Viewport checks are not physical-device certification.
