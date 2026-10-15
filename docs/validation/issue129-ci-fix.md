# PR #133 CI gallery target-check fix

Authorization: owner requested verification of the failed GitHub run, then explicitly requested the fix. This authorizes diagnosis, implementation/tests and updating the existing PR branch. Merge, issue closure and deployment remain unauthorized. The original instruction against ongoing PR workflow monitoring remains in effect after publication; the failed run was inspected on the owner's later request.

> **Authorization status as of 2026-10-15**
> - **Source:** Owner requested verification of the failed validation, then asked to fix it.
> - **Implementation and tests:** Authorized; completed and under final validation.
> - **Branch push and PR:** Authorized to update existing PR #133.
> - **Merge and issue closure:** Not authorized.
> - **Deployment:** Not authorized.
> - **Separate content or release requirements:** Preserve #129 contact content and all production gallery behavior.
> - **Supersedes:** The earlier restriction on inspecting workflow status only for the requested failed-run investigation; no ongoing monitoring is introduced.

## Failure and cause

[Validate pull requests run 38677456527, job 116234205011](https://github.com/komed-uth/Game-QA-Portfolio/actions/runs/38677456527/job/116234205011) failed on PR head `d3583db62168fe845d3e88b790c991a9799c8f80`. Build, content workflow, runner and the Contact acceptance check passed. Evidence-modal timed out for 30 seconds waiting for Father, Son & Holy Guns gallery `button.nth(5)` at `project-showcase-layout.mjs:57`.

The layout check enumerated live positional locators with `all()`, then awaited each bounding box separately. A photo/video change can remove the image opener between those calls, shifting positions or leaving the final locator absent. A short reproduction exercising the real portfolio's photo/video controls reproduced a null bounding box at the same loop. The regression test failed against the extracted unchanged loop in about 1.4 seconds.

## Fix and regression coverage

Measure button visibility and geometry together in one synchronous browser task. Exclude controls that are not rendered or have hidden/collapsed visibility; require at least one rendered action and retain the 44px minimum for every rendered action. Zero-sized visible controls still fail. Production portfolio code, gallery behavior and Contact content are unchanged.

The runner suite now includes a rendered-portfolio regression with 500 target checks during rapid photo/video switching. A companion case verifies that 0px and 20px visible actions are rejected. Both pass after the fix, and the original full-layout stress reproduction passes 20 iterations. Build before runner checks because this regression uses the production preview and the existing controlled YouTube boundary.

Independent GPT-6.1 Sol high-effort Standards and Spec reviews inspected commit `e3ddd54fab027c742b505c2df6bad7d126448c4c` against fixed PR head `d3583db62168fe845d3e88b790c991a9799c8f80`. Standards: 0 findings. Spec: 0 findings. Both confirmed the coverage remains meaningful and runtime behavior is unchanged. The focused and complete suites passed; final acceptance evidence is recorded below.

## Validation progress

- Focused evidence suite: PASS, including the exact previously failing evidence-modal phase and final input stability. [Summary](issue129-ci-fix/focused-evidence-summary.json) | [Output](issue129-ci-fix/focused-evidence-output.txt).
- [Production build/typecheck/content validation](issue129-ci-fix/build-output.txt), [overlay checks](issue129-ci-fix/check-overlays-output.txt), [preview checks: 110/110](issue129-ci-fix/check-preview-output.txt), and [expanded runner checks: 153/153](issue129-ci-fix/check-runner-output.txt): PASS.
- The prior CI content-editing workflow passed on the failed run; this repair changes no content definitions, content validator, renderer or workflow.

## Final complete validation

The complete portfolio suite passed all 13 checks, including the previously failing evidence-modal phase and the final input-stability gate. [Terminal summary](issue129-ci-fix/browser-summary.json) | [Browser output](issue129-ci-fix/browser-output.txt).

Tested commit: `1441a74df009cb4396bf9fd9c6e9b3360ce544b6`. Starting tracked changes: `false`. Preview: local. Terminal status: `passed`, exit 0. Input fingerprint: `5dd4a702abc1b35e31884850501fcf5d701a7c83f428b1d3dbef370e0b96b4f2`. A fresh post-run fingerprint matches. Later evidence-only changes are excluded from the input fingerprint.

Publication uses the owner-authenticated connector because Git credentials are unavailable in this execution context. The new remote commit must have the exact final local tree and preserve the current published head with an expected-SHA check; local history is synchronized afterwards with reviewed commits preserved on a backup branch. No merge, issue closure, deployment or ongoing PR-workflow monitoring is performed.
