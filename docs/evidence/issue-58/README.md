# Ticket #58 validation and review

Implemented the Invictus: Lost Soul placeholder project showcase after Vecchio Furioso. The owner's explicit implementation request supersedes the earlier implementation hold in issues #57/#58. Website deployment remains on hold; delivery is a working branch and pull request to main.

The isolated branch started from fetched main `39163a87305127439863b78b2a53e282957ed1ca`. The original checkout's unrelated local work was preserved. Only Invictus is added; The Collectors and MeowMoney remain outside this ticket.

## Rendered evidence

- [Desktop showcase](desktop.png): project details beside the gallery.
- [Phone showcase](mobile.png): title, gallery, then details.
- [Phone evidence modal](mobile-modal.png): complete image with project name and Mock image label.
- [All five panels](panels.png): Orbit, Prism, Waves, Tiles, Arc, in stable order.

All five panels are designed placeholder project content, not gameplay screenshots. Role, responsibilities, platforms, and tools remain explicitly `[to confirm]`. Data and ordered media paths are centralized in `src/placeholderProjects.ts`; the reusable presentation uses the existing shared gallery. Its only application interface adjustment is an optional video identifier for image-only callers.

## Checks

Completed on 2026-10-11 with Playwright Chromium against the production preview:

| Check | Actual result |
| --- | --- |
| Production build / TypeScript | Passed |
| Preview, selector and report-data tests | 51 passed, 0 failed |
| Browser-runner diagnostics and input stability | 63 passed, 0 failed |
| Standalone report overlay data | 5 passed, 0 failed; real capture overlays explicitly skipped |
| Invictus rendered check | Passed in the complete suite, 119.92 seconds |

The Invictus check exercises every thumbnail and modal image at eleven viewports in both motion modes: 360×840, 390×845, 845×390, 840×360, 800×1200, 1200×800, 899×700, 900×700, 901×700, 1366×768, and 1920×1080. It covers complete framing, mock alternatives, named regions, selected indications, modal wrap/synchronization/dismissal/focus, keyboard browsing and focus containment, mouse/native touch browsing and swipes, vertical page scrolling, and touch activation of all five panels.

Paused-clock checks verify the published 6.5-second dwell and image-only wrap, hover/focus/modal inspection, fresh manual intervals, offscreen/hidden-page suspension, live reduced motion, slow loading beyond the dwell, failure/original access/Retry, route reset, and countdown independence from Regulus. Manual and modal interactions also preserve both existing gallery selections and the selected report.

The first modal-size assertion measured the entrance animation before it settled; the check now awaits animation completion before geometry assertions. The added backward modal-wrap scenario initially left the preview strip at its last image; review identified the inconsistent browsing setup, which now explicitly returns to the first image. Both corrections affect test setup only.

The complete suite also exposed the existing footer check's three-showcase expectation and its assumption that the final showcase was an `article`. Those assertions now include Invictus and measure the footer gap from the final project showcase. Existing store destinations and footer spacing checks are retained.

## Standards

Independent GPT-6.1 Sol review at high effort, comparing `git diff 39163a87305127439863b78b2a53e282957ed1ca...HEAD`: no documented-standard breaches or actionable baseline smells. Implementation, asset paths, terminology, responsive styles, browser checks, and validation documentation were reviewed.

## Spec

Independent GPT-6.1 Sol review at high effort against ticket #58 and its parent specification #57: no product findings. Visual review covered desktop, phone, modal, and all five panels. The test setup note above was corrected in `46c3542` and the reviewer confirmed it resolved.

Findings: Standards 0; Spec 0 outstanding.

After integrating main `c26ac9c`, both reviewers confirmed no findings against the refreshed baseline. The focused report suite passed (synthetic overlay 15.73 seconds; report interactions 320.35 seconds). A delayed-image dwell check captured a ready gallery outside the viewport after reload scroll restoration; the slideshow correctly remained suspended. The dwell helper now restores visibility and lets browser rendering settle before measuring the published interval, matching the existing slideshow check's prerequisite.

The complete local nine-check suite passed before integration. The complete Linux CI suite also passed on merged head `19ab19f` ([run 38079675489](https://github.com/komed-uth/Game-QA-Portfolio/actions/runs/38079675489)). Both independent GPT-6.1 Sol high-effort reviewers inspected the final visibility prerequisite correction and reported zero findings. Final-head check results are recorded in the pull request.

Main subsequently published ticket #52 as `6109a1b`. Integration retains its primary-project media ordering and uses `.project-grid.placeholder-project > .game-gallery` to keep the new showcase's named placement above the shared mobile placement rules. Both reviewers reported zero findings against this refreshed baseline. The touch scenario now observes 250ms of quiet vertical scroll, bounded by five seconds, before a separate inspection tap; the native scroll and selection assertions and single real tap remain intact. Both reviewers reported zero findings for this test adjustment, and the focused Invictus check passed in 85.36 seconds.

## Limits and merge risk

The five supplied HTML reports have empty screenshot path lists. Real report capture overlays are therefore skipped; synthetic overlay coverage checks integration without certifying real capture evidence. Browser viewports, native touch emulation, and controlled document visibility do not certify physical devices or actual background-tab scheduling. Verified project facts and real project media still need the owner's input.

This is a two-way change with a gallery-sized impact: reverting removes the new showcase and its assets. Existing gallery, slideshow, photo-transition, and evidence-modal engines are reused. No backend, CMS, fabricated video/store links, video-completion logic, or website deployment is introduced.
