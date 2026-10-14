# Ticket #105: layout presets and editing safeguards

> **Authorization status as of 2026-10-14**
> - **Source:** owner's chat instruction to implement #105, follow repository guidance, review, push the working branch, and create a PR to main; repository identified as Game QA Portfolio in the follow-up.
> - **Implementation and tests:** completed, including required complete validation.
> - **Branch push and PR:** authorized.
> - **Merge and issue closure:** held; no instruction for these actions.
> - **Deployment:** held; no website publication performed.
> - **Separate content or release requirements:** preserve approved copy, disclosures and held features under [#100](https://github.com/komed-uth/Game-QA-Portfolio/issues/100) and [#105](https://github.com/komed-uth/Game-QA-Portfolio/issues/105).
> - **Supersedes:** the older implementation/testing and push/PR holds only for the authorized action scope.

The isolated `codex/issue-105` checkout started at fetched main `6ae3ef717690673a63dd62aa11ef1e9e79d9baaf`, including completed prerequisites #103 and #104. The original D: checkout and its unrelated changes remain preserved. Workstation and project dependency preflights passed through approved execution as `komed-uth`. `GIT_CONFIG_GLOBAL=NUL` bypasses this workstation's malformed global Git configuration for these commands; no persistent configuration, credentials or permissions changed.

## Delivered editing contract

All three page definitions support ordered, visible text/card sections; Portfolio also selects project showcases and About me retains its contact section. Compatible project and text media support standard/media-left/media-right presets. Side presets without compatible media, unsupported presets/types, unknown references, duplicate record identity/rendered anchors, missing assets, invalid report defaults and malformed/unresolved links fail validation.

The same section list adapts at the inclusive 900px threshold. Project DOM order stays title/media/details; narrow reports retain preview-before-controls. Vecchio's PIX evidence stays separate below gameplay. A hidden incoming evidence destination reports its live reference and the target Portfolio section/evidence record. Hidden unreferenced sections and intentionally omitted media leave no reserved frame. Omitting Regulus gameplay preserves independent desktop report columns.

`site.ts` owns shared shell, gallery, inspection and metadata copy/assets; project/evidence definitions own their facts, destinations and media. Section schemas moved outside the editing folder. Every Skills evidence reference now names its owning project, removing the migration-only optional association. The unused legacy report type was removed. The [editing guide](../content-editing.md) demonstrates ordinary copy/media/link edits, stable IDs, shared evidence reuse, additions/order/visibility, allowed presets and error correction. URL syntax does not certify external availability.

## Workflow evidence

The confirmed boundary from #100 is the complete content-editing workflow: definition edits through command/development validation and production build into browser-visible outcomes. No component-internal test boundary was added.

- Isolated fixtures demonstrate supported additions and side presets on all pages, reject twelve independently varied invalid cases with file/record/field context, and allow unreferenced hiding. They do not change canonical owner content.
- The existing combined workflow passes About me copy/contact/media, project and placeholder edits, Portfolio ordering, shared evidence/store changes, subfolder assets, Skills copy/actions and additions, invalid definitions, live error overlays and corrective saves.
- The new final workflow demonstrates text/card additions on all pages, hidden text absence, shared evidence activation, escaped metadata/icon and inspection-label edits, every project's media-side presets, all-page text presets, desktop/mobile reading order, 899/900/901px and the responsive matrix, and no horizontal overflow.
- Live development preset edits keep image/report inspection open. Media reorder/label edits retain a surviving gallery item by ID; quality-label edits retain the selected report by ID. Resizing preserves those selections, report position and opener restoration. Removing optional text media leaves natural spacing. Standard Regulus with no gameplay keeps usable, separate report columns and surviving report selection/inspection memory.
- Every disposable canonical edit is restored in `finally`, followed by a fresh canonical production build. The complete workflow finished successfully with the checkout restored.

## Complete local validation

Final tested source commit: `57b3e46e055cce82732bbbc4c877a6a8f26f7d5c`.

Input fingerprint: `0d13de30ab1c8ccba7fedc5c0ff4c3ec64813833a7da4ace58980e83accc9447`.

All required commands passed against final reviewed source:

```sh
npm run check:content-workflow
npm run build
npm run check:overlays
npm run check:preview
npm run check:runner
npm run check:browser
```

The production build includes content validation and strict TypeScript checking. Preview checks include isolated server-startup rejection and content diagnostics. Runner checks passed 151 tests. The complete browser suite passed all 13 checks with final input stability confirmed, on a clean tracked source at the tested commit. The [durable summary](../evidence/issue-105/browser-summary.json) and [browser output](../evidence/issue-105/browser-output.txt) identify the source, suite, terminal outcome and fingerprint. This later documentation/evidence-only commit is excluded from validation inputs; an independent fingerprint check confirmed the same value before publication.

Visually inspected the freshly generated desktop Skills and mobile About me captures: approved copy, card/text spacing, navigation, framing and footer remain intact. New presets and omitted-media layouts have rendered geometry, order, interaction and responsive assertions; they are not a physical-device certification.

The five supplied HTML reports still contain empty screenshot path lists. Overlay readiness prints explicit skips for real high-resolution capture coverage. The synthetic overlay fixture verifies modal integration, not absent real capture images. Supplied reports, toggles, charts, documentation destinations, originals and inspection memory remain covered. No new evidence, held feature, removed content, or contributor claim was introduced.

## Standards

GPT-6.1 Sol at high effort reviewed `git diff 6ae3ef717690673a63dd62aa11ef1e9e79d9baaf...HEAD` against repository guidance and the code-review smell baseline. It found one P3 ownership-documentation inconsistency and two low-priority judgement calls: Skills-specific names for shared schemas and a repeated evidence-target lookup. The guide, generic schema names and shared `findEvidenceTarget` resolver resolve all three. The reviewer verified the fixes at `57b3e46`; no Standards findings remain.

## Spec

A separate GPT-6.1 Sol high-effort reviewer compared the same fixed-point diff with #105 and parent #100. It found one P2 edge case: omitted Regulus gameplay collapsed its report subgrid and overlapped preview/controls. The report now has independent desktop columns when gameplay is absent; the focused workflow verifies 1366/901px separation, 900/899/390px narrow order, surviving selection and inspection memory. The reviewer verified the fix at `57b3e46`; no Spec findings remain. No other actionable missing requirement or scope creep was found.

Final unresolved findings: Standards 0; Spec 0. Initial worst findings were P3 documentation consistency within Standards and P2 omitted-gallery report layout within Spec; both are resolved.
