# 01: Reuse Regulus's gallery with existing behavior intact

## What to build

Make the existing Regulus media gallery reusable by another project showcase while keeping the Regulus visitor experience intact. The completed ticket must leave a working Regulus showcase with its current four slides, navigation, playback, project details, store links, and reports.

This is the prerequisite prefactoring slice. It prepares one gallery for reuse before introducing Father's screenshots; it is independently verifiable through the rendered portfolio page.

## Acceptance criteria

- [ ] Regulus uses a reusable gallery that accepts project-specific media, short labels, alternative text, an accessible gallery name, and the video's identifier and external link.
- [ ] Regulus still displays Video, Combat, Boss battle, and Shop in its existing order and starts on Video with muted autoplay requested.
- [ ] Thumbnails, arrows, dots, slide counter, short caption labels, and wraparound navigation retain their existing behavior.
- [ ] Screenshot and thumbnail-strip swipe navigation remains usable; vertical scrolling works and navigation swipes do not accidentally open images.
- [ ] Selecting a screenshot stops that gallery's video; returning to Video requests muted autoplay again. The external video link and fullscreen support remain available.
- [ ] Complete screenshots fit inside the existing 16:9 main viewer, thumbnail framing remains consistent, and full-size links work under repository-subfolder hosting.
- [ ] Gallery state belongs to each gallery instance, rather than being shared across projects.
- [ ] Gallery names, accessible control labels, selected states, slide announcements, keyboard activation, visible focus, touch-target size, and reduced-motion behavior are preserved.
- [ ] Regulus's project details, store links, reports, responsive placement, and media sources remain intact.
- [ ] Verify the visible Regulus showcase on desktop and mobile, including its existing interactions, and pass the existing TypeScript and production build checks. Preserve original report data and unrelated local work.

## Blocked by

None (can start immediately when implementation is requested).

## Approval and publication status

Approved by the user as ticket 01 in the two-ticket breakdown. Prepared locally; publication and the ready-for-agent tracker label await tracker configuration. No additional breakdown approval is required.
