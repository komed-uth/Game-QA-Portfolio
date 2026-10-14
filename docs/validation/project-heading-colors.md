# Project heading colors — 2026-10-15

The owner clarified that all large project titles should remain cyan and all small
Project showcase labels should remain green. The placeholder project rule applied
the project accent to both; it now applies only to the title, so the small label
inherits the shared green style. Project content and accent values are unchanged.

## Authorization

- Source: owner instructions in this chat on 2026-10-15.
- Implementation and tests: authorized and completed.
- Publishing: the owner explicitly authorized pushing this fix to main.
- PR, issue closure: not part of this request.
- Deployment: a main push triggers the existing GitHub Pages workflow; this
  automatic consequence was explained before publishing.

## Validation and review

- Base: `a278970243a2a8feebd51f0f5428700fc82dc0e7` (current main after #130).
- Tested source commit: `8fec1ba41e67be46f176188929383b1acb2ad51c`.
- Reviewed the committed diff against the owner's clarified color requirement;
  no outstanding findings.
- `npm run build`, `npm run check:overlays`, `npm run check:preview` (108 tests),
  and `npm run check:runner` (151 tests) passed.
- `npm run check:browser` passed all 13 checks and its final input-stability gate.
  Run: `.scratch/browser-runs/run-iGKnNd/summary.json`.
- Input fingerprint:
  `00d557000884a8ff2fc1f3707a3052e3b83803eb2ef8c0b8f0a182176ec07b06`.
- The rendered regression verifies six cyan titles and six green showcase labels
  across eleven widths in both motion modes within the project showcase checks.
- Initial local startup stalls and preview timeouts were superseded by successful
  build and complete validation runs. Empty original screenshot lists retain the
  existing explicit skip for real report capture overlays; synthetic overlay
  integration passed.
- The runner's tracked-change flag comes from the pre-existing glossary edit,
  which is excluded from validation inputs and from this publication.

This validation record is documentation only. Publishing requires a final
comparison confirming the tested input fingerprint remains unchanged.
