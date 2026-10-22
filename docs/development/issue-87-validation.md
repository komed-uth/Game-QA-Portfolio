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
| CI observer | The original 22 tests passed after the stale-job snapshot correction, including controlled real readiness success and rejection, head/run/attempt changes, deadlines and failure evidence. Those tests did not send interruption signals; they did not establish interruption coverage. The revision evidence below records the subsequent signal tests. |
| Focused video | Passed the original video group in 101.61 seconds through the supported selector, owned local preview and terminal input-stability gate. Fingerprint: `a9892ca944e15987246ca15003de8410ba137ba89cabe0f158a9533b7f9a9601`. Its subprocess Git metadata was unavailable, so this is behavioral evidence rather than a clean-commit attestation. |

## CI interruption revision, 2026-10-22

The combined runner later exposed a test assumption under host load: its three-second observation deadline can expire before any checkpoint metadata arrives. That timeout case now permits zero checkpoints while retaining the same deadline, unsuccessful outcome and bounded termination assertion. A separate controlled pending-to-identical-pending-to-success sequence verifies that unchanged job, step and workflow checkpoints each appear exactly once. Disabling checkpoint deduplication in a scratch observer produced the expected `2 !== 1` failure; no observer implementation or deadline changed. After this test correction, the observer suite passed all 26 tests in 93.56 seconds against the integrated revision; the combined runner result remains a separate validation step.

`node --test scripts/observe-ci.test.mjs` passed all 26 tests in 61.14 seconds, including four new public subprocess cases: SIGINT and SIGTERM during an active polling request, and each signal while the real readiness command owns an active GitHub CLI subprocess. The controlled CLI starts a confirmed long-lived descendant before signalling. Each case requires exit code 1 through the observer's interruption handler, an explicit unknown-success diagnostic, no `READY:` result, and disappearance of every owned command/descendant PID (including readiness) within five seconds of the signal. The observer's separate 90-second deadline cannot satisfy that interruption bound. The observer implementation needed no change.

On Windows, killing a process does not deliver Node's signal event. A test-only IPC preload emits SIGINT or SIGTERM in the observer process, exercising its installed signal handler; the real CLI, readiness command and process-tree cleanup remain unchanged. POSIX runs send the OS signal directly, without skipping either phase. These executed results are Windows evidence; POSIX execution remains a CI responsibility. The successful complete test run used the approved execution fallback because the sandbox denied readiness process-tree termination. An isolated scratch fault that disabled cancellation failed the five-second polling interruption assertion as expected, and its fixture processes were cleaned up before completion. Scratch faults are excluded from the passing count.

## Video overlap review revision, 2026-10-22

Strict review found that CI run [39761772729, attempt 1](https://github.com/komed-uth/Game-QA-Portfolio/actions/runs/39761772729/attempts/1) failed the photo-overlap assertion at the published head `4df98fa1023d98e0e6e175bb120473ee52ad85b1`. The earlier local complete pass remains historical evidence and does not resolve that failed CI result.

The shortened original transition sequence passed ten local Windows trials. The CI trace shows the incoming photo inserted shortly after decode release, then eventually ready, but does not record the sampler's private state. A scheduling stress probe kept the original 10,000-task limit intact, paused the incoming CSS animation for 600ms in scratch code, then allowed it to resume naturally. The original sampler exhausted all 10,000 tasks at opacity 0, retained no overlap sample, and failed the original assertion. This demonstrates a false-negative under delayed rendering; task-budget exhaustion in the actual CI attempt remains an inference, not a directly observed counter value.

Commit `86d7ea0` replaces that host-throughput budget with native 16ms scheduled observations, one pending callback, a two-second lifetime and abort cleanup. The corrected sampler passed the same scheduling stress. Separate scratch faults still failed the original assertions for missing animation, transparent backdrop and premature outgoing-player destruction. These diagnostic pauses and faults are excluded from passing coverage. Production code, the 300ms duration, easing, opacity, geometry, inertness, outgoing-player lifetime and interrupted-fade assertions are unchanged.

The supported focused video command passed in 105.97 seconds on clean integrated commit `3de95c5504260365a43ba069bea33e8b9a1d1a70`, with its owned local preview and terminal input-stability check. Fingerprint: `df4859ca56eef9a3a0652da0ef9f8c203b2dd41dbd0824673b497c742d1c21f7`. An earlier attempt was correctly marked obsolete after unrelated test inputs were merged during execution and is not acceptance evidence. Revised complete validation and current-head CI remain separate gates, recorded at handoff when available.

Internal Spec review then identified that starting the two-second lifetime at arming could consume it during legitimate decode preparation. Commit `e2dd4c8` starts that lifetime only when a fading element appears; the preparation phase queues no native sampling callbacks and remains owned by the scenario's existing bounded waits, next-arm cleanup and browser-context cleanup. A retained rendered regression holds decode for 2.1 seconds in the existing desktop fixture before release. It failed the original overlap assertion before this correction and passed afterward, without changing the fade or its assertions. The supported focused video command then passed in 143.41 seconds on clean `e2dd4c852ed0c012414efdac84d06c1fe4d9b31a`, fingerprint `ff017e01eaca37005bb17672c5a722d9e9a6c405f615a30177c62796e19d7547`, including terminal input stability and owned-preview cleanup.

## Revision integration validation - 2026-10-22 UTC

The final runner passed all 246 tests, with no failures or skips, in 308.10 seconds on integrated `671a997df2a738cc8341c5758736c83b220a1d0a`. This includes the four interruption cases. An earlier combined attempt passed 245 of 246 tests but exposed the three-second checkpoint assumption corrected above; another attempt lacked the local browser-path setting and is not passing evidence. Production build/type checking, the whitespace guard, overlay checks and all 177 preview tests passed. The five empty real-capture lists remain explicit skips, not certified images.

The supported complete browser command then passed all thirteen groups with exit 0, owned local preview cleanup and the final input-stability gate. Its terminal summary identifies clean `671a997df2a738cc8341c5758736c83b220a1d0a`, fingerprint `a30fc2042927cbfc079f32c762ee455c8a9facea661053b6c78b81742f28814a`, and 1485.75 seconds overall. This is revised-source evidence, separate from the historical complete pass above.

| Group | Result | Duration |
| --- | --- | --- |
| skills | Passed | 97.48s |
| about-me | Passed | 32.45s |
| placeholder-showcases | Passed | 458.63s |
| video | Passed | 84.61s |
| slideshow | Passed | 210.46s |
| photos | Passed | 36.60s |
| gameplay-previews | Passed | 117.24s |
| gameplay-fixtures | Passed | 46.45s |
| evidence-modal | Passed | 229.26s |
| evidence-interactions | Passed | 16.14s |
| report-layout | Passed | 22.96s |
| overlay-fixture | Passed | 12.36s |
| report-interactions | Passed | 99.45s |

Content-workflow validation ran in an isolated worktree at `09c0f2e` (identical production and content-harness source). The aggregate command exited 1: earlier modules passed, but the final layout module reached the existing five-second preview-startup timeout before assertions, with no startup output establishing its cause. The unchanged standalone layout command subsequently exited 0 and passed its layout/live-edit assertions. These are separate results; the aggregate command is not reported as passing. Canonical source was restored, and a fresh production rebuild exited 0 with HTML, JS and CSS byte-identical to the main validation build. An earlier interrupted content attempt had no terminal result and is excluded.

Supplementary Standards and Spec reviews of `09c0f2e...6853ae1` each returned no findings. They confirmed that bounded timeout failure and exact checkpoint deduplication remain independently asserted, without changing the observer implementation. The previous sampling-lifetime finding is resolved. Final evidence edits affect documentation only; publication tree equality and the unchanged input fingerprint are verified separately. Corrected-head remote CI, actual POSIX signal execution and exact-head merge readiness remain distinct gates, not claims established by the Windows local results. Merge, issue closure and deployment remain held for human authorization.

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
