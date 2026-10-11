# Ticket #68: Report validation feedback and workstation tooling

Implemented [#68](https://github.com/komed-uth/Game-QA-Portfolio/issues/68) from synchronized main `6109a1b55571e8db97ed8dfd4debc037e61d405d` on 2026-10-11, following the #53 retrospective.

## Result

`npm run check:report-layout` reuses the rendered-browser runner for presentation, all six selected-report contexts, eleven responsive viewports, reading and keyboard order, resizing, wrapping, spacing, control size and focus restoration. It opens the local Overall summary from both entry points. HTML report charts, overlays and inspection-position memory remain in the exhaustive checks. Both checks share the same viewport list, including 899px, exactly 900px and 901px.

The complete CI suite includes the quick layout check and retains exhaustive inspection of all six reports across the same viewport matrix. Progress checkpoints show elapsed time and report/viewport/opener context. Failure artifacts retain the latest checkpoint and observable selected quality, output/opener names, modal title and iframe source, alongside existing trace, nested-context and input-stability safeguards.

`npm run check:workstation` checks Node, Git, ripgrep, GitHub account access and Git metadata write access. It prints the account login only and removes its empty metadata probe directory. It does not install tools or alter history, configuration, credentials or permissions. Existing validation guidance explains approved execution for launcher and protected-metadata failures and keeps synchronization/publishing checks separate.

`captureRegion` waits for fonts, measures the union of caller-selected regions in document coordinates, and captures a full-page clip, including content below the current viewport. Missing or zero-area regions fail clearly. The caller retains cleanup ownership; validation guidance includes a complete temporary capture example.

## Acceptance evidence

- Production/TypeScript build passed after the shared-viewport review fix.
- Workstation preflight passed for Node, Git, ripgrep, GitHub account `komed-uth` and Git metadata write access.
- Runner/selector/input-stability/region-capture/preflight tests passed (68 tests). Preview-startup/selector/report-data tests passed (51 tests).
- Quick report-layout check passed in 7.44 seconds standalone and 4.51 seconds in the final complete suite after the viewport-list fix. The earlier #53 focused report-interactions run took 432.34 seconds; these commands intentionally cover different scopes. Exhaustive coverage remains in the final complete suite.
- An isolated CSS regression restoring controls-before-preview on narrow screens was rejected at 390px with `Narrow report heading immediately precedes the preview`. Diagnostics recorded the latest viewport/report checkpoint; the fixture changed no production inputs.
- Region-capture regression verified a 310 × 230px union at document y=1400 in a 500 × 300px viewport, with the original scroll position and page lifecycle preserved. Invalid-region checks produced no output file.
- Report failure regressions verified progress logs, selected-report/modal/iframe diagnostics, no phase leakage between checks, successful-trace cleanup and preservation of the original failure.
- Complete browser suite passed all nine checks: slideshow, photos, gameplay previews, representative media lists, evidence modals, evidence interactions, report layout, synthetic report overlay and exhaustive report interactions. The final report-interactions check passed in 270.14 seconds, and the run ended with `PASS: rendered portfolio browser checks` with no obsolete-input result.

## Independent review

Sol 6.1 high-effort Standards and Spec reviewers inspected the pinned change from `6109a1b55571e8db97ed8dfd4debc037e61d405d` through `5c61960a1693506a579f4612e8d9e9497d5a3b2c`. An initial low-priority duplicated-viewport concern was fixed by sharing the unchanged list. Both reviewers reported zero remaining findings after the fix.

## Limits and risk

The supplied original HTML reports have empty screenshot path lists. The synthetic overlay fixture checks integration; it does not certify real capture images. Browser viewports are not physical-device certification. GitHub identity access does not prove repository write permission or remote-history freshness.

This is reversible validation tooling and guidance. Product source, original evidence, CI's complete-suite gate and unrelated local work are unchanged.
