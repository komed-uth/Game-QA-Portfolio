# Workstation reference

[Task index](validation.md).

## Project dependency readiness

`npm run check:workstation` uses Node built-ins and can run before `npm ci`. It checks workstation executables and Git metadata access; it does not install packages or establish that a project checkout is ready to build.

Run `npm run check:project-dependencies` from the intended checkout after `npm ci`. The check requires the local Vite build/preview entry point, TypeScript compiler, and Playwright package inside that checkout's `node_modules`; packages discoverable only in a parent checkout do not count. `npm run build`, `npm run dev`, `npm start`, `npm run preview`, `npm run check:preview`, `npm run check:runner`, `npm run check:browser`, and the focused browser checks (`check:reports`, `check:report-layout`, `check:gameplay`, `check:slideshow`, `check:placeholders`, `check:photos`, and `check:evidence`) run this check before their work. The shared browser worker repeats it before importing Playwright, so direct `node scripts/check-browser.mjs ...` calls and runs using `PORTFOLIO_URL` enforce the same checkout boundary. If it fails, run `npm ci` from that checkout and retry. The check itself needs no project dependencies.

## Host runtime failures

This session's sandbox failed before commands and browser-control tools started, with `helper_unknown_error: setup refresh had errors`. Commands worked through approved escalated execution. Repository changes cannot repair that host startup failure; diagnose the host runtime separately. Use approved tool execution without changing sandbox protections.

Windows WinGet launchers may also fail with `ResourceUnavailable`, `No application is associated with the specified file`, or access-denied errors even when GitHub CLI and ripgrep are installed. Git fetch can fail separately because `.git/FETCH_HEAD` is protected. Run the preflight once in the intended execution context; for these host failures use approved execution, then retain the working result for the session. Actual missing tools, expired authentication and network failures need their own diagnosis. Keep credentials and permissions under the owner's control.

## Workstation preflight

Run `node scripts/check-workstation.mjs` from the intended checkout before exploration. Direct Node execution reaches preflight even when npm is unavailable; `npm run check:workstation` remains available when its launcher works. It needs no installed project dependencies. It checks Node, npm, Git and ripgrep launchers, obtains only the GitHub login through the selected access path, and verifies Git metadata write access with an empty temporary directory that it removes. It changes no history, configuration, credentials or permissions and installs nothing. A missing capability produces a nonzero exit and a pointer to the execution guidance above. Successful account access confirms identity, not repository write permission or fresh remote history; follow [history synchronization](history.md#synchronize-history-before-implementation) and [publishing](publishing.md#publishing-readiness) separately.

Keep the successful execution context for this session: intended checkout, resolved executables, shell and approved execution mode, and any explicit process-local Git configuration override. Reuse those conditions for later commands instead of rediscovering fallbacks. Do not persist machine-specific paths in repository configuration. A malformed global Git configuration is distinct from a missing executable, an unusable launcher, protected metadata, expired authentication or a network failure. Ask the owner to repair personal configuration; when explicitly authorized, a process-local `GIT_CONFIG_GLOBAL` pointing to an owner-approved configuration can support this session without modifying the global file. Retain that environment for every later Git command and child process that needs it.

An unavailable `gh` executable is not verified GitHub access. Preflight represents unavailable CLI, verified CLI identity, independently verified connector access and absent/unverified access separately. If an actual connected tool is available, collect its authenticated profile and required read capabilities into private session observations, then pass `--observations <private-json> --expected-login <intended-login> --repo <owner/name>`. For preflight, the [connector observation contract](publishing.md#connector-observations) requires only version, repository, fresh account identity and read capabilities; PR/workflow/artifact evidence is required by readiness separately. Do not fabricate observations to make missing CLI access pass; account identity must match the intended account. A successful workstation probe still leaves [checkout dependency readiness](#project-dependency-readiness) unverified until that separate check passes.

## Workstation GitHub CLI

GitHub CLI is installed persistently through WinGet for this Windows user (`GitHub.cli`, user scope). WinGet manages its `gh` alias and user PATH entry. Fresh shells use `gh` directly; an already-running desktop app may need reopening to inherit the updated PATH. Existing keyring authentication is reused. Check identity with `gh api user --jq .login` without exposing credentials.

## Workstation search tooling

Ripgrep is installed persistently through WinGet for this Windows user (`BurntSushi.ripgrep.MSVC`, user scope). Fresh shells use `rg` through WinGet’s managed alias and user PATH. An already-running desktop app may need reopening to inherit the updated PATH. Verify with `rg --version`.
