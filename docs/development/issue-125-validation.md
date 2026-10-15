# Slideshow control removal — 2026-10-15

> **Authorization status as of 2026-10-15**
> - **Source:** owner's chat instruction to implement #125, test, push the working branch, and create a PR to main.
> - **Implementation and tests:** implementation completed; complete validation recorded below.
> - **Branch push and PR:** authorized.
> - **Merge and issue closure:** not authorized.
> - **Deployment:** not authorized; merging main triggers the existing Pages workflow.
> - **Separate content or release requirements:** none introduced by #125; existing release requirements remain separate.
> - **Supersedes:** #125's 2026-10-14 implementation hold for implementation/testing and branch push/PR only. The deployment hold remains.

## Result

The shared project showcase gallery has no Pause/Resume slideshow action, including hidden accessible controls, hover/focus actions, replacement icons or focus stops. Its exclusive markup, CSS, content strings, validation/type requirements, gesture exclusion and manual-pause interface are removed. Retry retains its shared action styling.

Normal motion retains five-second photo intervals in video showcases and 6.5-second image-only intervals, readiness gating and video-completion progression. Independent hover, keyboard focus, pointer/touch hold, image inspection, offscreen and hidden-tab suspensions remain. Reduced motion keeps selection manual with immediate transitions; enabling it during a mounted visit suspends progression for that visit, including after the preference is disabled. Native video playback remains available.

No original media, project descriptions, reports, media-data schema, routes or provider implementation changed.

## Fixed comparison and review

Base: 8a6040514d87baaeebffb0e7c6ab98b54891ec8a (synchronized origin/main).

Implementation: 2724265888bc65dec9c47be6d7e2a9aeda9a7482.
Final reviewed source: c41bfb2cc8572b12a9d152a1b5732aee2bd6db3d (including touch-keyboard coverage and the onscreen dwell precondition).

Two independent GPT-6.1 Sol reviews at high effort used the code-review skill and the fixed three-dot comparison against the base above.

### Standards

Hard violations: none found across the reviewed 15 files against repository guidance. Judgment calls: none warrant reporting. The unused control, styling, content fields and hook interface are removed consistently; reducedMotionSuspended describes the retained state.

### Spec

One partial acceptance requirement was identified in the original review: actual Tab traversal ran at phone width in desktop contexts but not in real touch contexts. The specification requires complete control absence across all six galleries on desktop/touch layouts and actual tab navigation. Commit 72575c3 adds the same keyboard path in both touch motion modes, before clearing inspection and checking dwell. The Spec reviewer confirmed the gap resolved, with no remaining missing requirements, scope creep or incorrect implementations.

Follow-up review of 2526617 confirmed the remaining video-transition and responsive-preview expectations correctly use retained keyboard inspection and control absence. Both review axes found no additional issues after a bounded search for obsolete action references. Both also confirmed the final c41bfb2 touch-test precondition correction.

Final counts: Standards 0 findings; Spec 1 resolved, 0 remaining.

## Validation evidence

- Before removal, the new rendered absence assertion failed with one slideshow action where zero was expected. After removal, the same assertion passed against the production build.
- Locked dependency installation, checkout dependency readiness, editable-content validation, strict TypeScript checking and Vite production build passed.
- Overlay parser/readiness: 5 tests passed. All five supplied reports have empty screenshot paths; real capture-image checks explicitly skip unavailable images. The synthetic fixture does not certify real capture images.
- Preview-startup/content checks: 110 tests passed.
- Runner checks: 153 tests passed, including actual photo/video control replacement and rejection of undersized remaining actions.
- Focused slideshow run run-guB3YH passed with final input stability before the review coverage addition. It covered six-gallery action absence, normal intervals, manual reduced motion and retained suspensions.
- The live YouTube sanity check passed for both actual embeds at 1366px and 390px: native Play/fullscreen, deferred natural completion during keyboard inspection, replay retention, and later eligible completion. See [live provider evidence](../evidence/issue-125/live-video.json). Third-party availability/autoplay and physical devices remain outside deterministic fixture certification.
- An initial complete run (run-5VShjA) passed the first three checks, then failed because the video-transition test still clicked the deleted action. Commit 2526617 replaced that interaction with retained keyboard inspection and corrected two obsolete responsive-preview presence assertions. The affected video check (59.44s) and preview-strip check (77.01s) then passed with input stability through the standard browser-check helper. A temporary supervisor harness that selected the wrong suite was stopped and supplies no passing evidence.
- A subsequent complete run (run-K1EWnz) passed Skills, About me, placeholder showcases and video, then exposed a touch-test setup issue: actual Tab traversal scrolled the gallery offscreen, correctly suspending progression. Saved diagnostics show the selected Regulus photo unchanged, no hover/focus, and gallery bottom at -56px. Commit c41bfb2 returns the gallery onscreen and asserts that precondition before measuring touch dwell; application behavior is unchanged.
- The final complete suite (run-1WJPuT) passed all 13 checks and final input stability at c41bfb2cc8572b12a9d152a1b5732aee2bd6db3d, with no tracked changes at startup. The affected six-gallery check also passed independently (54.53s) before this run. See the [terminal summary](../evidence/issue-125/browser-summary.json) and [complete output](../evidence/issue-125/browser-output.txt).

Validation input fingerprint: `14a3216d90dd2dfc5c10f6fe3ba793fe719db54789dfcc6de690e23a7cc6952e`. A fresh comparison after the run confirmed the same value. Evidence documentation is excluded from validation inputs; source and checks remain byte-for-byte identical. Publication compares the complete Git tree and recalculates this fingerprint, so an equivalent connector-created commit can have a different SHA without changing tested inputs.

The workstation sandbox failed before command startup with the documented helper_unknown_error; approved escalated execution was used. Git, ripgrep and Git metadata access passed preflight. GitHub CLI authentication was unavailable; the connected GitHub profile confirmed komed-uth for publication. Temporary npm 10.9.4 tooling supported the locked install and validations; npm 12.2.0 failed internally before installation. No credential or sandbox configuration was changed.

The required merge-readiness command queries PR workflow status. It is intentionally omitted because the owner explicitly instructed not to monitor PR validation after PR creation. This PR does not claim merge readiness or authorize merging.

## Visual acceptance

Representative mixed-media and image-only galleries were inspected at desktop and phone widths. The captures retain complete image framing, the normal 12px strip gap and selected-thumbnail styling, with no overlaid action or reserved control row.

| Project showcase | Desktop | Phone |
| --- | --- | --- |
| Regulus the Advent | [1366px](../evidence/issue-125/regulus-1366.jpg) | [390px](../evidence/issue-125/regulus-390.jpg) |
| Vecchio Furioso | [1366px](../evidence/issue-125/vecchio-1366.jpg) | [390px](../evidence/issue-125/vecchio-390.jpg) |
