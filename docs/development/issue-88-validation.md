# Ticket #88: remove Planned gameplay coverage

Ticket: [#88](https://github.com/komed-uth/Game-QA-Portfolio/issues/88).
Review base: `c0cbde0c8396b5fab011477cfb040ad29f57d3cb` (freshly fetched main).
Implementation commit: `5ccf558`.

The owner explicitly authorized implementation, testing after implementation,
branch push, and a PR to main on 2026-10-12, superseding the planning-only hold.
The branch was created from fetched main in an isolated checkout; unrelated
changes in the planning checkout were preserved. Merge and deployment remain
subject to separate authorization.

## Acceptance

| Requirement | Evidence |
| --- | --- |
| Complete removal with no replacement | The Regulus section, nine-topic data, import, and unused coverage CSS are removed. Rendered checks reject heading, paragraph, badge, topic list, and relocated copy. |
| Normal transition after reports | Regulus ends with Performance reports; the next showcase is Father, Son & Holy Guns. Measured spacing matches existing project margins: 56px at 1366px, 32px at 360px. No empty trailing section area. |
| All routes | Checks cover Portfolio, Skills, About me, legacy About redirect, and unknown-route fallback. Responsive checks cover eleven narrow/wide layouts. |
| Existing content and interactions | Source changes are limited to coverage removal. Browser checks retain Skills evidence links, reports, PIX inspection, navigation, and other project showcases. |
| Preserve manual QA files and evidence | No original report, manual QA file, placeholder, or project media is edited. Removing planned work makes no new claim of completed manual test execution. |
| Current documentation and historical truth | README and validation instructions describe removal. Earlier #50/#75/#77 records retain their original results with supersession pointers; the current specification identifies superseded #49/#74/#77 clauses. |

## Validation after implementation

- `npm run build`: passed (TypeScript and production bundle).
- `npm run check:preview`: 99 tests passed, zero failures.
- `node scripts/check-browser.mjs --skills-only`: passed, including eleven
  layouts, the transition, legacy navigation, and four evidence links.
- `npm run check:overlays`: five parser tests passed. Real capture overlays
  explicitly skipped because supplied screenshot path lists are empty.
- `npm run check:browser`: all 13 checks passed, including all six reports,
  original tabs, gameplay, focus, scroll memory, responsive layouts, Skills and
  About me. Retained [summary](../evidence/issue-88/browser-summary.json) and
  [output](../evidence/issue-88/browser-output.txt) certify the full run.

The full run started on the uncommitted implementation at the pinned base and
the same implementation was committed during execution. The runner verifies
source/build fingerprints throughout; its summary therefore retains the
starting commit and `trackedChanges: true`. Documentation and evidence records
are outside the validation inputs.

## Visual inspection

The report-to-next-showcase transition was inspected at 1366px and 360px.
Both views retain ordinary separation, readable headings and controls, and no
horizontal overflow or clipping. Existing Skills captures remain in use.

| View | Capture |
| --- | --- |
| Desktop | [1366px transition](../evidence/issue-88/regulus-transition-desktop.png) |
| Phone | [360px transition](../evidence/issue-88/regulus-transition-phone.png) |
| Measurements | [Layout JSON](../evidence/issue-88/layout.json) |

Historical before-removal views remain in [#77 evidence](issue-77-validation.md).
Viewport inspection is not physical-device certification. Real report-owned
capture overlays remain unavailable; the synthetic fixture checks integration.

## Independent review

Two parallel Sol 6.1 reviewers at high effort reviewed
`git diff c0cbde0c8396b5fab011477cfb040ad29f57d3cb...HEAD`.

### Standards

No documented-standard violations or actionable baseline smells. Shared
coverage-removal and transition checks avoid repeated logic; shared page styles
and historical records remain intact.

### Spec

No findings in the implementation. The section, unused data and CSS, route
checks, spacing, evidence access, and historical pointers match #88.

Totals: Standards 0; Spec 0. Final execution results and tracker supersession
pointers accompany the PR.

Tracker supersession pointers were added without rewriting historical bodies:
[#49](https://github.com/komed-uth/Game-QA-Portfolio/issues/49#issuecomment-6127360031),
[#74](https://github.com/komed-uth/Game-QA-Portfolio/issues/74#issuecomment-6127360531),
and [#77](https://github.com/komed-uth/Game-QA-Portfolio/issues/77#issuecomment-6127361133).