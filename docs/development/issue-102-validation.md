# Ticket #102: editable Regulus and shared evidence

> **Authorization status as of 2026-10-13**
> - **Source:** owner's chat instruction to implement #102, test, push the working branch, and create a PR to main.
> - **Implementation and tests:** authorized; implementation and focused content workflow completed.
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

Final review and complete validation results will be recorded before publication. Browser viewports do not certify physical devices; report-owned high-resolution capture overlays remain limited by the supplied fixtures.
