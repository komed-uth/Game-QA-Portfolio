# Ticket #99: Vecchio Furioso gameplay gallery

Implemented [ticket #99](https://github.com/komed-uth/Game-QA-Portfolio/issues/99), following parent specification #92. The owner's implementation/push/PR instruction on 2026-10-13 supplies the separate authorization required by the planning tickets. No website deployment is part of this change.

## Change

Vecchio reuses the delivered image-only `MediaGallery` with five supplied gameplay photos in the accepted order. Original-file access and enlarged inspection use the same unmodified 1920 × 1080 sources. SHA-256 comparisons against the planning inputs confirmed byte equality for all five assets, including the replacements in slots three and five. The superseded tiny sources are excluded.

The PIX capture remains a separate single-image inspection target with its original source and `pix-capture` destination. Project details and Steam destination are preserved. Only Vecchio's layout changes: details left and gallery above PIX right above 900px; title, entire gallery, details/Steam, PIX at 900px and below. DOM and keyboard order follow the mobile sequence. The desktop media query uses `width > 900px`, complementing the mobile rule continuously.

Shared gallery logic is unchanged, inheriting the published pause control, preview browsing, image readiness/retry, fades, 6.5-second image-only progression, modal navigation, swipes, focus handling, and reduced-motion/visibility behavior.

## Validation

- Isolated branch created from fetched `origin/main` at `37e71f0f5f3afad5e0810dc1be69050a08a6a383`; ancestor check passed. Original checkout and unrelated changes preserved.
- Workstation preflight passed; GitHub CLI authenticated as `komed-uth`.
- Locked dependencies installed with `npm ci`.
- Production build and TypeScript checking passed after the final review fix.
- Preview-startup/parser/check-selection tests: 99 passed.
- Validation-runner tests: 124 passed.
- Final-source shared slideshow suite passed, including all six gallery controls: independent Pause/Resume, persistent manual pause, keyboard focus, reduced-motion Resume, touch gesture isolation, and existing timing/visibility/route-reset checks.
- Focused Vecchio rendered checks passed: five ordered full-resolution photos, complete main/enlarged framing, all thumbnail selections, original-file access, keyboard/modal navigation and wrap, selection synchronization, focus containment/restoration, three dismissal actions, independent neighboring selections and PIX, native touch strip browsing, photo swipes, vertical page scrolling, delayed/failed/retried photo sources, and inherited progression/wrap/inspection suspension.
- The shared evidence suite now includes Vecchio gameplay framing and modal navigation in its eleven-view matrix; project order checks distinguish gameplay and PIX, and keyboard/selection checks resize through 900px in both directions.

The final complete browser suite passed all thirteen stages in `.scratch/browser-runs/run-VTSR5G/`, against unchanged final inputs at implementation commit `f0e9d32e5be78a1c024975f6cd39e7df81152163`. The [retained summary](browser-summary.json) records the passing stages and source-input fingerprint; the [complete output](browser-output.txt) records Vecchio acceptance and the neighboring gallery/report/Skills checks. The later delivery commit adds documentation/evidence only.

Earlier exploratory runs became obsolete after test corrections; they are not claimed as final acceptance. An earlier obsolete supervisor was stopped so the final run could proceed independently. One focused timing assertion initially used five seconds and was corrected to the existing image-only 6.5-second contract without changing application timing. The shared gallery-control regression expectation was updated from five to six mounted galleries before final validation.

## Visual review

The complete project was captured and visually inspected at desktop 1366px, phone 390px, exactly 900px and 901px. Full gameplay framing, the complete preview strip, project information/Steam, and separate PIX fit the intended sequence without overlap. The 900px image is stacked; 901px has details left and both media blocks right. These are browser viewport checks, not physical-device certification.

- [Desktop](vecchio-1366.png)
- [Phone](vecchio-390.png)
- [900px](vecchio-900.png)
- [901px](vecchio-901.png)

## Review

Two independent GPT-6.1 Sol reviewers at high effort examined the fixed-base diff against `37e71f0` and the incremental test/review fixes through `f0e9d32`. Both also accepted updating the shared gallery-control regression count to six so Vecchio inherits normal/reduced-motion and touch coverage.

**Standards:** no documented-standard violations or actionable correctness findings remain. The independence check now compares accessible labels instead of empty image-thumbnail text and explicitly excludes Vecchio. An optional Duplicated Code heuristic noted that small touch/inspection test helpers repeat existing patterns; these are retained to keep this slice focused.

**Specification:** no remaining omissions, wrong implementations or scope creep. A source-level concern about fractional widths just above 900px was proactively corrected with complementary media-query ranges; the review did not reproduce it as a browser defect.

## Merge risk

Two-way door: revert the Vecchio data/component/layout and assets; no migration or shared gallery-engine change. Blast radius is Vecchio's project presentation and its rendered acceptance checks. Five original PNG files add approximately 14.8 MB of static assets. Existing real report-overlay image checks remain unavailable because supplied report capture lists are empty; the synthetic integration fixture covers modal integration rather than certifying unavailable report captures.
