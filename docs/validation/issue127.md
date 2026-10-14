# Ticket #127 — PIX performance evidence on Skills

## Authorization status as of 2026-10-15

- Source: owner's chat instruction, “Implement ticket #127 … After implementation, push working branch and create PR to main”.
- Implementation and tests: authorized; supersedes the 2026-10-14 implementation/application-testing hold for #127 only.
- Branch push and PR: authorized; supersedes the earlier hold for these actions only.
- Merge and issue closure: not authorized; issue stays open.
- Deployment: not authorized. The existing Pages workflow publishes main on merge, which requires separate authorization.
- Separate content/release requirement: preserve the existing PIX image and project provenance. Regulus's supplied replacement screenshot and report relocation belong to the dependent ticket, not this slice.
- Sources: [ticket #127](https://github.com/komed-uth/Game-QA-Portfolio/issues/127), [parent #126](https://github.com/komed-uth/Game-QA-Portfolio/issues/126).

## Implementation and acceptance mapping

- One named Performance testing section follows the complete Tools list. `skillsPage.sections` supplies its order, visibility and ordered `{ evidenceId, projectId }` references. The initial row is Vecchio Furioso / Microsoft PIX.
- Capture rendering was extracted into `CaptureViewer` and continues to use `EvidenceModal`. Full image framing, original-file access, pointer/keyboard opening, visible focus, dismissal, background locking, reduced motion and actual-opener restoration use the existing inspection boundary.
- Portfolio retains Vecchio's details, Steam link and five gameplay images. Its capture display is replaced by a short link to Skills. Regulus retains all six Portfolio report choices and original inspection behavior.
- Shared PIX identity, anchor and source path remain `pix-capture` and `images/vecchio-furioso-pix.png`. Image SHA-256: `1C04482AAD33EBF6EA275716012DA7A68506AFA8C48E68C3194AB1489A34AD16`. The original asset is unchanged.
- Canonical `/skills?evidence=pix-capture` arrivals focus and reveal the row. Saved `/?evidence=pix-capture` URLs forward with replacement history. The arrival effect observes each navigation key, including repeated same-URL clicks.
- Target visibility comes from the actual Skills evidence sections and remaining Portfolio reports. Project evidence references establish provenance. Visible cards/navigation/project links cannot point at hidden targets. Content fixtures reject unsupported section kind/preset, report rows in this capture-only slice, dangling/wrong-project references and duplicate anchors, and accept valid reorder/hide configurations.
- Existing Skills checks cover four capability/tool links, canonical/legacy arrival, reload, Back/Forward, repeat activation, responsive framing/order and keyboard access. Image inspection checks were relocated, while Regulus and gameplay checks remain. The editing workflow supplies a second shared capture/project fixture to verify ordered rows and supported section movement without duplicating production records.
- Editing guidance documents the intermediate contract and hiding constraints. No Regulus selector removal or final #126 completion is claimed.

## Validation notes

The initial workstation sandbox could not launch WinGet tool aliases or write Git metadata. The documented normal-access preflight passed with GitHub account `komed-uth`. Isolated branch `codex/issue-127` started at freshly fetched main `3077758dd19bb22f68b63af3fdc3d540c3fa9262`; unrelated root changes were preserved.

Main had owner content edits after earlier browser assertions were written: external-link suffix “↗”, numbered project eyebrows, revised Codex copy, populated placeholder project details, the Collectors App Store link, shared project accents and removal of two About me sections. Expectations were updated to those existing values without rewriting owner content. Content-workflow fixtures retain explicit hidden/additional-section coverage.

An initial Skills attempt was obsolete because check inputs changed during the run; it is not acceptance evidence. Focused Skills rerun `run-2UseMu` passed with input stability. Early inspection attempts exposed stale main content assertions; their failures are not recorded as passes. Final committed-source evidence is recorded below after complete validation.

## Independent review

The code-review skill ran separate Standards and Spec reviews with GPT-6.1 Sol at high effort against fixed base `3077758dd19bb22f68b63af3fdc3d540c3fa9262` and initial implementation `6a0bc9b4faa002702f1f3a4bf5f8386682050eb3`. Both reported zero actionable findings. Final follow-up review and terminal validation evidence are recorded below.

## Limits and risk

This is a reversible presentation, routing and content-validation change. The main risks are evidence arrival/focus, image inspection and content-editor target visibility. Browser viewport checks do not certify physical devices. Existing report screenshot-path lists are empty; synthetic overlay coverage verifies integration and does not certify unavailable real report captures. No source evidence, original report or gameplay asset is removed.

The first complete run (`run-o2JZpZ`, commit `eb0148c`) stopped on the obsolete “three distinct accents” assertion after all three projects completed their content/layout, input and slideshow scenarios. Current main assigns the same `#55DEDB` accent to these projects. The assertion now checks those explicit configured colors; this failed run is not acceptance evidence.
