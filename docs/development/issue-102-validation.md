# Ticket #102: editable Regulus and shared evidence

> **Authorization status as of 2026-10-13**
> - **Source:** owner's chat instruction to implement #102, test, push the working branch, and create a PR to main.
> - **Implementation and tests:** completed, including the complete required validation.
> - **Branch push and PR:** authorized.
> - **Merge and issue closure:** held pending a separate owner instruction.
> - **Deployment:** held; this task creates a PR only.
> - **Separate content or release requirements:** preserve approved content and the scope of [#100](https://github.com/komed-uth/Game-QA-Portfolio/issues/100) and [#102](https://github.com/komed-uth/Game-QA-Portfolio/issues/102).
> - **Supersedes:** the 2026-10-12 implementation hold in #100/#102 only for implementation, testing, branch push, and PR creation.

The isolated `codex/issue-102` checkout starts at fetched main `372b962`, including merged prerequisite #101. Unrelated changes in the original checkout remain preserved.

Regulus's project information, labels, stores, and ordered media now belong to `src/content/projects.ts`. Portfolio selects it through a stable project identity in `src/content/pages/portfolio.ts`. Android report choices, stable defaults, presentation labels, local destinations, and the PIX destination belong to `src/content/evidence.ts`. Preserved Skills compatibility reads shared evidence destinations and labels; the other five showcases retain their existing implementations.

The gallery, video, preview strip, evidence modal, report synchronization, source reports, and CSS remain unchanged. Report selection and visit-local inspection memory use stable report IDs. Editing labels does not choose a different default or discard its inspection identity.

Focused validation passed: workstation preflight, content validation, strict typecheck/production build, and `npm run check:content-workflow`. The workflow makes disposable definition edits and restores canonical content and the production build. It verifies project copy, store destinations, gameplay order/path/alternative edits, report-label rename with unchanged default and both openers, narrow-screen order, Android/PIX navigation, live valid edits and rejected invalid edits across all three new files. Eighteen invalid fixtures fail the actual validation command with record/field context.

The original workflow test's Skills-link selector omitted the rendered arrow. It was corrected and the combined workflow passed. No application change was required for that failure.

Two independent Sol 6.1 reviewers at high effort reviewed `372b962...5e57840`. Standards: no documented-standard breaches or meaningful baseline smells. Spec: no missing/incorrect requirements or scope creep identified against #102 and applicable #100 requirements.

The first complete browser run found a stale gameplay-list fixture: it still replaced the removed component-local `RegulusShowcase()` signature and therefore silently failed to inject an empty media list. An isolated replay reproduced `Empty list omits gallery: 1 !== 0` in 4.19 seconds. The fixture now adjusts Regulus's shared project definition during its in-memory Vite build and assigns unique synthetic media IDs. All unchanged empty/single/long-list browser assertions passed in 26.60 seconds. Canonical content and interaction components were not changed by this correction.

## Standards

No findings in the implementation or supplemental fixture review. No documented-standard breaches or meaningful baseline smells.

## Spec

No findings against #102 and applicable #100 requirements in either review. No missing/incorrect requirements or scope creep identified.

## Final evidence

Final tested commit: `4f92d059e5325a54f3e28983612895248df288ee`. The clean-source browser run completed successfully on 2026-10-13 with all 13 checks passing and input stability confirmed. Its input fingerprint is `4ac8cac118b395fe28b37b6513741c640b4230c69a8470ff5e17b488c2b40803`. The later evidence/documentation commit does not change validated inputs; the fingerprint was independently rechecked before publication.

Passed commands: `npm run build` (content validation, strict typecheck, production build), `npm run check:overlays`, `npm run check:preview`, `npm run check:runner` (131 tests), and `npm run check:browser` (all 13 checks). The focused content-editing workflow also passed, including 18 invalid command fixtures. `node scripts/check-diff-whitespace.mjs --base 372b962 --head HEAD` passed the reviewed diff.

The complete suite verifies all six reports and both openers, initial Very High selection, report memory and reload reset, originals, chart/toggle/documentation interactions, modal/focus behavior, all media interactions, independent gallery state, responsive reading/keyboard order, exactly 900px and resizing in both directions, preserved pages/navigation/store links, and placeholder disclosures. Generated Regulus and Father Son desktop gallery captures were visually inspected for full image framing and the preserved preview-strip presentation.

Durable [browser summary](../evidence/issue-102/browser-summary.json) and [browser output](../evidence/issue-102/browser-output.txt) record the final outcome. The earlier failed run remains a diagnosis, not acceptance evidence.

Browser viewports do not certify physical devices. All five supplied HTML reports have empty real capture-image path lists, so real high-resolution overlay checks explicitly skip; the synthetic overlay fixture passes without claiming real capture coverage. External documentation destinations are stubbed by the existing suite.
