# Ticket #104: editable Skills and shared evidence links

> **Authorization status as of 2026-10-14**
> - **Source:** owner's implementation/push/PR instruction, followed by the 2026-10-14 chat instruction: “you may merge and close the ticket.”
> - **Implementation and tests:** completed, including the complete required validation.
> - **Branch push and PR:** authorized.
> - **Merge and issue closure:** authorized; merge after fresh exact-head readiness.
> - **Deployment:** the authorized merge to main triggers the existing Pages workflow automatically; no separate manual deployment.
> - **Separate content or release requirements:** preserve approved content and the scope of [#100](https://github.com/komed-uth/Game-QA-Portfolio/issues/100) and [#104](https://github.com/komed-uth/Game-QA-Portfolio/issues/104).
> - **Supersedes:** earlier holds for implementation, testing, branch push/PR, and now merge/issue closure, with the existing Pages workflow as an explained consequence.

The isolated `codex/issue-104` checkout starts at fetched main `b77d4f8a676664fc3cf6d7280485db1352757960`, which includes completed prerequisite #102. The original checkout's unrelated changes remain preserved. Workstation preflight passed through approved execution as GitHub account `komed-uth`; this session uses `GIT_CONFIG_GLOBAL=NUL` because the workstation's global config is malformed. No persistent workstation configuration changed.

`src/content/pages/skills.ts` owns page headings/descriptions, capability/tool card copy, section IDs/order/visibility, the supported card/text section list, reference-specific action labels, and action suffix. Stable card IDs do not depend on editable titles. The existing grid styles adapt each group without a second mobile definition. Shared labels and destinations resolve from `src/content/evidence.ts`, with optional validated project associations from `src/content/projects.ts`. PIX remains usable independently while the remaining-project migration is unfinished.

Existing plain Android/PIX destinations and anchors remain unchanged. Edited shared destinations can include extra query parameters while retaining exactly one matching evidence selector; malformed routes, fragments, unknown targets, and duplicate selectors fail validation. Shared report-file edits affect the report opened from either Portfolio or Skills. Original reports and the existing gallery/modal/report components remain unchanged.

## Standards

Independent GPT-6.1 Sol review at high effort examined `b77d4f8...b37ab89` against repository guidance and the code-review skill's smell baseline. No documented-standard violations were found. Two optional maintainability findings remain: evidence-visibility resolution is repeated in the project and Skills validators, and subprocess helpers repeat existing workflow patterns. Neither is a functional or acceptance defect.

## Spec

Independent GPT-6.1 Sol review at high effort found no missing/partial/incorrect requirements or scope creep against #104 and applicable #100 requirements. Required execution evidence is recorded separately below.

## Editing workflow evidence

`npm run check:content-workflow` passed the complete About me, shared project/evidence, and Skills workflow. Disposable edits are restored in `finally`, followed by a canonical production build.

- Skills capability/tool copy, page title/description, section heading, shared and per-reference action labels render through the typed definition.
- Added text and card sections, reordered groups, and a hidden text section produce the expected headings, absence, desktop/mobile reading order, keyboard sequence, and no horizontal overflow at 1366, 900, and 390px.
- Shared Android/PIX destination edits update each Skills use; following them focuses the intended evidence. A shared Android report-path edit opens the edited report asset from Skills and Portfolio. Modal dismissal restores focus to the actual opener.
- Fourteen invalid definition variants fail the normal validation command with file/record/field context: unknown project/evidence, mismatched project association, duplicate section/card/reference identities, unsupported type/preset, required copy/visibility, malformed/unresolved/ambiguous destinations, and live links to hidden evidence. Hidden reference sections permit hiding their target showcase.
- An unknown reference rejects both production build and development startup. Live development shows a valid Skills copy edit, rejects an unknown evidence reference with the error overlay while retaining the previous rendered content, then recovers after correction.
- The existing baseline Skills/navigation/evidence browser check passed all approved copy, four evidence links, legacy redirect, active navigation, titles, keyboard/skip/scroll, Android/PIX inspection, and eleven responsive layouts. Its desktop/mobile screenshots were visually inspected: existing cards, spacing, framing and navigation remain intact.

During workflow development, its Windows subprocess invocation initially split a disposable definition path containing spaces; the validator invocation now passes an argument array directly to Node. A focus assertion initially checked the PIX figure rather than its button and was corrected. These were test-harness corrections; the complete combined workflow subsequently passed.

## Initial complete local validation

Final tested source commit: `b37ab893ed756b66d6ce15fb1e464a0074f00d0b`. The clean-source complete browser run passed all 13 checks with final input stability confirmed. Input fingerprint: `eb8a21ab8cab39f30689b5a7929601a298b0a2fda71230ff31554c4ab3a93096`. The later evidence/documentation commit changes no validated inputs; the fingerprint is independently rechecked before publication.

Passed commands: `npm run check:content-workflow`, `npm run build` (content validation, strict typecheck, production build), `npm run check:overlays`, `npm run check:preview` (104 tests), `npm run check:runner` (151 tests), and `npm run check:browser` (13 checks).

Durable [browser summary](../evidence/issue-104/browser-summary.json) and [browser output](../evidence/issue-104/browser-output.txt) identify the tested commit, complete suite, outcomes, and fingerprint.

Real high-resolution report capture overlays remain unavailable because all five supplied reports have empty capture path lists. Overlay readiness explicitly skips them, and synthetic overlay coverage does not certify real images. Browser viewports do not certify physical devices; existing external documentation checks use stubs.

## CI recovery correction (2026-10-14)

The initial GitHub run [38518481142](https://github.com/komed-uth/Game-QA-Portfolio/actions/runs/38518481142) failed in the content-editing workflow while waiting for the development error overlay to detach after a corrected project/evidence definition. This was a watcher timing defect; the earlier local complete-suite pass does not establish that this CI step passed.

A focused live-server reproduction triggered the identical stuck overlay locally. Watcher/validation tracing showed one change event for the invalid save and no event for its immediate correction. The installed Chokidar implementation drops same-file change events inside a 50ms throttle. No corrective WebSocket update reached the browser; there was no later stale-error message.

Vite development watching now uses `awaitWriteFinish` with a 100ms stability threshold and 10ms polling interval. Completed saves therefore arrive outside that throttle window. Production content, layouts, evidence destinations, gallery behavior, and assertion timeouts are unchanged.

`node scripts/check-content-recovery.mjs` is a regression at the real editing/browser boundary. It immediately restores valid content when the server reports invalid project, evidence, Portfolio, and Skills definitions, then requires the error message, a corrective browser update, and overlay dismissal. All files are restored after success or failure. The check fails without the watcher fix (missing corrective development-server message) and passes with it. It also runs within `npm run check:content-workflow`.

The earlier browser summary/fingerprint above identify the initial implementation snapshot. The recovery configuration and added check change validation inputs, so that fingerprint is historical evidence rather than an attestation of the fix. Fresh full validation and the current exact-head result are recorded by the [PR #120 validation run](https://github.com/komed-uth/Game-QA-Portfolio/pull/120/checks), whose artifact identifies its tested head and fingerprint.

## Integration before authorized merge (2026-10-14)

The readiness recheck found main had advanced to `782365b12d5c18868f87af1332d5dfc387c1661f` through merged ticket #103 / PR #121. The prior exact-head CI pass therefore did not authorize a stale merge. Main was merged into the existing PR branch without rewriting either published history.

Conflict resolution preserves #103's complete six-project catalogue, ordered Portfolio, shared PIX capture fields, optional/external media support, and its editing workflow scenarios; it retains #104's typed Skills definition, stable references, destination validation, and rapid-save watcher regression. The obsolete project/Skills compatibility copies in `src/data.ts` are both removed.

Skills evidence visibility now derives both report and capture IDs from the actual visible Portfolio sections. Both validators share `visibleProjectEvidence`, removing the old static PIX exception and the earlier visibility-policy duplication. Optional project associations accept the project's report or capture record. Workflow coverage includes hiding referenced PIX evidence, selecting PIX through the Vecchio shared project, and hiding evidence after its live Skills references are hidden.

The integrated source passes build/type/content validation. The combined editing workflow and fresh complete CI must pass on the integration commit before the guarded merge; the exact-head CI artifact and tracker completion comment record the final verification.
