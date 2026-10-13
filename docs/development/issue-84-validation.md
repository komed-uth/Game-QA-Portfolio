# Issue #84 authorization and validation record

## Authorization status as of 2026-10-13

- **Source:** owner's instruction in the Codex task: “Implement ticket #84 test once implementation is done. Follow the ticket and repo guidance, then review the change against the ticket. After implementation, push working branch and create PR to main.”
- **Implementation and tests:** authorized and completed.
- **Branch push and PR:** authorized; PR is to target `main`.
- **Merge and issue closure:** not authorized.
- **Deployment:** not authorized. Automatic Pages publication is a consequence of a future merge, not separate permission.
- **Separate content or release requirements:** issue #84 leaves portfolio UI and personal copy out of scope; no additional content review was identified for this ticket.
- **Supersedes:** the instruction authorizes the named #84 implementation, tests, push, and PR actions despite the historical #75 implementation hold. It does not authorize merging, closing the issue, or manual deployment.

## Authorization and information-reading scenarios

These are human review scenarios; owner intent is not parsed from arbitrary issue text or labels.

| Scenario | Expected handling | Result for #84 |
| --- | --- | --- |
| An older implementation hold is followed by an explicit owner instruction naming implementation and tests. | Honor the newer instruction for only those named stages and preserve the earlier decision in history. | The current task explicitly authorizes implementation and tests. |
| The owner explicitly authorizes push and PR creation. | Perform those named publishing stages without inferring merge authority. | Push and PR creation are authorized; merge and issue closure remain unauthorized. |
| A newer owner restriction narrows an earlier permission. | Apply the restriction to its named stage; a readiness label does not restore permission. | No newer restriction was present in the current task; `ready-for-agent` is only a triage label. |
| Content is ready or missing separate personal facts. | Keep content readiness separate from action authorization and do not invent facts. | #84 changes no portfolio copy or personal content; this workflow authorization does not satisfy unrelated content review. |
| Merging has an automatic Pages consequence. | Explain that consequence when a merge is authorized; do not treat readiness as merge authorization. | The consequence is documented, but no merge is authorized here. |
| The tracker has a readiness label but no trusted owner action instruction. | Do not infer permission from the label or issue state. | The issue was open and labeled `ready-for-agent`; the current owner's task instruction is the authority for this implementation. |
| Tool discovery or file inspection could return broad/truncated output. | Narrow discovery to relevant tool names and inspect relevant documentation sections; avoid dumping generated report data. | The GitHub issue and its comments were fetched with the repository connector after bounded tool discovery; relevant guidance and changed hunks were read in focused sections. |

## Fixed-point review

- **Base:** `026424ccd46d2188c4d6cd0d1d9922dd9dc0fee8` (`origin/main` when work began).
- **Reviewed commits:** `258276a` and `aaae53a`.
- **Standards review:** 0 documented-standard violations; 0 Fowler baseline findings.
- **Spec review:** 0 remaining code findings after fixing the unsupported `gh pr view --json baseRepository` field, adding recovery actions to non-ready results, and linking bounded inspection from `AGENTS.md`.

## Local validation

- **Tested source commit:** `aaae53aa8800f68fa2a69faa688298520a13154c`.
- **Recorded browser result:** complete portfolio suite `passed`; all 13 selected checks passed; `trackedChanges: false`; preview `local`; final input stability check passed.
- **Input fingerprint:** `862b155a464cdde912c6127f3e87cafb89f26b61fcb343412ce59bd7a32a7b3b`.
- **Build:** `npm run build` passed, including TypeScript and Vite production build.
- **Overlay checks:** `npm run check:overlays` passed (5 parser tests). Real capture overlay checks printed `SKIP` because the supplied reports have empty screenshot path lists.
- **Preview checks:** `npm run check:preview` passed (99 tests).
- **Runner checks:** `npm run check:runner` passed (149 tests).
- **Browser checks:** `npm run check:browser` passed (13 of 13 checks); the recorded summary ended `2026-10-13T14:23:39.790Z`.
- **Dependency readiness:** `npm run check:project-dependencies` passed in this worktree after `npm ci`.
- **Focused readiness checks:** `node --test scripts/check-merge-readiness.test.mjs` passed (14 tests), including real temporary Git repositories and a controlled GitHub CLI boundary.

The browser runner excludes documentation from its input fingerprint. This record is documentation-only; after adding it, recompute the runner fingerprint and confirm it remains the value above. The PR workflow must still produce passing complete evidence for the exact published PR head before the readiness command can return `READY`. No remote CI result or merge is recorded here.

## Remaining limitations

- The real report capture overlay image paths are absent, so only parser and synthetic overlay behavior was validated.
- Merge readiness was exercised with temporary Git repositories and a controlled GitHub CLI boundary locally. Its production check still needs the published PR's exact-head CI artifact after the PR is open.
- No live provider playback check, merge, issue closure, or deployment was performed.
