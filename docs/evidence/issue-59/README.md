# Ticket #59 implementation and acceptance evidence

The Collectors and MeowMoney follow Invictus: Lost Soul as complete placeholder project showcases. Each has a clearly identified placeholder overview, explicit `[to confirm]` role/responsibilities/platforms/tools, a distinct accent (teal and amber), and five durable designed SVG panels. Each panel carries its exact project name and a visible Mock image label. No project facts, gameplay claims, videos, store destinations, reports, or measurements were invented.

The existing shared presentation, gallery, preview strip, photo lifecycle, slideshow and evidence modal are reused without changing their interaction logic. Editable details and ordered media mappings remain centralized in `src/placeholderProjects.ts`.

## Integration and authorization

The user explicitly requested implementation, post-implementation testing, review, branch push and a PR to main on 2026-10-11. This supersedes the historical implementation hold in #57/#59. Website deployment remains separately held.

The isolated checkout starts from fetched main `7b018f932cf950f0c47e7bd3dde4ca4c370f59a7`. Prerequisite #58 was initially integrated from PR #65 at `6026ccd`. While validation ran, main merged #65 as `ce8c6d1328d584ed6e4e256f6d539f5365220442`; this branch then synchronized with that main in `4aa15bc` without changing any files. This task did not merge the PR. The original checkout's unrelated changes are preserved. After the forced workstation restart, main advanced to `a95c3fc` with report-validation tooling from #70 and was integrated cleanly. It changes no application source or mock assets. Final review compares against fixed main `a95c3fc`, showing only #59 changes. The file trees of `309a2e7` and the synchronized `4aa15bc` are identical (`5b0bc1c1d546a8de3d9535cf8e7fd6e86c666cd7`); validation inputs did not change during the merge.

## Rendered views

| Project | Desktop | Phone | Phone modal |
| --- | --- | --- | --- |
| The Collectors | [Details beside media](the-collectors-desktop.png) | [Title, gallery, details](the-collectors-mobile.png) | [Complete mock panel](the-collectors-modal.png) |
| MeowMoney | [Details beside media](meowmoney-desktop.png) | [Title, gallery, details](meowmoney-mobile.png) | [Complete mock panel](meowmoney-modal.png) |

Representative renders show readable project names and mock labels. Browser checks also decode every asset and inspect complete main-image and modal framing.

## Validation

Production/type-check build passed. Preview checks passed 51/51; browser-runner checks passed 71/71. The focused three-gallery suite passed in 329.20 seconds (`.scratch/browser-runs/run-CCPUtm`). The first full run (`run-gKjpfM`) was interrupted by the usage/session limit after eight completed checks; its last checkpoint remains running without a final summary and is incomplete evidence, not a suite pass. A fresh full run (`run-9PRXQ9`) passed the complete fifteen-panel/three-gallery check in 288.11 seconds before a forced workstation restart interrupted the slideshow check. It also has no final summary and is incomplete evidence. Final complete validation uses the pull request's Linux CI, which survives workstation restarts and includes the integrated #70 report-layout check (ten browser checks total). Consult the PR Evidence section and linked CI run for the authoritative final result; partial local runs are not represented as complete passes.

The rendered homepage checks exercise all fifteen panels, every thumbnail/modal, exact names/order, placeholder fields, first-image selection, named controls and unique regions, focus restoration, keyboard browsing/focus containment, mouse/native touch browsing and photo swipes, vertical scrolling, loading/failure/Retry, published 6.5-second progression/wrap, hover/focus/modal/offscreen/hidden-page suspensions, live reduced motion, route reset, and selection/report regressions. Independent selection, modal navigation and slideshow countdowns are checked with each of the three galleries acting in turn.

Each gallery is inspected in normal and reduced motion at eleven viewports: 360x840, 390x845, 845x390, 840x360, 800x1200, 1200x800, 899x700, 900x700, 901x700, 1366x768 and 1920x1080. A tall viewport is used solely to keep all galleries eligible simultaneously during independent-timer assertions.

Two test setup corrections were necessary. An initial assertion treated ordinary visible-neighbor slideshow advancement as interference; stable selection independence now uses reduced motion, while timer independence uses the paused clock. The delayed-image route holds the reload load event, so its release now waits for load/scroll restoration before placing the gallery for dwell measurement. Failure diagnostics confirmed a ready, correctly suspended offscreen gallery. No gallery application logic changed for these corrections.

## Standards

Independent GPT-6.1 Sol high-effort review against fixed main: no documented-standard violations. An initial optional observation concerned repeated selectors inherited from #58. After #65 merged into main, the reviewer confirmed those hunks are absent from the #59 diff and withdrew that observation from this ticket's findings. Standards review against `ce8c6d1`: zero findings; the refreshed #70 integration is also reviewed against `a95c3fc`.

## Spec

Independent GPT-6.1 Sol high-effort review against #59/#57: no actionable product findings. The delayed-load prerequisite correction and final three-project validation documentation were separately reviewed with no findings. Final complete validation is recorded in the pull request Evidence section with its CI run.

Findings: Standards 0; Spec 0 actionable findings.

## Limits and merge risk

Supplied report HTML has empty screenshot path lists; real report-capture overlays are explicitly skipped. Synthetic report overlays verify integration without certifying real capture evidence. Browser viewports, native touch emulation, and controlled visibility events do not certify physical devices or actual background-tab scheduling. Verified project facts and media still await owner input.

Door: two-way. Blast radius: gallery. Reverting removes the new placeholders and assets; there is no migration, backend, editing interface, or website deployment. Prerequisite #65 is now merged into main; this PR contains only #59 additions.