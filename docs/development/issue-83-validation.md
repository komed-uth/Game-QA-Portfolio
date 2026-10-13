# Ticket #83: workflow and capture validation guardrails

Ticket: [#83](https://github.com/komed-uth/Game-QA-Portfolio/issues/83).
Review base: `fb43284d2fa2b5ddd2a454e7ea43ce84cdd468aa` (`origin/main` at final review).
Validated implementation commit: `499870a6e4587055c2b91b625c7b15a66a96b3e9`.

## Authorization status

> **Authorization status as of 2026-10-13 (issue #83 task)**
> - **Source:** owner instruction in this Codex task and [#83](https://github.com/komed-uth/Game-QA-Portfolio/issues/83)
> - **Implementation and tests:** authorized; completed
> - **Branch push and PR:** authorized by the same instruction
> - **Merge and issue closure:** not included in the instruction
> - **Deployment:** no deployment or merge requested; merging to main triggers the existing Pages publication
> - **Separate content or release requirements:** none beyond the ticket's acceptance criteria
> - **Supersedes:** this instruction applies to #83 implementation, testing, branch push, and PR only

## Acceptance review

- Repository guidance now gives a dated authorization status format with distinct decisions for implementation/testing, push/PR, merge/closure, deployment, and separate content/release requirements. The #76 and #77 historical records use it and link their owner instructions. Older holds remain scoped to the actions that were superseded.
- Validation guidance orders implementation and focused checks before fixed-point review, review corrections before the complete suite, and evidence consolidation before publication. It retains the existing framework and CI sequence.
- A browser regression exercises the production `captureRegion` helper at wide and narrow viewports with horizontal and vertical document scroll. It asserts document-coordinate clips, stable viewport/client dimensions and scroll position, and recognizable content at the top-left, interior, and bottom-right image edges.
- Representative wide and narrow captures were visually inspected; all three colored content regions appear at the expected edges. Pixel assertions independently verify those samples. The controlled regression did not reproduce a helper clipping defect. It does not establish the cause of #76's original production clipping, and no caller-specific selector cause was verified.
- The new diff-whitespace check runs in the existing pull-request workflow before build. CI compares immutable base/head revisions. Local mode separately checks the staged snapshot against the base and unstaged tracked changes, and pins Git's whitespace policy so local `core.whitespace` settings cannot disable trailing-space detection. Tests cover both cases, clean additions, historical whitespace, and missing history.
- No portfolio UI or visual product behavior changed.

## Review

The committed task diff was reviewed against the fixed `origin/main` base above by independent Sol 6.1 high-effort Standards and Spec reviewers. Both reviews have zero remaining actionable findings. The initial Spec findings about workstation-dependent whitespace behavior and staged-only content were fixed and regression-tested. The Standards suggestions about dated authorization blocks, repeated viewport snapshots, and repeated fixture setup were also resolved.

## Validation

Workstation preflight passed in the isolated worktree: Node.js, Git, ripgrep, owner-authenticated GitHub CLI (`komed-uth`), and Git metadata write access were available. The repository's bounded tool-discovery procedure was used. The original checkout and its unrelated uncommitted work were preserved.

Focused regressions passed:

- `node --test scripts/browser/capture-region.test.mjs`: 3 tests passed.
- `node --test scripts/check-diff-whitespace.test.mjs`: 6 tests passed.
- `npm run check:runner`: 131 tests passed.

The complete validation sequence passed against commit `499870a6e4587055c2b91b625c7b15a66a96b3e9`:

- `npm run build`: passed, including TypeScript and production build.
- `npm run check:overlays`: 5 parser tests passed. Real report-image overlay checks were skipped because each supplied `screenshotPathList` is empty; the synthetic overlay integration passed separately in the browser suite.
- `npm run check:preview`: 99 tests passed.
- `npm run check:runner`: 131 tests passed.
- `npm run check:browser`: all 13 selected checks passed; process exit code 0 and final input stability passed.

The durable [browser run summary](../evidence/issue-83/browser-summary.json) records the selected checks, durations, commit, exit code, and input fingerprint. The run began from a clean tracked tree at the validated implementation commit. This record is documentation-only and is excluded from the validation input fingerprint.
