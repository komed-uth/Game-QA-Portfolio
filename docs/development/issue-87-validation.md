# Focused validation, CI visibility and native-scroll preparation

## Scope and authorization

NOVE-13 imports [GitHub #87](https://github.com/komed-uth/Game-QA-Portfolio/issues/87). The owner confirmed latest `main`, then promoted the assigned issue to To do after the agent explicitly requested that promotion if implementation was authorized. Work started from synchronized `origin/main` at `4cc4f2f69cf5be402027a5a54a2663eb6fb38062` on 2026-10-20.

> **Authorization status as of 2026-10-20**
> - **Source:** Multica NOVE-13 owner comment "you may use latest main" and subsequent To do promotion in response to the implementation-start request.
> - **Implementation and tests:** proceeding within the assigned issue's focused checks, bounded CI observation and native-scroll preparation scope.
> - **Branch push and PR:** draft PR handoff under the assigned Spec Implementer workflow.
> - **Merge and issue closure:** held for human review.
> - **Deployment:** not authorized.
> - **Separate content or release requirements:** no content changes requested; existing release requirements remain separate.
> - **Supersedes:** earlier implementation hold only for this assigned scope. No CI-watch service, merge or deployment is authorized.

The historical [#27 decision pointer](https://github.com/komed-uth/Game-QA-Portfolio/issues/27#issuecomment-6293073620) links the original #27/#45 choice, PR #78 and its evidence, and the later #90/PR #98 caption removal and #125/PR #135 slideshow-control removal. No older interface is restored.

The owner explicitly requested continuing this implementation after the usage-limit interruption on 2026-10-21. Merge, issue closure and deployment remain separate human decisions.

## Environment

The installed Node 14 cannot run this repository's current tooling. A checksum-verified portable Node 22.21.0 and Playwright Chromium were prepared inside the workspace without changing global configuration. Each browser worktree installs its own locked project dependencies. Sandbox ancestor-directory restrictions prevented Vite config loading; the documented approved execution fallback allowed the production build. Git uses a process-scoped safe-directory setting rather than changing global configuration.

The workstation preflight passed Git, ripgrep and metadata access; GitHub CLI is absent. The connected GitHub account is `komed-uth`. Controlled CLI fixtures exercise CI reporting without live credentials. Live CI following through `gh` cannot be certified on this workstation; publication and local tests are separate evidence from a live current-head CI result.

## Acceptance evidence

Implementation includes supported `--video-only`, `--gameplay-layout-only` and `--gallery-keyboard-only` selectors with package commands and checkout dependency guards. The complete suite retains its thirteen existing groups. Focused layout and keyboard commands reuse existing rendered assertions. Native-scroll preparation has two actual callers and retains a separate activation/dialog assertion. The CI observer delegates exact-head evidence and target-ancestry decisions to the existing readiness command.

Initial focused evidence:

| Check | Result |
| --- | --- |
| Selector/package/process fixtures | 159 passed, including invalid/conflicting selectors before browser startup. Each added selector and package mapping was observed red before implementation. |
| Focused gameplay layout | Passed eleven widths in both motion modes, 191.90 seconds. |
| Focused gallery keyboard | Passed shared resize, focus, preview traversal and modal-return scenario, 36.19 seconds. One earlier preview startup timed out before checks. |
| Native-scroll extraction | Full placeholder suite passed in 623.36 seconds before the noninteractive-target guard was hardened. The final guard then passed three trials across all three projects; existing native evidence-interaction reproduction also passed. Final complete validation covers the final shared helper. |
| CI observer | 22 tests passed after the stale-job snapshot correction, including controlled real readiness success and rejection, head/run/attempt changes, deadlines, interruption and failure evidence. |
| Focused video | Passed the original video group in 101.61 seconds through the supported selector, owned local preview and terminal input-stability gate. Fingerprint: `a9892ca944e15987246ca15003de8410ba137ba89cabe0f158a9533b7f9a9601`. Its subprocess Git metadata was unavailable, so this is behavioral evidence rather than a clean-commit attestation. |

## Video observation correction

The new video selector exposed an existing test observation race on unchanged baseline source. The isolated original transition check reproduced the same overlap failure on main in 22.91 seconds. Native CSS continued through its 300ms fade while the JavaScript clock was paused; separate host calls sampled opacity and player cleanup at different moments, sometimes after the fade had ended.

The test now arms a bounded native browser sampler before each trigger and captures the same opacity, backdrop, duration, easing, inertness, geometry and outgoing-player lifetime assertions together. The interruption scenario observes the requested selection's DOM commitment, dispatches the original stale animation event, then samples continuity in a subsequent native task. No animation is paused, forced or shortened. A scratch queued-removal fault injection failed the exact interruption assertion, demonstrating that incorrect asynchronous cleanup remains detectable. Production application files are unchanged.

## Review

Fixed baseline: `4cc4f2f69cf5be402027a5a54a2663eb6fb38062`.

- Standards review through `633c102`: no findings.
- Spec review through `633c102`: one P2 finding. A run could finish between job/run API reads, making watch reject a stale unfinished-job snapshot. Commit `1707255` retains observation under the same deadline and pinned identity; its public subprocess regression was observed red then green.
- Supplementary Standards review of `633c102...49dfc824`: no findings.
- Supplementary Spec review of the same committed diff: no remaining findings; the CI correction and atomic video assertions preserve the required boundaries.

Reviewed source: `49dfc824d98df9c14f2bca49d07dfbeb28f59e6e`. Final complete validation is recorded below when terminal results are available. Running checks and superseded attempts do not establish acceptance.

## Held-image fixture correction

The first complete attempt at `80d1ee0` passed eight groups, then failed in the unchanged Vecchio delayed-image fixture while `page.reload()` waited for `load`. The fixture deliberately held an image response until a subsequent selection. The original isolated scenario reproduced the timeout: its intercepted browser request spanned 30,099ms, while every other request finished within 1,183ms; releasing the held response in cleanup immediately allowed `load`. A minimal probe did not reproduce this scheduling-dependent failure and was not treated as proof.

Commit `3d507bb` changes only that fixture reload to wait for `domcontentloaded`; the existing rendered photo readiness check and every loading, failure, retry, selection and cleanup assertion remain. The original isolated scenario passed in 26.11 seconds. The supported evidence command then passed both groups on clean `3d507bb`, with its own local preview and terminal input-stability check: evidence-modal 210.57 seconds and evidence-interactions 15.00 seconds. Fingerprint: `7a2d90662e38d9893c182e933c2d65e42bcb179133d72630692c5b8f8fcbc729`.

Supplementary Standards and Spec reviews of `80d1ee0...3d507bb` each returned no findings. This correction adds no production change, arbitrary delay, automatic retry or reduced assertion.

## Final validation — 2026-10-21

Production build/type checking passed, overlay checks passed with five explicit real-capture skips because the report capture lists are empty, all 177 preview tests passed, and all 242 runner tests passed. Synthetic overlay coverage does not certify the missing real capture images.

The corrected complete attempt at clean `3d507bb` recorded twelve passed groups before the usage-limit interruption during report-interactions. It has no terminal summary or final input-stability result and is not complete acceptance evidence. Its input fingerprint was `ba7aadc45483b39d075f4323b451a1f5eb27da30f38ce4984a9f251c5038ded6`. No browser or preview process from that attempt remained at the 2026-10-22 resume. A new complete run was required; no source or assertion changes were made for the interruption.

## Complete validation - 2026-10-22

The supported complete browser command passed all thirteen groups with exit code 0, owned local preview cleanup and the final input-stability gate. The terminal summary records clean commit `fed5fdcb3bbde0b64db7cca8c1fa4373b149f07c`, fingerprint `ba7aadc45483b39d075f4323b451a1f5eb27da30f38ce4984a9f251c5038ded6`, and 1762.60 seconds overall. The portable npm files and locked project dependencies were restored after the runtime resumed without installed dependencies; the production build and validation inputs remained unchanged.

| Group | Result | Duration |
| --- | --- | --- |
| skills | Passed | 102.49s |
| about-me | Passed | 32.97s |
| placeholder-showcases | Passed | 674.03s |
| video | Passed | 148.09s |
| slideshow | Passed | 203.62s |
| photos | Passed | 34.76s |
| gameplay-previews | Passed | 120.47s |
| gameplay-fixtures | Passed | 46.33s |
| evidence-modal | Passed | 217.84s |
| evidence-interactions | Passed | 14.67s |
| report-layout | Passed | 26.16s |
| overlay-fixture | Passed | 12.98s |
| report-interactions | Passed | 98.62s |

This evidence update changes documentation only. Publication preserves the reviewed source tree; the published tree and final validation-input fingerprint are checked before handoff. API-created publication commit metadata differs from the local tested commit. Remote CI and merge readiness require their own current-head evidence.

Rendered touch coverage uses Chromium emulation, and video provider coverage uses controlled fixtures. Neither establishes physical-device certification or live provider availability. Real report capture images remain outside the synthetic overlay coverage described above.
