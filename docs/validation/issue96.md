# Ticket #96 validation

Date: 2026-10-13. Ticket: https://github.com/komed-uth/Game-QA-Portfolio/issues/96.
Specification: https://github.com/komed-uth/Game-QA-Portfolio/issues/94.
Fixed comparison base: main at `29a8a4334461e0fe344cada378e379184f7c0071`.
Reviewed application correction: `e550673`.
Final validation input commit: `2ee781a731da6f479571eab67130c7bfbed755f9`.

> **Authorization status as of 2026-10-13**
> - **Source:** owner instruction in this chat: implement #96, test after implementation, review, push the working branch, and create a PR to main.
> - **Implementation and tests:** completed; all required final checks passed.
> - **Branch push and PR:** completed; `codex/issue-96` pushed and [PR #113](https://github.com/komed-uth/Game-QA-Portfolio/pull/113) opened to main.
> - **Merge and issue closure:** held; not authorized by this instruction.
> - **Deployment:** held; no website deployment requested.
> - **Separate content or release requirements:** existing content requirements remain outside #96.
> - **Supersedes:** the 2026-10-12 hold in #96/#94 only for implementation, testing, branch push, and PR creation.

## Change and acceptance

The shared gameplay presentation now coordinates images and videos. Incoming photos wait for load/decode; incoming videos wait for playback rather than player-ready. Both directions use the existing 300ms ease-in/out overlapping canvas, stable geometry and complete framing. Selection and announcements follow the latest request immediately. Outgoing controls are inaccessible; outgoing videos remain playing through their visible fade and are destroyed once covered. Completed backdrop fades release lower players even if a newer request is still loading or failed.

Blocked autoplay reveals the native player. Eight seconds after the latest selection or Retry, the gallery reveals a usable player or a recoverable error with Retry. Unrelated pause/viewport renders do not postpone the deadline. Playback, superseding selection and removal cancel the request. Old readiness, error, completion and deadline results cannot revive abandoned players. Hung API downloads are bounded and can be fetched again by Retry. Unavailable media is never skipped automatically.

Existing photo inspection and five-second/6.5-second dwell begin only after completed presentation. Existing completion/replay, pause/hover/focus/drag/inspection/visibility/offscreen rules, muted revisits, uninterrupted active reselection, cycles/wraparound, independent galleries, responsive selection and reduced motion remain effective. Project content, audio preferences, gallery controls, preview browsing and reports are unaffected. No frame capture, video-to-video transition or custom production player control is introduced.

## Evidence

Tests were added after implementation at the existing rendered production-gallery/player boundary, as requested.

- **Before:** an isolated build using main's original gallery, photo hook, player and CSS fails the readiness assertion: a player-ready video removes the outgoing photo before playback (`expected 1 retained photo; actual 0`). Working source and production build were not overwritten. See [baseline result](../evidence/issue96/baseline.json).
- **Focused video:** passed after the review correction. Computed intermediate opacity, 300ms duration/easing, opaque backdrops, stable dimensions and accessible layers verify both directions. Controlled decode/playback waits, buffering, blocked native Play, exact usable/unavailable eight-second outcomes, unrelated renders, failure, fresh Retry, interruption around deadlines/readiness, active fades, hung API recovery and stale events are covered. The held-decode regression verifies covered outgoing video destruction without making the pending photo inspectable.
- **Existing video cycles:** both complete sequences, muted revisits, no incomplete-media skipping, replay cancellation, single deferred completion across all suspension conditions, manual override, explicit Pause, reduced-motion Resume, route cleanup and gallery independence passed.
- **Photo regressions:** passed, retaining #95 overlap/decode/error/Retry/inspection/continuity/accessibility/framing checks and all image-only consumers.
- **Production/type-check build:** passed on final relevant source.
- **Preview startup:** all 99 tests passed.
- **Runner:** all 131 tests passed.
- **Overlay readiness:** five parser tests passed. Real capture overlays remain explicitly skipped because the supplied screenshot lists are empty; the synthetic integration fixture is separate evidence.
- **Complete browser suite:** all 13 checks passed on `2ee781a` with final input stability confirmed. Fingerprint: `f9d6bae20a4f08206bead543a52ac7097a2f1e1a0c120a8e50a32a4332329b3a`. See [persisted summary](../evidence/issue96/browser-summary.json) and [output](../evidence/issue96/browser-output.txt). The initial complete run failed an older evidence assertion that checked iframe count before the new request committed its player; its saved failure snapshot already showed the iframe present. The test now waits for actual attachment and uses the existing controlled provider. Both focused evidence checks passed afterward, including all six reports, images, touch interactions and eleven responsive layouts. See [initial unsuccessful run](../evidence/issue96/initial-browser-summary.json) and [passing focused evidence](../evidence/issue96/evidence-summary.json). The unsuccessful run does not establish a portfolio pass. A subsequent complete run was stopped by the usage-limit interruption before terminal evidence was saved; its [last checkpoints](../evidence/issue96/interrupted-browser-progress.jsonl) are incomplete evidence. The owner requested continuation, and the restarted complete suite passed on unchanged final inputs. The final fingerprint was checked again before publication; only evidence/documentation changed after the tested commit.

[Desktop photo-to-video overlap](../evidence/issue96/desktop-photo-to-video.png) and [mobile video-to-photo overlap](../evidence/issue96/mobile-video-to-photo.png) were captured from the final production build and visually inspected. These clearly labelled provider fixtures pause CSS at 150ms for documentation; automated tests observe running overlap/completion. Full-media framing, stable viewer geometry and preview selection remain visible.

## Live YouTube

The separate network-dependent check passed actual native manual Play, player readiness, genuine completion while slideshow-paused, replay retention, and eligible completion advancing to the first photo in both galleries at 1366px and 390px. Native fullscreen controls were present. See [actual player evidence](../evidence/issue96/live-video.json).

Initial native-control attempts used a selector absent from this environment's alternate YouTube layout. A later attempt located the controls but encountered their hidden presentation. The final check supports both provider layouts and reveals the player's own controls through hover or its native keyboard action before pressing Play. These earlier unsuccessful checks do not certify native behavior; the final four gallery/viewport cases passed. Fixture results remain separate from network/player evidence. Viewport checks are not physical-device certification or a guarantee of future provider availability.

## Review

The code-review skill ran independent Standards and Spec agents with Sol 6.1 at high effort against the fixed main base, then re-reviewed the application correction and final native/evidence test updates through `2ee781a`.

### Standards

No remaining findings. The optional duplicated player-lookup helper was consolidated into the shared provider fixture helper.

### Spec

One initial P2 finding: video-to-photo presentation interrupted by a slow third request retained a playing video after the covering photo became opaque. Fixed by handling backdrop completion separately from latest-request readiness. The rendered held-decode regression checks destruction of the hidden player and continued loading/inspection gating for the latest selection. The reviewer confirmed the finding resolved; no remaining Spec findings.

## Limits and risk

This reversible change affects shared gameplay media presentation and provider recovery. The deterministic suite verifies application behavior; actual YouTube checks cover only this browser/network session. Supplied real report capture files remain unavailable. Unrelated local changes were preserved in the original checkout; this branch starts from synchronized main. No merge, issue closure or website deployment was performed.
