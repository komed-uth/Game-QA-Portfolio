# Single-file content editing (#123)

Implemented in the isolated `codex/centralized-content` checkout from published main `d9385e64ea05fe5fc9c0226da1d2d314b9157a4b` on 2026-10-14. Existing changes in the primary checkout were preserved.

## Result

`src/data.ts` owns the shared site, Portfolio section list, all six project records and their galleries, shared report/PIX evidence, Skills and About me. Its labeled sections and typed exports replace the six former `src/content/` editing files. Page/component imports, development validation, diagnostic file locations, build validation, browser fixtures and the editing guide now use the single file.

A comparison of all six exported definitions against the original main files passed: approved copy, identifiers, media ordering, paths, store destinations, evidence configuration and page sections are unchanged.

## Verification

The reviewed implementation snapshot is commit [`88f5f6223bf685892d451a848ed77204560abb2a`](https://github.com/komed-uth/Game-QA-Portfolio/commit/88f5f6223bf685892d451a848ed77204560abb2a) on `codex/centralized-content`.

- **Production/TypeScript build:** passed in the independent review of commit `88f5f62`. The review summary did not include a runner ID or raw build log.
- **Preview checks:** 107 passed, 0 failed. Saved output: [preview-check.log](issue123/runs/preview-check.log). The captured output has no runner-generated ID or input fingerprint.
- **Content editing workflow:** the independent reviewer reported `npm run check:content-workflow` passed, covering About me/shared content, corrective saves, 28 invalid project/evidence/Portfolio cases, six showcases and placeholder edits, 15 invalid Skills cases, and layout/preset/live-edit workflows. The review supplied no unique runner ID or raw log; see [independent-review.md](issue123/runs/independent-review.md) for the source and scope.
- **Full browser suite:** passed on the reviewed source snapshot. Run ID: `run-qrrTH8`. Its recorded validation-input fingerprint is `88558b01972ffd4152a89e9a50cd35c5567547546e31f923c455ca3e9f372899`. The saved [summary](issue123/runs/run-qrrTH8/summary.json), [output](issue123/runs/run-qrrTH8/output.log), and [progress log](issue123/runs/run-qrrTH8/progress.jsonl) identify all 13 checks and the final successful, stable-input result.

The browser overlay check used the existing synthetic fixture. It does not certify missing original report-owned overlay capture images or physical devices. The independent reviewer did not rerun the full browser suite.

## Authorization status as of 2026-10-14

> **Authorization status as of 2026-10-14**
> - **Source:** Owner instruction in the PR #124 revision request dated 2026-10-14, which asks for this revision and directs use of the existing PR-publication authorization. The published snapshot and opened PR are recorded in [issue #123 comment 6167842789](https://github.com/komed-uth/Game-QA-Portfolio/issues/123#issuecomment-6167842789), posted 2026-10-14 12:00:30 UTC.
> - **Implementation and tests:** implementation completed and validated for commit `88f5f62`; this revision updates validation documentation only. No tests are claimed for the documentation-only change.
> - **Branch push and PR:** authorized for this PR revision by the owner instruction above.
> - **Merge and issue closure:** held; a separate instruction is required.
> - **Deployment:** held; a separate instruction is required. Merging to `main` triggers the repository's GitHub Pages deployment workflow.
> - **Separate content or release requirements:** none recorded for #123; the PR proposes to close #123 when merged.
> - **Supersedes:** the #123 issue body's earlier hold on publishing, for branch push and PR updates only. Merge, issue closure, and deployment remain separately held.
