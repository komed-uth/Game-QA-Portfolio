# Ticket #45 validation

Implemented [Simplify both gameplay showcases](https://github.com/komed-uth/Game-QA-Portfolio/issues/45) on `codex/issue-45-showcase-cleanup`, based on published main `75c691305d347f5691998e19b48907b497728bcb`. The owner separately authorized implementation, testing, branch publication, and a PR to main on 2026-10-10. Website deployment remains outside this task.

## Behavior

Both gameplay showcases omit the caption row, external caption actions, thumbnail text, and explicit Pause/Resume controls. Video thumbnails retain a play indicator over their image. Gallery regions, named thumbnails, selected borders, descriptive alternatives, and nonvisual selection announcements remain available. Clicking or keyboard-activating the main photo opens evidence inspection; closing restores the surviving main-image opener, including after interrupted photo transitions.

The synchronized 6500ms photo dwell and media order remain unchanged. Temporary inspection, loading/error, visibility, and offscreen suspensions stay independent. Reduced motion disables progression without a Resume interface and responds to preference changes during the visit. Embedded video lifecycle and controls are preserved without timed video skipping.

Removed caption/thumbnail spacing is reclaimed. Project details, store links, original images, reports, Vecchio, and unrelated checkout changes remain outside the implementation diff.

## Execution evidence

- `npm run build`: PASS (TypeScript and production build).
- `npm run check:slideshow`: PASS. Controlled clock verifies both galleries, full dwell and resumption, manual selection, pointer-retained focus, combined suspension reasons, modal inspection, native touch cancellation, independent timers, reduced motion, and route reset.
- `npm run check:photos`: PASS. Both galleries retain ordered 100/150ms fades, loading/failure stability, Retry/original-file access, stale-response protection, image/video switching, and early-close main-image focus restoration.
- `npm run check:preview`: PASS, 39 checks with approved host execution. Earlier sandbox attempts hit the existing five-second child-preview startup timeout without server output; the two preview tests also passed in isolation. No timeout or startup code was changed.
- `npm run check:runner`: PASS, 51 checks. Diagnostics now read the surviving selection announcement.
- `npm run check:overlays`: PASS, five parser checks and readiness inspection. Actual capture overlay checks explicitly SKIP because all five supplied screenshot path lists are empty; the synthetic fixture does not certify missing capture images.
- `npm run check:browser`: PASS, all eight suites: slideshow, photos, gameplay previews, gameplay fixtures, evidence modal, evidence interactions, synthetic overlay fixture, and report interactions. This includes all six reports at ten viewports, Overall two-axis position memory, reload reset, and original-report tabs.

The rendered checks exercise both video/photo states, absent caption and slideshow controls (including hidden controls), image-only previews with the retained video indicator, selection announcements, visible keyboard focus, the remaining 12px viewer/preview gap, 16:9 framing, touch targets, ten viewports in normal/reduced motion, and resizing. Main-image openers replace obsolete caption-opener assertions without dropping modal/navigation/focus coverage. The complete suite also retains reports and Vecchio regressions.

Visual inspection of local screenshots from both gameplay showcases also confirmed full-image framing, compact image-only previews, the video play indicator, selected borders, and no residual caption row.

## Standards

Independent GPT-6.1 Sol high-effort review of `git diff 75c691305d347f5691998e19b48907b497728bcb...bd33faeb321e733e216416de28e0ecffd8a9a080`: no actionable documented-standard violations or baseline code smells.

## Spec

Independent GPT-6.1 Sol high-effort review of the same diff against ticket #45 and its parent specification: no actionable missing/incorrect requirements or scope creep. Reviews were read-only; execution evidence is reported separately above.

## Merge risk

Two-way door: revert the change to restore the previous presentation and explicit pause controls. Blast radius: gameplay. Removing persistent user Pause/Resume is the owner's specified behavior; temporary inspection suspension does not establish autoplay accessibility conformance. Physical devices/provider autoplay and missing report-owned capture images remain outside browser certification.

## Pre-merge CI follow-up

The initial GitHub Linux run failed the live reduced-motion assertion. A focused rendered-page reproduction caught the identical symptom in 5/8 attempts: the native media-query change event arrived only after the paused browser clock jumped forward 20 seconds, allowing the existing countdown to fire first. Letting browser rendering frames and passive effects settle using the suite's existing 32ms clock/100ms wall-time pattern yielded 8/8 passing attempts. The original focused slideshow suite then passed. The change is confined to test synchronization; production gallery code and the reduced-motion assertion are unchanged.

Current published main is integrated before the final CI run so the separately merged Vecchio/footer changes and shorter-homepage offscreen checks are preserved. Final GitHub validation and merge status are recorded on the PR and ticket.
