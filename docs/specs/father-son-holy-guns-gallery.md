# Add a Regulus-style media gallery to Father, Son & Holy Guns

## Problem Statement

The Father, Son & Holy Guns project showcase currently presents only an embedded video. The portfolio owner wants to include three supplied gameplay screenshots and give visitors the same media presentation and navigation available in the Regulus the Advent project showcase.

Visitors should be able to browse the screenshots, understand each scene from a short label, and inspect complete images without losing important HUD or interface content to cropping.

## Solution

Present the existing video and all three supplied screenshots in one four-slide gameplay showcase gallery. Keep project details on the left and the gallery on the right on desktop; stack details above the gallery on narrow screens.

Start on the video and request muted autoplay. Use the following media order:

1. Video — the existing Father, Son & Holy Guns video.
2. Boss battle — supplied image 1, showing the Hunter fight.
3. Blessing selection — supplied image 2, showing three blessing choices.
4. Combat effects — supplied image 3, showing cooperative combat with bright tornado effects.

Match Regulus's thumbnails, arrows, dots, slide counter, swipe navigation, and external media links. Fit complete screenshots inside the 16:9 main viewer, with space around them when needed. Use short labels in captions and detailed alternative text for accessibility.

## User Stories

1. As a portfolio visitor, I want Father, Son & Holy Guns to use the same gallery presentation as Regulus, so that media browsing is consistent across project showcases.
2. As a portfolio visitor, I want to see project details beside the gallery on desktop, so that I can read the context while viewing the project media.
3. As a mobile visitor, I want project details to appear above the gallery, so that both remain readable on a narrow screen.
4. As a portfolio visitor, I want the gallery to start on the existing video, so that I see the intended introduction first.
5. As a portfolio visitor, I want the video to request autoplay while muted, so that the project can begin playing without unexpected audio.
6. As a portfolio visitor, I want the video player to retain its normal controls and fullscreen support, so that I can choose how to watch it.
7. As a portfolio visitor, I want an external YouTube link for the video, so that I can watch it outside the embedded player.
8. As a portfolio visitor, I want to see the Hunter boss battle screenshot, so that I can inspect a boss encounter.
9. As a portfolio visitor, I want to see the blessing selection screenshot, so that I can inspect the game's upgrade-choice interface.
10. As a portfolio visitor, I want to see the combat effects screenshot, so that I can inspect an action scene with multiple characters and effects.
11. As a portfolio visitor, I want the media in the agreed order, so that browsing follows a predictable sequence.
12. As a portfolio visitor, I want a thumbnail for each slide, so that I can select media directly.
13. As a portfolio visitor, I want previous and next controls, so that I can browse the gallery sequentially.
14. As a portfolio visitor, I want navigation to wrap at either end, so that I can continue browsing without a dead end.
15. As a portfolio visitor, I want navigation dots to show the selected slide, so that I can recognize my position and select another slide.
16. As a portfolio visitor, I want a slide counter and short scene label, so that I know which of the four media items I am viewing.
17. As a touch-screen visitor, I want horizontal swipes on screenshots and the thumbnail strip to navigate media, so that the gallery works naturally with touch input.
18. As a touch-screen visitor, I want vertical scrolling to remain usable, so that I can continue moving through the portfolio.
19. As a touch-screen visitor, I want a navigation swipe to avoid accidentally opening an image, so that browsing does not unexpectedly leave the page.
20. As a portfolio visitor, I want each main screenshot shown in full, so that the HUD, minimap, and blessing choices remain visible.
21. As a portfolio visitor, I want to open a screenshot at full size in a new tab, so that I can inspect its details while retaining my place in the portfolio.
22. As a keyboard user, I want to reach and activate all gallery controls with visible focus, so that I can browse without a pointer.
23. As a screen-reader user, I want meaningful gallery names, image descriptions, and selected-state announcements, so that I can understand the media and navigation.
24. As a portfolio visitor, I want video playback to stop when I select a screenshot, so that a hidden video does not keep playing.
25. As a portfolio visitor, I want returning to Video to request muted autoplay again, so that video behavior is consistent when revisiting the slide.
26. As a portfolio visitor, I want each project's media selection to remain independent, so that browsing Father, Son & Holy Guns does not change Regulus's media or reports.
27. As a visitor who prefers reduced motion, I want the gallery to respect that preference, so that decorative transitions remain comfortable.
28. As the portfolio owner, I want these screenshots presented as a gameplay showcase with descriptive labels, so that visitors can understand what is visible without implied QA findings.
29. As the portfolio owner, I want the supplied images preserved at their original quality and proportions, so that the gallery faithfully represents the provided material.
30. As the portfolio owner, I want the portfolio documentation to describe the video and three screenshots, so that the documented project content matches the page.

## Implementation Decisions

- Use the domain terms **project showcase** and **gameplay showcase** as defined in the project glossary.
- Reuse the existing gallery through a small shared media-gallery component used by both Regulus and Father, Son & Holy Guns. This is a reversible implementation proposal from the completed plan, intended to keep presentation and controls consistent.
- The shared gallery accepts the project name or accessible gallery label, an ordered list of media items with source, type, short label, and alternative text, and the project's video identifier and external video link. Each instance owns its selection and player lifecycle independently.
- Keep project details, store links, and performance reports in their respective showcase components. The shared component owns media browsing only.
- Preserve the existing Father, Son & Holy Guns name, details, video identifier Pp3EoksO-hI, external video URL, and position immediately below Regulus.
- Store durable copies of the three supplied original PNGs as project media assets before using them on the page. Use the existing base-aware asset mechanism so image links work when hosted under a repository subfolder.
- Display exactly four slides, in the order Video, Boss battle, Blessing selection, Combat effects. The initial selected slide is Video.
- Request muted autoplay when the initial video slide is shown and whenever it is selected again. Retain the existing privacy-enhanced YouTube embed approach, inline playback, player controls, and fullscreen support. Browser or provider policies can still prevent actual autoplay.
- Remove the video player when an image slide is selected, stopping that gallery's playback. Selecting Video again creates its player with muted autoplay requested.
- Preserve Regulus's own media list, default selection, playback settings, report viewer, and store links during shared-component extraction.
- Reuse the established 16:9 main viewer. Fit full screenshots without cropping or stretching; surrounding space is acceptable. Thumbnail previews may crop to match Regulus's existing presentation.
- Match the established gallery controls: thumbnail selection, previous and next arrows, dots, short label, one-based slide counter, and wraparound selection. Do not automatically rotate media slides.
- Keep the current swipe surfaces and navigation conventions: screenshots and the thumbnail strip accept horizontal navigation gestures; embedded video controls handle gestures inside the player. Preserve vertical scrolling and suppress accidental image-link activation following a navigation swipe.
- Keep captions short: Boss battle, Blessing selection, Combat effects. Use detailed alternative text describing the Hunter encounter, the visible blessing choices, and cooperative combat with tornado effects respectively. Thumbnail images are decorative when their buttons already provide an accessible label.
- Provide a distinctly named gallery region for each project, accessible control labels, selected-state indicators, keyboard-operable controls, visible focus, and polite updates to the slide label and counter.
- Match the existing minimum 44-pixel control targets and reduced-motion behavior.
- Preserve the established responsive layout, stacking project details above media at widths of 900 pixels or less. Ensure labels and controls remain usable in mobile portrait and landscape.
- Retain the video’s external YouTube link. For screenshots, both the main image and the caption's full-size link open the corresponding durable image asset in a new tab with the existing safe external-link attributes.
- Update the portfolio documentation to state that the project includes one video and three gameplay screenshots.

## Testing Decisions

- Confirmed single testing boundary: the rendered portfolio page containing both project showcases. This exercises the shared gallery through the same interface a visitor uses, including integration with project details and Regulus's reports. The user explicitly accepted this testing approach.
- Good checks verify externally visible behavior: displayed media, labels, links, selected states, accessible controls, and layout. Avoid checks tied to internal state variables, component names, event-handler names, or a particular extraction structure.
- Cover Father, Son & Holy Guns gallery behavior and Regulus integration at this page boundary. The repository currently has no configured automated UI-test framework or existing gallery test suite. Prior practice consists of responsive browser checks and the existing TypeScript and production build validation.
- Use targeted browser interaction and visual checks for this reversible media addition. Adding a new testing framework is outside the scope; existing project validation should remain the baseline.
- Verify the initial video slide, exactly four media items, agreed order, thumbnail and dot selection, arrow navigation, wraparound, and matching counter and short label.
- Verify that the video embed requests muted autoplay, retains its external link and fullscreen support, disappears when an image is selected, and is recreated when Video is selected again. Check the requested configuration and player lifecycle without depending on a third-party autoplay policy or timing.
- Verify that every supplied screenshot loads, has the expected alternative text, fits completely inside the main viewer, and opens the matching full-size image in a new tab. Check base-relative asset links under the existing subfolder-hosting configuration.
- Verify horizontal swipes on screenshots and the thumbnail strip select the expected neighboring slide, while vertical scrolling remains usable and a swipe does not activate the full-size link.
- Verify keyboard access, visible focus, meaningful control names, selected-state indicators, distinct gallery names, and updated slide announcements.
- Inspect desktop, mobile portrait, and mobile landscape layouts for horizontal overflow, clipped media, unreadable labels, and inaccessible controls. Include widths immediately above and below the existing stacking breakpoint.
- Verify that reduced-motion settings suppress the decorative gallery transition and controls retain the existing touch-target size.
- Confirm that changing one gallery does not alter the other gallery's selection, and that Regulus's gallery, reports, and store links remain available after extraction.
- Run the existing TypeScript and production build checks once implementation is complete. Preserve original capture data and unrelated local work when the build regenerates published report copies.

## Out of Scope

- Website implementation during this specification-writing task.
- Website deployment or publishing the portfolio.
- Adding performance reports or store badges to Father, Son & Holy Guns.
- Filling role, responsibilities, engine, or QA-tool placeholders, or rewriting project details.
- Claiming defects, test outcomes, coverage, or performance findings from the supplied gameplay screenshots.
- Editing, regenerating, annotating, or cropping the original screenshot files.
- Changing Regulus's media content, report content, autoplay behavior, or store links.
- Redesigning other projects, changing portfolio ordering, adding timed slideshow rotation, or replacing the established gallery controls.
- Adding a new test framework or unrelated infrastructure.

## Further Notes

- This specification synthesizes the completed design interview. The user accepted the full Regulus gallery format, gameplay showcase purpose, and video-first order; explicitly chose muted autoplay; and accepted full-image framing and short captions.
- Image mapping is fixed: attachment 1 is Boss battle, attachment 2 is Blessing selection, and attachment 3 is Combat effects. The planning document records the original supplied filenames and detailed media descriptions. The sources are temporary clipboard files, so durable copies are a prerequisite for implementation.
- No ADR is needed for this reversible gallery addition. No existing ADRs or automated UI-test conventions were found in the repository.
- Existing local portfolio changes must be preserved during any implementation.
- Publication status: local specification prepared; issue-tracker publication is pending. The repository has a GitHub remote, but no configured issue tracker or triage-label vocabulary was found. The invoked skill requires running `/setup-matt-pocock-skills` when these are missing. Do not infer the publication target from the remote alone.
- Once the tracker is configured, publish this specification with the configured `ready-for-agent` triage label. The testing boundary is confirmed. No issue or label has been created by this task.
