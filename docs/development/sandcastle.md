# Sandcastle workflow

Sandcastle runs one approved GitHub issue in a Docker worktree, retains its
`codex/issue-N` branch, and leaves review, publishing, and issue updates to the host.
Setup is tracked in [issue #48](https://github.com/komed-uth/Game-QA-Portfolio/issues/48).

## First start on this workstation

Docker Desktop and WSL 3.0.1 were installed during setup. Windows requested a
restart to activate WSL and Virtual Machine Platform. Restart Windows, then
open Docker Desktop and wait for the Linux engine to be ready. No restart was
initiated by the agent.

From this checkout in PowerShell:

```powershell
npm.cmd run sandcastle:build-image
npm.cmd run sandcastle:doctor
npm.cmd run sandcastle:smoke
```

Use `npm.cmd` in PowerShell: the installed `npm.ps1` wrapper stripped forwarded
flags during verification. On Linux/macOS use `npm`.
The image build requires a ready Linux Docker engine. The smoke run requires a
clean, committed setup and creates its own branch; it checks the CLI login and
project context without implementing an issue.

## Select and dispatch one issue

Follow the history synchronization instructions in
[validation.md](validation.md) before editing or running work.
The host checkout must be clean and contain the reviewed setup. The runner
fetches the configured remote and requires its target tip to be an ancestor
of host HEAD. New agent branches start at that exact HEAD, including committed
setup. An existing task branch is retained and requires explicit review before reuse.

```powershell
npm.cmd run sandcastle -- --issue NUMBER --dry-run
npm.cmd run sandcastle -- --issue NUMBER --approve
```

Replace NUMBER with the selected issue number. The explicit `--approve`
authorizes only that dispatch. It does not bypass an issue hold or blocker.
Dry-run reads GitHub without starting a container, changing the issue, or copying
credentials. The runner rejects closed issues, missing/conflicting triage labels,
assignees, hold language in the issue/comments, open prerequisites, and existing
closing PRs or the same task branch. It fails if native dependencies cannot be
verified. Historical hold comments need human reconciliation on the tracker.
`ready-for-agent` alone is insufficient; #27 and #43 remain held.

Issue content and comments are fetched by the host's authenticated `gh` CLI
and passed as a snapshot. Native dependencies and documented `Blocked by`
references are checked; the assigned sandbox receives issue/comments as context.
No GitHub token is forwarded to the container. Recheck live tracker changes
before accepting a result; a snapshot does not prevent concurrent work.

## Login, model, and skills

This setup uses your existing ChatGPT subscription login from the host Codex
CLI. Confirm it with `codex login status`; use `codex login` if sign-in is needed.
At first launch, the runner copies only `auth.json` from the host's Codex directory
into ignored `.sandcastle/auth/` and mounts that separate directory in the container.
The agent can refresh that copy without editing the host's login cache.
If sandbox sign-in becomes stale, close its run, remove only the ignored
`.sandcastle/auth/auth.json` file, sign in on the host, and launch again.
Never commit or share either credential file.

The copied login is a credential available to the local container.
Use this workflow with trusted code and reviewed dependency changes.
The container gets neither the host's full Codex configuration nor GitHub login.
The Codex provider uses automatic approval review within Docker.

Edit `.sandcastle/config.json` to change the model, image, remote, or target branch.
The initial model matches the host's configured `gpt-6.1-sol`.
No API key is required. Authentication details follow
[OpenAI's CLI authentication documentation](https://learn.chatgpt.com/docs/auth).

Four project-local skills are available under `.agents/skills/`: tdd,
code-review, codebase-design, and domain-modeling. They are copies of the
workstation's installed skills, with supporting files and MIT attribution.
The prompt points agents at existing workflow/domain docs and the supplied
issue. Planning and product decisions remain in the interactive chat.

## Validation and review

`npm run check:sandcastle` type-checks the runner and tests dispatch eligibility.
The existing PR workflow runs it through the npm precheck:runner hook before
browser-runner diagnostics; no workflow permission change is required.
Inside each sandbox, an ordered hook installs Linux dependencies and Chromium
in that branch's worktree. The image supplies browser OS libraries and pinned
Codex CLI 0.162.1. Windows `node_modules` is not copied to the Linux worktree.

Agents use the current package scripts and validation document, record actual
results, preserve original performance evidence, and commit explicit task files
on their assigned branch. The runner retains results and logs; it does not
automatically push, merge, deploy, or close an issue. Review the implementation
against both the issue and repository standards, then create a PR from the host.
A merge to main triggers the existing GitHub Pages deployment.

SDK: `@ai-hero/sandcastle@0.12.0`.
[First-party API and branch behavior](https://github.com/mattpocock/sandcastle).
