# Deployment validation and agent tooling

Implementation of NOVE-15 / [GitHub #85](https://github.com/komed-uth/Game-QA-Portfolio/issues/85).

## Authorization status as of 2026-10-27

- Source: owner comment on NOVE-15, thread `01a17cb0-cb05-78f8-ad7c-5a72059767a0`: “Release implementation hold for this scope, move this issue to in-progress and continue the process”.
- Implementation and tests: authorized; implementation underway.
- Branch push and PR: permitted for the reviewable implementation handoff under the assigned issue workflow.
- Merge and issue closure: held for independent review and owner action.
- Deployment: held. Merging into `main` has an existing automatic Pages consequence; no merge or deployment is performed here.
- Supersedes: the earlier implementation hold only for NOVE-15's scope. It does not release other issues' holds.

## Baseline and implementation

The clean checkout was synchronized with `origin/main` at `daba632994b531e9f2c34e1a738275ac27a6f615`, the fixed review baseline. The task integration branch is `agent/spec-implementer-neo/b21971a2c651`.

PR and Pages workflows consume the same composite validation sequence. Pages checks out the exact triggering commit and verifies the final complete browser summary against the current clean commit and current source/build fingerprint before uploading `dist`. The existing automatic-main and manual triggers, destination, environment and permission boundaries remain. Diagnostic artifacts upload on failure; Pages artifact upload and deployment require successful preceding validation.

`check:fixtures` uses `--gameplay-fixtures-only` through the existing recorded runner. It selects the existing gameplay media-list fixture and preserves complete/gameplay coverage and invalid-selector refusal.

Workstation preflight probes the usable npm launcher and reports CLI and connector access separately. CLI and connector merge preparation share the same decision path and complete browser-summary validator. Connector readiness requires fresh final observations after a bounded foreground challenge; an older supplied snapshot cannot satisfy that step. The latest workflow run must identify the exact PR head, independently of matching artifact contents. Readiness also reports the configured automatic Pages consequence before `READY`.

The validation reference is a task index with compatible forwarding headings. Task branches retain startup recovery, Git history, testing/evidence, publishing/readiness and bounded inspection contracts. Executable discovery/inspection examples and actual Windows PowerShell invocation tests cover exact named arguments, spaced checkout paths, child status, and retained source bytes.

## Startup evidence

The sandbox denied Node ancestor-directory access (`EPERM`) and Git ownership checks. Approved host execution restored repository access without editing global configuration. The system Node is v14.18.1 and cannot run `node --test`. An existing portable Node v22.21.0 from the completed NOVE-13 task was reused through process-local PATH. PowerShell blocks `npm.ps1`; the existing `npm.cmd` launcher works. Locked project dependencies and the specified Playwright browser were prepared for this checkout. GitHub CLI is absent; the connected GitHub profile independently identifies `komed-uth`. That identity observation alone is not complete merge-readiness evidence.

Fresh real connector reads verified PR, check, Actions and artifact access, including a successful artifact download. With those private session observations, workstation preflight passed while still reporting the unavailable CLI. This is startup capability evidence, not a claim that a live PR is merge-ready. Native Git has no usable push credentials; the owner-authenticated connector is the publication path.

## Validation

- Fixture selection matrix: 185 tests pass; recorded-run regressions: 7 pass.
- Pages eligibility and stable-input regressions: 29 tests pass, covering exact commit, clean source, altered `dist`, complete selected checks, process result, terminal evidence, missing/malformed evidence, and failed/canceled/interrupted/incomplete/obsolete/running latest results despite an earlier pass.
- Production build, canonical schema validation and TypeScript check: pass. Schema validation is distinct from #119's independent canonical acceptance gate.
- Final integration validation and two-axis review are recorded below when completed.

## Integration acceptance on 2026-10-28

The supported task-local Node v22.21.0 / npm 10.9.4 runtime was restored from an existing checksum-verified archive. Recovery changed no global configuration. An earlier legacy-npm lifecycle failure and a cold preview-start timeout were superseded by the successful supported-runtime runs below; no assertion or startup timeout was weakened.

- All registered runner tests: **345 passed, zero failed**, with file concurrency limited to two. This includes controlled automatic/manual Pages publication, exact workflow-run head provenance, terminal-summary validation, connector final observations, bounded inspection, and actual Windows invocation tests.
- Content-editing workflow: passed all About me, contact, project, evidence, Portfolio, Skills, recovery, layout, live-update, and negative-validation scenarios; canonical source and build restored.
- Fresh production build: passed schema validation, TypeScript checking, and Vite compilation.
- Earlier retained preview acceptance: 203 tests passed; overlay checks passed. The complete rendered run below also started its own production preview successfully.
- Focused gameplay media-list fixture: passed, including empty/single/long lists, finite browsing, selection, resize, touch, and interruption scenarios.
- Complete recorded browser suite: **all 13 selected groups passed**, exit code zero, from `2026-10-28T05:01:27.272Z` to `2026-10-28T05:21:05.819Z` (19 minutes 39 seconds). Skills, About me, placeholders, video, slideshow, photos, gameplay previews/fixtures, evidence modal/interactions, report layout, synthetic overlays, and report interactions all completed.
- Local publication-evidence eligibility: passed against exact clean tracked commit `5b21bea39235562bdaf2ed85521cd8c5e7a75c57` and unchanged source/build fingerprint `4627d980faf2291595bdf962d8f29c1c23800a04b350cd858fcecd16df9d7609`. Both the focused and complete runs identify that commit and fingerprint.
- `git diff --check` against the fixed baseline: passed.

The complete browser summary is `.scratch/browser-runs/run-5GVDjs/summary.json`; the focused summary is `.scratch/browser-runs/run-lbS3pc/summary.json`. These are generated local evidence, not committed source. The older focused run marked obsolete is not counted as acceptance evidence. Real capture-image overlays remain unverified because the retained reports have empty screenshot lists; synthetic overlay coverage passed.

This evidence records the tested local implementation commit. A subsequent documentation-only evidence commit and connector publication have different commit identities, so these summaries must not be represented as exact-head readiness evidence for the published PR. Published-head CI and independent review are still required. The successful local eligibility check validates the implemented evidence contract; it does not certify the absent #119 canonical gate or authorize publishing.

## Standards

The fixed-point standards review covered `daba632994b531e9f2c34e1a738275ac27a6f615` through the integrated changes and supplemental fixture/provenance corrections ending at `4202e3a`. Result: zero findings. The initial duplicated summary predicates were replaced by one shared complete-browser-summary validator. No documented-standard breach or actionable baseline smell remains.

## Spec

Two requirements remain dependency blocked: wiring #119's independent canonical content-expectation command before expensive rendered validation and Pages eligibility, and certifying the Windows recipe against #119's shared invocation helper. No additional actionable implementation defect or scope creep remained after the final review and provenance supplement.

Controlled nonpublishing workflow fixtures now exercise both automatic and manual publication paths with real eligibility verification against disposable Git/source/build evidence. Failure, cancellation, incomplete/obsolete results and changed builds block mock artifact upload and deployment; a successful unchanged build reaches both mock boundaries without a later rebuild. Diagnostics remain available on failure. These fixtures do not perform deployment or certify the absent canonical gate.

## Outstanding dependency

NOVE-3 / [GitHub #119](https://github.com/komed-uth/Game-QA-Portfolio/issues/119) remains Backlog with its separate implementation hold. Its independently maintained canonical content-expectation command and shared invocation helper are absent from the synchronized baseline. This issue consumes those contracts; it does not create competing implementations or invent an upstream command name. The fast canonical check cannot yet be wired ahead of expensive validation, and the Windows recipe cannot yet certify invocation of the future shared helper.

Consequently the complete NOVE-15 specification is not satisfied. The branch must remain a draft and cannot receive a clean specification review or independent Review child handoff until that dependency is delivered and integrated. No production failure experiment is performed.
