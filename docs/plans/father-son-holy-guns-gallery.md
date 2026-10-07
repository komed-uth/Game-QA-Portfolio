# Father, Son & Holy Guns media gallery

Status: All design questions resolved. Converted into an implementation specification at the user's request. Website implementation has not started.

Specification: [Father, Son & Holy Guns gallery](../specs/father-son-holy-guns-gallery.md).

## Request

Add the three supplied screenshots to the Father, Son & Holy Guns project, following the existing Regulus the Advent layout format.

## Current facts

- Both showcases already use project details on the left and media on the right, stacking at widths of 900px or less.
- Regulus has a video and three screenshots in a gallery with thumbnails, arrows, dots, a slide counter, full-size image links, and swipe navigation. Its performance reports are a separate section below the gallery.
- Father, Son & Holy Guns currently has one embedded YouTube video and a YouTube link. Its role, responsibilities, and tools contain placeholders.
- The supplied screenshots depict a Hunter boss battle (image 1), blessing selection (image 2), and combat with multiple effects (image 3).
- The main Regulus viewer fits the complete image inside a 16:9 frame. The supplied screenshots have different, wider proportions.

## Confirmed decisions

The user accepted all first-round recommendations.

1. Preserve the existing project-details layout and adopt Regulus's gallery thumbnails, arrows, dots, slide counter, swipe navigation, and full-size image links. Reports and store badges are outside this addition.
2. Present the screenshots as gameplay showcase media with descriptive captions. No QA findings are established by these images alone.
3. Start on Video, with the order Video → Boss battle (image 1) → Blessing selection (image 2) → Combat effects (image 3).
4. Request muted autoplay on the initial video slide and when returning to it, matching Regulus. Leaving the video slide removes the player and stops playback. Browser autoplay restrictions may still require interaction.
5. Show complete screenshots inside the existing 16:9 viewer, accepting space around the wider images. Thumbnail previews use Regulus's existing cropped framing.
6. Use short labels and the slide counter, matching Regulus. Put detailed descriptions in alternative text.

## Media inventory

| Order | Label | Source | Planned asset / alternative text |
| --- | --- | --- | --- |
| 1 | Video | Existing YouTube video Pp3EoksO-hI | Father, Son & Holy Guns video preview |
| 2 | Boss battle | Image 1: codex-clipboard-63d8fbd6-7d1e-42dd-85fb-d2ff5dbeca6e.png | images/father-son-holy-guns/boss-battle.png; Father, Son & Holy Guns cooperative battle against Hunter with a 0.0% sanity meter |
| 3 | Blessing selection | Image 2: codex-clipboard-47648548-4548-4340-912d-3071953142a0.png | images/father-son-holy-guns/blessing-selection.png; Father, Son & Holy Guns blessing selection showing Penitent's Joy, Lone Wolf, and Fortified |
| 4 | Combat effects | Image 3: codex-clipboard-cb3d0d51-07f8-4cc0-bee8-0562e94ea26c.png | images/father-son-holy-guns/combat-effects.png; Father, Son & Holy Guns cooperative combat with bright tornado effects, enemies, and the minimap |

All screenshot source files are currently in C:/Users/nomem/AppData/Local/Temp/. Implementation must copy these exact supplied images into durable project assets before referencing them from the website.

## Implementation scope

1. Preserve the existing project name, detail text, video URL, and position immediately below Regulus. Role, responsibilities, and tools placeholders are outside this media addition.
2. Copy the three original PNGs into public/images/father-son-holy-guns/ using the names above. Preserve the original image pixels and proportions.
3. Extract Regulus's media gallery into a small shared component so both projects use the same presentation and controls. Pass project-specific media, video details, and an accessible gallery name. Keep Regulus's reports and store links in its showcase component.
4. Replace Father's single video figure with the shared four-slide gallery. Keep Regulus's own media order, playback behavior, report viewer, and store links intact.
5. Reuse existing gallery styles: 16:9 main frame, uncropped main screenshots, thumbnail previews, slide counter and label, full-size links, thumbnails, arrows, dots, wraparound selection, swipe navigation, and keyboard-operable buttons. Swipes apply to screenshots and the thumbnail strip; the embedded video's controls handle gestures inside the player.
6. Maintain the existing responsive project layout: details on the left and gallery on the right on desktop; details followed by the gallery at widths of 900px or less.
7. Update README's Father, Son & Holy Guns description to mention the video and three gameplay screenshots.

This is a local website change. Publishing, reports, store badges, new QA findings, and project biography edits are outside the scope.

## Acceptance checks

- The project shows exactly four slides in the confirmed order and starts on Video.
- Video requests autoplay with mute enabled, keeps the YouTube link and fullscreen support, and stops when a screenshot is selected. Selecting Video again requests muted autoplay.
- Each screenshot loads, retains its complete frame in the main viewer, has the agreed short label and useful alternative text, and opens its full-size project asset in a new tab.
- Thumbnails, arrows, dots, slide counter, wraparound, and horizontal swipes select the expected slide. Swiping does not accidentally open the image, and normal vertical page scrolling remains usable.
- Switching Father's gallery does not change Regulus's selected media or reports.
- Keyboard users can reach and activate all gallery controls, with a visible focus indicator and selected state.
- Inspect desktop and narrow mobile layouts, including mobile landscape, for overflow, clipped labels, and missing controls.
- Verify Regulus retains its gallery, reports, and store links after extraction.
- Run the existing TypeScript and production build checks. The existing build regenerates published report copies; preserve original capture data and unrelated local changes.

## Decision tree

- Layout and gallery controls: settled → muted autoplay and full-image framing settled.
- Gameplay showcase purpose: settled → short captions and descriptive alternative text settled.
- Default video slide and thumbnail sequence: settled.
- Design frontier: empty. The user requested specification synthesis as the next step; website implementation has not been requested.

Existing local changes belong to the ongoing portfolio work and must be preserved during any later implementation.
