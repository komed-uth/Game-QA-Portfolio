# Single-file content editing (#123)

Implemented in the isolated `codex/centralized-content` checkout from published main `d9385e64ea05fe5fc9c0226da1d2d314b9157a4b` on 2026-10-14. Existing changes in the primary checkout were preserved.

## Result

`src/data.ts` owns the shared site, Portfolio section list, all six project records and their galleries, shared report/PIX evidence, Skills and About me. Its labeled sections and typed exports replace the six former `src/content/` editing files. Page/component imports, development validation, diagnostic file locations, build validation, browser fixtures and the editing guide now use the single file.

A comparison of all six exported definitions against the original main files passed: approved copy, identifiers, media ordering, paths, store destinations, evidence configuration and page sections are unchanged.

## Verification

- Production build and TypeScript: passed.
- `npm run check:content`: 8 tests passed, including valid section additions and invalid definitions in isolated single-file fixtures.
- Content editing workflow: About me/shared shell live updates, startup/build rejection, recovery after corrective saves, project/evidence/Portfolio edits and Skills edits passed. This includes all six showcases, placeholder image replacement, 28 invalid project/evidence/Portfolio examples and 15 invalid Skills examples.
- `node scripts/check-layout-content-workflow.mjs`: passed after correcting the migrated fixture's definition iteration. Covers all-page section additions, order/visibility, presets, 899/900/901px and the responsive matrix, and retained gallery/report selection and inspection during live edits.
- Every editing workflow restored the original `src/data.ts` and production build.
- `npm run check:preview`: 107 tests passed.
- `npm run check:browser`: complete suite passed, including Skills, About me, all placeholder panels and slideshows, video transitions, photo lifecycle, responsive gameplay browsing, short/long gallery fixtures, enlarged image/report inspection, report layout, synthetic overlays, and all six report choices across ten viewports plus 900px. The stable-input check passed.

The report overlay check uses the existing synthetic fixture. It does not certify missing original report-owned overlay capture images or physical devices.

The owner subsequently authorized branch publication and a PR targeting `main`. Merge and deployment require a separate instruction.
