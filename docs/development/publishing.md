# Publishing reference

[Task index](validation.md).

## Authorization and action scope

Use the latest explicit owner instruction for the action it names. Record authorization with its date, source, and separate decisions for implementation/testing, branch push/PR, merge/issue closure, and deployment. Keep content review or release requirements in their own field. An older hold remains historical and is superseded only for the action a later instruction addresses; a readiness label, approved specification, or issue state does not grant additional authority.

Use this compact status block when a ticket or validation record contains a hold or separately authorized actions:

> **Authorization status as of YYYY-MM-DD**
> - **Source:** owner instruction or tracker comment
> - **Implementation and tests:** authorized, held, or completed
> - **Branch push and PR:** authorized, held, or completed
> - **Merge and issue closure:** authorized, held, or completed
> - **Deployment:** authorized, held, or an explained automatic consequence
> - **Separate content or release requirements:** requirement and tracker link
> - **Supersedes:** earlier decision and only the action scope changed

The #76 history is an example of scoped supersession: the issue body recorded an earlier implementation hold; on 2026-10-12 a later owner instruction authorized implementation, tests, push, and PR #80, and a separate later instruction authorized merging PR #80 and closing #76. The merge's existing Pages-publishing consequence had been stated. Those instructions did not erase the separate biography-content requirement tracked in [#77](https://github.com/komed-uth/Game-QA-Portfolio/issues/77). See the dated [implementation authorization](https://github.com/komed-uth/Game-QA-Portfolio/issues/76#issuecomment-6118472294) and [merge authorization](https://github.com/komed-uth/Game-QA-Portfolio/issues/76#issuecomment-6119349340); the issues remain the source for current status.

## Implementation, review, and publishing order

1. Read the current tracker state and repository guidance, then run the [workstation preflight](workstation.md#workstation-preflight) before exploration. Use [bounded tool discovery](inspection.md#bounded-tool-discovery).
2. Implement the authorized scope and run focused checks against the affected behavior.
3. Pin the fixed comparison point and review the committed task diff against its originating issue or specification.
4. Resolve review findings, then rerun the affected focused checks.
5. Run the required complete validation once against final relevant source: build, overlay checks, preview checks, runner checks, and the full browser suite. A running or interrupted run is not a pass; require the final input-stability result.
6. Consolidate acceptance evidence and dated status notes before publication. Evidence should identify the tested commit and input fingerprint. A later documentation-only change may refer to the completed run only when the validated inputs are confirmed byte-for-byte unchanged.
7. Stage explicit task files, run the diff-whitespace guardrail, and publish only after it and final source-stability checks pass. Do not repeat the full browser suite solely for documentation changes excluded from the input fingerprint.

## Publishing readiness

Fetch and repeat the [history checks](history.md#synchronize-history-before-implementation) immediately before publishing so intervening remote commits are included.

Stage explicit task files so unrelated local changes stay outside the commit. Before committing, run `node scripts/check-diff-whitespace.mjs --base <target-branch>` using the task's actual PR target.

- Without `--head`, the command checks the staged snapshot against the supplied base and checks unstaged tracked changes separately. Its whitespace policy is pinned regardless of local Git configuration.
- To inspect immutable commits, pass both `--base <base-sha> --head <head-sha>`. CI instead supplies PR_BASE_SHA and PR_HEAD_SHA to npm run check:whitespace after a full-history checkout.
- Missing commits or a missing merge base fail with a fetch instruction; fix added-line whitespace before committing or publishing.

Check the active account through GitHub CLI when available or the connected GitHub profile before writing remotely. The repository owner is `komed-uth`; this workstation's Git credential previously authenticated as `komeduth` and was denied write access. Use the owner-authenticated connector when Git authentication is unavailable. Credential setup belongs to the account owner; never print stored credentials.

When transplanting commits onto remote history, compare the resulting file tree with the tested source before updating the ref. Preserve the remote head using an expected-SHA check. Verify the published head and PR file list afterwards.

## Merge readiness

After the intended branch is pushed and its PR is open, check readiness with the actual repository, remote, and PR number:

```sh
node scripts/check-merge-readiness.mjs --repo komed-uth/Game-QA-Portfolio --remote origin --pr <number>
```

The command reads the PR's head and target branch from GitHub; it does not assume the target is `main`. It requires a clean checkout on the published PR branch at the exact published head, fetches the named target branch twice, and verifies that its fresh tip is an ancestor of the PR head. It checks the PR's `Validate pull requests` status and the latest workflow evidence artifact. That artifact must identify the complete portfolio suite and local preview, record the same PR number and head SHA, a passing terminal result, no tracked changes, and a valid input fingerprint. The pull-request workflow checks out `github.event.pull_request.head.sha` so its recorded commit identifies the code it tested.

A `READY` result prints the target tip, exact PR head, validation run, and input fingerprint. A missing, pending, failed, cancelled, unavailable, stale, or wrong-head result exits nonzero with a next action. Target advancement requires [preservation and synchronization](history.md#synchronize-history-before-implementation), followed by integration and full validation of the resulting head. The command only updates the named remote-tracking ref through fetch; it does not change working files, local branch heads, credentials, configuration, published history, or merge state. Temporary workflow evidence is removed after inspection.

Readiness is not merge authorization and does not merge or deploy. When a separate owner instruction authorizes a merge, use the recorded exact head with GitHub CLI's `gh pr merge <number> --match-head-commit <head-sha>` guard. If GitHub rejects a race, fetch and inspect the current PR and target again, then rerun validation as needed; do not bypass the guard.

## Windows readiness invocation

In the intended checkout and the execution context that passed [workstation startup](workstation.md#workstation-preflight), set `$repository`, `$remote`, and `$pullRequest` to the actual repository, remote name and positive numeric PR. Paste this recipe directly in PowerShell; it calls the existing Node entrypoint and retains named options and paths containing spaces. Do not forward these options through an npm PowerShell wrapper. A nonzero child status remains unsuccessful.

<!-- readiness-powershell-start -->
```powershell
$ErrorActionPreference = 'Stop'
$checkout = (Get-Location).Path
$nodeExecutable = @(Get-Command node -CommandType Application -ErrorAction Stop)[0].Source
$readinessScript = Join-Path $checkout 'scripts/check-merge-readiness.mjs'
$readinessArguments = @('--repo', $repository, '--remote', $remote, '--pr', [string]$pullRequest)
& $nodeExecutable $readinessScript @readinessArguments
$readinessExit = $LASTEXITCODE
if ($readinessExit -ne 0) { exit $readinessExit }
```
<!-- readiness-powershell-end -->

For literal self-assignment through GitHub CLI, quote the value: `gh issue edit <number> --repo komed-uth/Game-QA-Portfolio --add-assignee '@me'`. Check `$LASTEXITCODE` before dependent work. Assignment requires the task's authorization and the verified account; this example does not change credentials.

The shell-boundary regression executes this exact fenced recipe in real Windows PowerShell with independently selected named values, a spaced checkout and controlled child exit results: `node --test scripts/windows-readiness-recipe.test.mjs`. Its argument-echo fixture intercepts before any GitHub action. It certifies forwarding and status propagation, not a live PR's readiness. Non-Windows CI skips the Windows check explicitly. #119 owns the shared invocation/recording helper; it is absent from this baseline, so this recipe uses the existing entrypoint directly and must consume that helper when delivered rather than introduce another launcher.

## Connector observations

When CLI access is unavailable and actual owner-authenticated connector observations are available, use the same verifier with `node scripts/check-merge-readiness.mjs --repo <owner/name> --remote <remote> --pr <number> --observations <private-json> --expected-login <intended-login>`. The private file is session evidence, not repository configuration. Do not commit it or include credentials. Tool observations must provide actual identity and required read capabilities; a command flag alone cannot attest to connected access.

The version 1 JSON contract is:

```json
{
  "version": 1,
  "repository": "owner/repository",
  "account": { "login": "intended-account", "observedAt": "ISO-8601 timestamp" },
  "capabilities": ["pull-requests:read", "checks:read", "actions:read", "artifacts:read"],
  "initial": { "observedAt": "ISO-8601 timestamp", "pullRequest": {}, "checks": [] },
  "workflowRuns": { "observedAt": "ISO-8601 timestamp", "runs": [] },
  "artifact": { "observedAt": "ISO-8601 timestamp", "name": "browser-validation-evidence", "runId": 1, "summaries": [] }
}
```

This initial shape is illustrative and intentionally incomplete: empty objects/arrays are unsuccessful evidence. Supply raw REST PR metadata, normalized check rows (`name`, `state`, `workflow`, `bucket`), normalized workflow runs, and the actual downloaded runner summary. Initial observations must be no more than five minutes old and nonfuture. Repository, PR, intended account and exact head must agree. Preflight needs only `version`, `repository`, `account` and `capabilities`; it does not need PR evidence or the final-observation exchange below.

Readiness requires a fresh final connected observation after inspecting the artifact. Keep the command in a foreground process whose stdin remains available. At that boundary it prints one line beginning `CONNECTOR OBSERVATION REQUIRED: ` followed by `{nonce,notBefore,repository,pullRequest,headSha,validationRun}`. After receiving that request, collect the authenticated account, read capabilities, raw REST PR metadata and normalized checks through the actual connected tools. Send exactly one JSON line to that same process's stdin:

```json
{
  "version": 1,
  "repository": "owner/repository",
  "nonce": "nonce from the running command",
  "validationRun": 1,
  "observedAt": "ISO-8601 timestamp after notBefore",
  "account": { "login": "intended-account", "observedAt": "ISO-8601 timestamp after notBefore" },
  "capabilities": ["pull-requests:read", "checks:read", "actions:read", "artifacts:read"],
  "pullRequest": {},
  "checks": []
}
```

Replace every illustrative value with actual observations and the requested nonce/run identity. Both observation timestamps must be at least `notBefore` and nonfuture, and the account must match `--expected-login`. Repository, PR, head and validation run remain pinned. A precollected `final` field in the initial file cannot satisfy this exchange. The response is limited to 256 KiB and 60 seconds; EOF, timeout, malformed or stale observations, wrong identity, and failed/cancelled/running/mismatched checks are unsuccessful. After accepting fresh final metadata, the same verifier performs its second fresh target fetch and clean local-head checks. Artifact commit/PR/full-suite/local-preview/clean-state/fingerprint protections remain required.

The tool orchestration must retain the foreground process and deliver its stdin response in this turn; do not background it or expect a completion wakeup. Synthetic tests exercise a controlled collector; they do not establish real connector access. The direct PowerShell CLI recipe remains unchanged. No merge, credential change or deployment is performed.

## Pages publication validation

Both automatic target-branch pushes (including content-only edits) and the existing manual Pages path must validate the selected commit and make only that validated build eligible for upload. Run the existing content-workflow checks, including their disposable edits and restoration builds, then validate the final canonical production build through the full overlay/preview/runner/browser sequence. Require terminal completion and final input stability, and upload that same `dist` artifact without rebuilding after validation. A focused fixture pass cannot replace this gate.

Before the expensive browser stage and Pages eligibility, #119/NOVE-3 supplies the canonical fast content-expectation command. That command and shared invocation helper are absent from this baseline. The build's schema/content validation does not establish canonical rendered expectations; implementation remains partial until the dependency is delivered and consumed. A failed canonical check must stop expensive validation and artifact eligibility. See [current implementation evidence](issue-85-validation.md) for actual results and limitations.

Before any authorized merge, inspect the configured workflow triggers and state the target branch and its automatic deployment consequence. The readiness command reports applicable Pages publication before `READY`; this is information for the owner, not merge or deployment authorization. Preserve the guarded exact-head merge and obtain only the authorizations required by the current task.

## Current-head CI observation

Use the read-only observer for an opened or updated PR. On Windows, use the direct entrypoint for named options:

```sh
node scripts/observe-ci.mjs --repo komed-uth/Game-QA-Portfolio --remote origin --pr <number>
node scripts/observe-ci.mjs --repo komed-uth/Game-QA-Portfolio --remote origin --pr <number> --watch --timeout-seconds 1800 --interval-seconds 15
```

`npm run check:ci` exposes the same command; the direct invocation avoids the previously observed loss of named options through npm. One-shot inspection is the default. The optional watch is finite and emits observed run/attempt, job and step changes rather than unchanged full tables. It prints the Actions URL immediately, retains unknown progress as unknown and never invents percentages from elapsed time. Failure reporting includes available failing steps, a bounded log excerpt and artifact links; unavailable API/log details are explicit limitations.

Follow publication until terminal success or an explicit unsuccessful/unresolved result. A PR-head change invalidates the old observation. Missing validation, earlier attempts, cancellation, failure, timeout and interruption cannot pass. On verified terminal CI success, the observer invokes the existing `scripts/check-merge-readiness.mjs` entrypoint; only its exact-head complete-evidence and fresh-target result establishes readiness. A green workflow alone does not establish readiness. Fix a reported failure before publishing a new head, then observe that head independently.

Observation does not retry/cancel workflows, merge, close issues or deploy. Preserve separate owner authorization for remote actions. This is an operator-invoked command, not a scheduled CI-watch service. Richer scenario checkpoints remain owned by #86/#110, command diagnostics by #119, and Pages gating/Windows navigation by #85.
