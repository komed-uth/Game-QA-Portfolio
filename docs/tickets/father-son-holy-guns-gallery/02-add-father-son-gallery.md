# 02: Add the Father, Son & Holy Guns gameplay gallery

## What to build

Replace the project's single video presentation with a complete four-slide gameplay showcase, using the reusable Regulus gallery. Visitors can browse the existing video and the three supplied screenshots with the agreed layout and controls on desktop, mobile, and keyboard.

The ticket includes durable image assets, gallery integration, accessible descriptions, documentation, and verification of the completed visitor experience. Do not split these into separate asset, UI, or testing tickets.

## Acceptance criteria

- [ ] Preserve durable copies of all three supplied original PNGs without editing their pixels or proportions; use base-aware project asset links.
- [ ] Display exactly four slides in the order Video, Boss battle (attachment 1), Blessing selection (attachment 2), Combat effects (attachment 3).
- [ ] Start on the existing project video and request muted autoplay. Selecting a screenshot stops playback; returning to Video requests muted autoplay again.
- [ ] Retain the existing video identifier and YouTube URL, privacy-enhanced embed, inline player controls, and fullscreen support. Verify requested playback settings without assuming the browser permits autoplay.
- [ ] Match Regulus's thumbnails, previous/next arrows, dots, slide counter, short labels, wraparound selection, and existing swipe-navigation conventions. Media does not rotate automatically.
- [ ] Fit complete screenshots inside the 16:9 main viewer without cropping or stretching, allowing surrounding space. Thumbnail previews may crop to match Regulus.
- [ ] Use the labels Boss battle, Blessing selection, and Combat effects, with meaningful alternative text describing the Hunter encounter, visible blessing choices, and cooperative combat with tornado effects.
- [ ] Both each main screenshot and its full-size caption link open the corresponding durable image in a new tab. Preserve the visitor's current gallery selection.
- [ ] Screenshot and thumbnail-strip swipes select the expected slide without activating image links; vertical page scrolling remains usable and the embedded video keeps its own gesture controls.
- [ ] Give each project a distinct gallery name. Ensure keyboard-operable controls, visible focus, selected-state indicators, polite slide announcements, existing touch-target sizes, and reduced-motion support.
- [ ] Keep the project's existing name, details, video URL, and position immediately below Regulus. Show details beside the gallery on desktop and above it at widths of 900 pixels or less.
- [ ] Verify desktop, mobile portrait, mobile landscape, and widths around the stacking breakpoint: no horizontal overflow, clipped screenshots, unreadable labels, or inaccessible controls.
- [ ] Verify that changing Father's gallery does not alter Regulus's gallery selection or reports, and that Regulus's gallery, reports, and store links still work.
- [ ] Update the portfolio documentation to describe one video and three gameplay screenshots. Keep screenshot captions descriptive, with no implied QA findings.
- [ ] Complete the agreed browser checks through the rendered portfolio page and pass the existing TypeScript and production build checks. Preserve unrelated local changes and original capture data.

## Blocked by

- 01: Reuse Regulus's gallery with existing behavior intact — the shared gallery must be available before integrating Father's media.

## Approval and publication status

Approved by the user as ticket 02 in the two-ticket breakdown, blocked by ticket 01. Prepared locally; publication and the ready-for-agent tracker label await tracker configuration. No additional breakdown approval is required.
