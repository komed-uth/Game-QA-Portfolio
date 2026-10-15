# Vecchio Furioso showcase spacing — 2026-10-15

> **Authorization status as of 2026-10-15**
> - **Source:** owner's chat requests to fix the attached Vecchio Furioso spacing defect and then open a PR to `main`.
> - **Implementation and tests:** completed, including the complete browser suite and final input stability.
> - **Branch push and PR:** authorized.
> - **Merge and issue closure:** not authorized.
> - **Deployment:** not authorized.
> - **Separate content or release requirements:** none introduced by this spacing fix.
> - **Supersedes:** no earlier hold is changed beyond this fix and its PR.

## Cause and result

The PIX capture moved to Skills, but Vecchio's desktop CSS still reserved its former grid row and made project details span that row. The evidence link was pushed below 218px of empty space at 1404 × 900. Removing the obsolete PC-specific grid overrides restores the shared showcase grid and a 16px desktop gap. Narrow layouts retain their 24px gap.

The existing rendered project-layout check now measures the evidence link against the bottom of the gallery and project information. It asserts natural spacing above and below the inclusive 900px breakpoint. No media, project copy, slideshow behavior, or destination changed.

## Source and review

Comparison base: `9faeff9472de5ddcc3ca5c7d4d8e7f9b6fa80c42` (`origin/main`).

Reviewed source commit: `102460cd5bd6242cc1bd9a1374fd6e3398e1b77d`.

Manual review of the committed diff against the owner's screenshot and repository guidance found no unresolved issues. The removed capture-specific layout rules have no remaining capture child in the Portfolio component. Existing narrow and desktop placement uses the shared grid rules.

## Validation

- Reproduction before the fix: `node .scratch/check-vecchio-gap.mjs` reported **218px** and failed its maximum-48px assertion. A one-variable browser probe changing the details row span reported **16px** and passed. The same reproduction passed after rebuilding the CSS fix; the temporary script was removed.
- Content validation, strict TypeScript checking, and the Vite production build passed.
- Overlay readiness/parser checks passed. The five supplied reports have empty screenshot path lists, so real capture-overlay checks explicitly skip those unavailable images; synthetic coverage does not certify them.
- Preview/content checks passed all 110 tests.
- Runner checks passed 151 of 153 tests initially. The two failures were caused by npm missing from the host PATH. A temporary npm 10.9.4 CLI in scratch allowed all six dependency-readiness tests, including those two, to pass. The temporary installation was removed; project dependencies were unchanged.
- Focused gameplay suite `run-Vv1HFJ` passed all six selected checks with final input stability.
- Focused evidence suite `run-wR3Php` passed both selected checks with final input stability. This directly exercises the new spacing assertion, eleven responsive viewports, the 900px boundary, image inspection, focus, and navigation.
- An initial complete run (`run-QyhIUp`) failed the existing video crossfade overlap assertion. The same check passed in the focused gameplay run. The isolated complete rerun (`run-2gvnpa`) passed all 13 checks, including that assertion and final input stability.

Validation input fingerprint for all three passing browser runs:
`9467457d402532f7e0354792277c93f89cff31f4ae70ca71916709264b6ca20e`.

The runs began at base commit `9faeff9` with the fix uncommitted; the source was committed during the complete run. The reviewed source commit contains the same validated inputs. A final independent fingerprint comparison confirmed the identical value before publication. Documentation is excluded from validation inputs.

The [durable complete-suite summary](../evidence/vecchio-spacing/browser-summary.json) and [browser output](../evidence/vecchio-spacing/browser-output.txt) record the terminal result. The commit field describes history at startup; the input fingerprint identifies the exact tested content.
