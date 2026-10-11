# Ticket #52 validation

Ticket: [Show primary project media before details on narrow screens](https://github.com/komed-uth/Game-QA-Portfolio/issues/52).

Implementation was separately authorized by the owner on 2026-10-11. The earlier ticket/specification hold is superseded for this ticket's implementation and PR publication. Merge and deployment remain outside this request.

## Change and scope

All three project showcases now read heading (including eyebrow), complete primary media, then project details and store links. The document order matches the displayed sequence at widths through 900px. Desktop keeps the heading/details in the left column and media in the right column; title/detail spacing and report row spacing retain their prior values.

The existing MediaGallery and single PIX capture keep their original actions, sources and state. Regulus's report controls/output retain their existing internal order and remain after project details/store links. This does not implement ticket #53 or restore text removed by the cleanup tickets.

## Acceptance evidence

| Ticket requirement | Evidence |
| --- | --- |
| All three projects: heading, media, details and stores on narrow screens | `checkProjectLayout` in the existing evidence checks measures the displayed sequence and verifies document reading order. It checks the eyebrow/title and named project association. |
| Complete gameplay block and single PIX capture | Gallery region and preview-group names, frame proportions, action dimensions, capture aspect ratio, and the absence of a Vecchio gallery are checked. Existing gameplay checks retain preview browsing, selection, swipes and video behavior. |
| Desktop preservation and inclusive boundary | Existing ten viewport scenarios plus exactly 900px; desktop checks retain media alignment with the heading, details to the left, and the 16px heading/detail gap. Both Regulus report elements remain after the project content. |
| Keyboard sequence, visible focus and evidence restoration | Real Tab traversal at 390px and 900px follows photo opener, gameplay previews/browsing controls, surviving store actions and report choices. Father/Son traversal proceeds to the PIX opener; PIX traversal proceeds to Steam. Enter/Escape inspection restores visible focus to the actual opener. |
| Resize continuity | Distinct photos in each gallery and Low report selection survive 900 → 901 → 390 → 1366 → 900px; displayed photos and report output remain consistent with selection. |
| Empty media | Existing empty-list rendered fixture verifies natural heading/detail spacing at 390, 900, 901 and 1366px and after returning to mobile, with no reserved media row or overflow. |
| Framing, spacing, targets and overflow | Rendered geometry checks cover all three projects and media blocks; prior image/modal, touch-target, reduced-motion and no-overflow checks remain active. |
| Content, store destinations and report inspection | Project data/store URLs and report components are unchanged. Existing footer/store checks and all six report choices, originals, memory, reload and focus checks are retained. |

## Validation results

- `npm ci` and Playwright Chromium setup succeeded.
- `npm run build`: passed; includes TypeScript validation and a fresh production build.
- `npm run check:preview`: 39 passed, 0 failed.
- `npm run check:runner`: 51 passed, 0 failed.
- `npm run check:evidence`: passed, including eleven viewports, image/report inspection, native touch, new reading/keyboard order and resize continuity.
- Before/after regression: an isolated in-memory build of pinned main fails the new mobile media-before-details reading-order assertion; the implemented production page passes layout checks at 390, 900, 901 and 1366px. The original checkout/build inputs are preserved.
- Complete `npm run check:browser`: passed all eight check groups, including slideshow, photos, gameplay previews, media-list fixtures, evidence modal, touch interactions, synthetic overlays and report interactions. The runner completed with `PASS: rendered portfolio browser checks` and stable validation inputs.
- The first complete run stopped during photo testing with a test-side `route.fetch` connection reset to the local Vite preview. The isolated `npm run check:photos` and subsequent complete suite both passed without source changes, including delayed responses, failure/retry and rapid selection. No product assertion failure was captured from the interrupted run.
- `git diff --check`: passed.

## Visual evidence

Full-page screenshots were inspected for the phone order and desktop preservation. Third-party video frame loading/autoplay remains provider-dependent.

| View | Before | After |
| --- | --- | --- |
| Phone, 390px | [Before phone](images/issue52/before-phone.png) | [After phone](images/issue52/after-phone.png) |
| Desktop, 1366px | [Before desktop](images/issue52/before-desktop.png) | [After desktop](images/issue52/after-desktop.png) |

## Independent review

Fixed point: `39163a87305127439863b78b2a53e282957ed1ca` (published main at branch creation).
Reviewed implementation: `33a979dc829e4d65b416ec7aa40ffc1cefd67d45`.

Two read-only GPT-6.1 Sol reviews used high reasoning effort:

- Standards: no actionable documented-standard breaches or material baseline smells in the seven changed files.
- Spec: no missing/partial requirements, scope creep or incorrect implementation against ticket #52.

## Risk and limitations

This is a reversible presentation change, limited to the three project showcases and rendered-page checks. The main risk is responsive spacing/placement around 900px, covered by boundary, viewport and resize checks.

Real report-owned capture overlays remain uncertified because the supplied five reports have empty screenshot path lists. The existing synthetic overlay fixture covers modal integration only. Viewport/touch simulation is not physical-device certification.

The work uses an isolated branch from synchronized main and leaves the original checkout's unrelated local work intact. No merge or deployment was performed during the initial implementation.

## Integration before the authorized merge

The owner subsequently authorized merging PR #66 and closing #52. While its original CI passed, main advanced to `c26ac9ca9b49c23766f362adf6f23e87edf56da2` through PR #64/ticket #53. The overlapping CSS required synchronization before #66 could merge.

The resolution keeps #53's report block and its preview-first mobile reading/keyboard sequence. The complete report block receives #52's desktop row/gap placement and natural mobile stacking after project details/store links. Report content and report-interaction checks are imported unchanged from published main. The #52 keyboard assertion now traverses the report preview before quality choices after the store links.

The focused combined layout/keyboard check passed at 390, 900, 901 and 1366px, including resize selections and modal focus restoration. A transient focus mismatch in the first focused run did not recur on the unchanged diagnostic rerun. The check now waits for the last preview to be fully visible and browsing controls to reach their observable end before Tab traversal; two subsequent focused runs passed.

Integrated production/TypeScript build and preview validation (39 tests) passed. Complete integrated browser validation and updated CI must finish before merging.

Current visual evidence: [integrated phone](images/issue52/integrated-after-phone.png), [integrated desktop](images/issue52/integrated-after-desktop.png). Original before/after screenshots above document the initial #52 slice before #53 landed.
