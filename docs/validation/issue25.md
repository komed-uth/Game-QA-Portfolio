# Ticket #25 validation

Date: 2026-10-09. Ticket: https://github.com/komed-uth/Game-QA-Portfolio/issues/25.
Comparison base: main at `88253d9252faeba8465f125452ba0a14ec623b16`.

## Change

Both gameplay showcases retain their media, captions, links and independent selection. Photo-to-photo changes fade out for 100ms and in for 150ms without zoom. Selection metadata updates immediately. The existing viewer keeps complete-image framing and stable dimensions while waiting for a decoded photo, showing a recoverable error, or transitioning. Photo opening waits for actual fade completion. Video changes and reduced-motion photo changes are immediate once the selected photo is loaded.

The displayed-photo lifecycle cancels obsolete callbacks. Retry restores the selected photo; failures retain original-file access and usable preview selection. Repeated active-media activation preserves the photo or video. The lifecycle exposes ready only after loading and fade completion for the later progression ticket; no slideshow is introduced.

## Evidence

Checks use the existing rendered portfolio seam; no framework or dependencies were added. They were written after implementation as requested.

- Baseline: the new rendered check against an in-memory build of the main gallery fails with `Open is blocked during transition`. The fixture does not overwrite the production build or publish test media.
- `npm run build`: passed TypeScript and Vite production build.
- `npm run check:preview`: all 10 tests passed.
- `npm run check:overlays`: all 5 parser tests passed; real capture checks explicitly skipped for empty supplied screenshot lists.
- `npm run check:browser`: the final complete rendered portfolio suite passed, including new photo checks, both motion preferences at ten viewports, representative media-list fixtures, native touch and mouse browsing, evidence actions/navigation/focus, all six reports and original tabs, and the synthetic overlay fixture.
- Targeted photo/evidence checks: passed both galleries, ordered CSS durations and no zoom, stable viewer dimensions, delayed responses, selected-photo failure, original-file access, successful retry and inspection, stale-response cancellation, rapid image/video changes, active-media reselection, and reduced motion.
- Additional regressions verify that choosing a new photo from loading retains its incoming fade and that closing the evidence modal before a fade completes restores its opener when ready.

## Review

The code-review skill ran independent Standards and Spec reviews with Sol 6.1 at high effort against the fixed main base.

### Standards

No actionable documented-standard violations or baseline code-smell findings, including after the corrective commit.

### Spec

One initial finding: selecting another photo while the prior target was loading skipped the incoming fade. Fixed by distinguishing previously selected media from the displayed photo; a rendered regression confirms the incoming fade. Re-review found no remaining missing, unrequested or incorrect behavior. The reviewer also exercised rapid selection at ten offsets from 0–250ms and reran the photo checks in Edge.

## Limits and risk

The change is reversible and scoped to gameplay photo lifecycle, its gallery presentation and existing checks. Loading or failure still permits preview navigation. Final user acceptance remains with the portfolio owner. Browser/provider autoplay is requested as before and is not guaranteed. Existing real report-capture overlays cannot be certified because the supplied screenshot path lists are empty; the synthetic overlay fixture remains separate evidence. Responsive viewport checks are not physical-device certification. No deployment was performed.
