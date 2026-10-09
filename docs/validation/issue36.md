# Ticket #36 validation

The four ticket #24 retrospective improvements are tracked in [issue #36](https://github.com/komed-uth/Game-QA-Portfolio/issues/36).

- Gameplay checks now exercise both normal and reduced motion across the same ten viewports and both showcases. Rapid focus and rapid media selection checks also run in both modes. A long-list fixture records scroll geometry at actual pointerdown to prove normal scrolling is still pending before interruption, checks immediate reduced-motion positioning within one-pixel browser rounding, and verifies the obsolete destination never resumes.
- The existing runner accepts `--gameplay-only` through `npm run check:gameplay`. Its default retains all portfolio checks; CI still runs that default. Report readiness applies to complete/report runs; focused gameplay has no report-data dependency.
- `check:preview` includes three argument checks proving unknown, conflicting, and repeated selectors fail before readiness/browser startup, alongside the existing startup and report parser tests.
- Root `AGENTS.md` and its three referenced `docs/agents/` documents are published. The stronger synchronization and connector-commit procedure is reconciled into the current validation guide, retaining current preview allocation and focused-check guidance. The original dirty checkout is preserved.
- Ripgrep 15.2.0 is permanently installed with WinGet user scope (`BurntSushi.ripgrep.MSVC`). `rg --version` and repository searches work after refreshing PATH; fresh processes inherit WinGet's managed alias.

Validation: production build/typecheck passed; all ten preview/argument/parser checks passed; focused gameplay including representative lists and native touch passed in installed Edge. The initial complete Edge portfolio suite passed; the review strengthened the interruption assertion and grouped runner mode settings. Final focused results, review, and Linux Chromium CI are recorded in the PR. No application behavior, original media, or deployment workflow is changed.
