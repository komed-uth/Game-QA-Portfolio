# Simplify Vecchio Furioso PIX capture (#47)

## Scope and history

Implemented ticket #47 after the owner's separate implementation instruction on 2026-10-10. The original checkout's unrelated changes were preserved. An isolated `codex/issue-47` branch starts from fetched main at `75c691305d347f5691998e19b48907b497728bcb`; that remote tip was verified as an ancestor before editing.

Removed the PIX capture caption, secondary Open full-size capture action, inspection note, and capture-caption spacing styles. Shared report/gallery styles remain. The main capture button, original image source and alternatives, evidence modal, project details, Steam link and responsive arrangement are unchanged.

## Evidence

- Before: the capture had a caption row with a secondary opener and an inspection paragraph; responsive checks opened it through that secondary action.
- After: the existing rendered-portfolio checks verify an image-only capture with one named opener, no reserved caption/note spacing, complete aspect-ratio framing, and retained desktop/narrow-screen arrangement.
- Click, Enter and Space open the existing named modal with the same source, alternative and original-file link. Checks cover close-button, Escape and backdrop dismissal, background lock, visible keyboard focus and restoration to the main capture, plus absence of screenshot navigation.
- The existing ten-viewport resize matrix checks complete framing, touch target size, layout, no overflow and modal fit. Existing gameplay/report checks remain in place.
- `npm run build`: TypeScript and production build passed.
- `npm run check:preview`: all 39 tests passed.
- `npm run check:runner`: all 51 tests passed.
- `npm run check:evidence`: both evidence-modal and evidence-interactions checks passed, including all ten viewports and reduced motion.
- `npm run check:browser`: all eight checks passed against the current production build: slideshow, photos, gameplay previews, temporary list fixtures, evidence modal, evidence interactions, synthetic overlay fixture, and report interactions. Input stability checks accepted the unchanged source/build throughout.

## Review

Two independent Sol 6.1 high-effort reviews compared the implementation with fixed main commit `75c6913`: Standards found zero documented breaches or actionable smells; Spec found zero missing, incorrect or unrequested requirements. The parent agent verifies execution results separately.

## Limits and risk

This is a reversible presentation change confined to Vecchio's capture and its existing browser checks. No original evidence, project details, modal content, dependency or deployment is changed. Browser viewport checks do not certify physical devices. Supplied reports have empty screenshot path lists; real report-owned capture overlays remain explicitly skipped, with existing synthetic fixture coverage retained.

The first full-suite attempt timed out waiting for its owned preview server before browser checks began. The unchanged rerun passed the complete suite.
