# Editing portfolio content

Begin in `src/content/`. These TypeScript files provide VS Code field suggestions. Definitions describe content and supported presentation; renderers, schemas (`src/page-schema.ts`, `src/content-schema.ts`), validation, and asset resolution remain outside this editing area.

| Owner | Editable content |
| --- | --- |
| `pages/portfolio.ts` | Ordered Portfolio sections, visibility, project selection, presets, added text/card copy |
| `pages/skills.ts` | Page title/description, capabilities/tools, text/card sections, evidence references, action suffix |
| `pages/aboutMe.ts` | Page title/eyebrow, text/card sections, optional text media, contact heading/action |
| `site.ts` | Shared identity/title/description/icon, navigation labels/routes, contact destination/icon, footer landmark, accessible shell labels, gallery/loading/retry/slideshow/preview and inspection actions |
| `projects.ts` | Project names, facts, disclosures, heading/gallery/detail/store labels, store links/icons, ordered media and alternatives |
| `evidence.ts` | Shared report/PIX destinations and labels, report headings/actions/alternatives/default/choices/files, PIX file/alternative/opening label/modal title |

There is no second copy of project facts or evidence destinations in a page component. Original reports, captures, and videos remain evidence files rather than editable page prose. Public routes (`/`, `/skills`, `/about-me`), the legacy `/about` redirect, and public evidence anchors are stable application contracts. Styles, breakpoints, YouTube provider endpoints and control symbols are implementation; page editors do not configure arbitrary CSS or a new section engine.

## Copy, links and media

Edit `description` or a project detail's `value` to change wording. Edit `siteContent.contact.destination` once to update the header and About me contact. Contact destinations accept absolute HTTP(S) or mailto URLs. Store and external image destinations accept absolute HTTP(S) URLs. Navigation must resolve to a supported page; an evidence query must target a visible Portfolio evidence block on `/`. Fragments are unsupported in navigation definitions.

Keep stable IDs when renaming headings, cards, projects, quality labels or media labels. For example, rename report `id: "very-high"` from `Very High` to `Ultra`, leaving `defaultReportId: "very-high"`. Inspection memory uses report identity. Gallery selection uses media identity, so moving or renaming a surviving media entry retains its selection during development edits.

Local assets use forward-slash paths relative to `public/`, such as `images/example.png`. Update an image's `path` and descriptive `alt` together; the file must actually exist. The shared base-aware resolver handles repository/subfolder hosting. Project images choose either `path` or an absolute `url`, never both; videos use an 11-character YouTube `videoId`, with at most one video per gallery. Move media entries to change their order. `media: []` intentionally omits a project gallery, and omitting a text section's `media` removes its image without an empty frame. A supplied missing file is an error, including on hidden records.

Shared interface templates in `site.ts` keep their named tokens: `openScreenshot` and `showPreview` require `{label}`, and `videoTitle` requires `{project}`. Change surrounding wording while retaining the token. The shared metadata title, description and icon also supply `index.html`, so routine shell edits do not require changing HTML or a component.

URL-format validation checks syntax and internal targets. It does **not** prove that an external URL is reachable or that its content is appropriate.

## Shared evidence reuse

Cards on any page select evidence by identity, with its owning project:

```ts
{ projectId: "regulus", evidenceId: "android-reports", label: "Inspect Android reports" }
{ projectId: "vecchio-furioso", evidenceId: "pix-capture" }
```

The optional `label` changes only that reference's action text; omit it to use the shared evidence label. Never copy a destination into a card. Change the evidence record's `destination`, `path`, or report file once to update Portfolio inspection and every page reference. Internal evidence destinations preserve their anchor, e.g. `/?context=review&evidence=android-reports`. Additional query parameters are allowed; duplicate selectors, fragments, different targets, and malformed destinations fail validation.

A **live** reference is one rendered in a visible card section or navigation link. Hiding Regulus or Vecchio while a live reference points to its evidence fails with the reference's file/record/field and the Portfolio/evidence target. Remove the incoming links or hide their referring sections before hiding the target. Unreferenced sections can be hidden. Hidden referring sections still need well-formed records and known IDs.

## Supported sections, order and visibility

All pages use one ordered section list. Move the complete entry to reorder it and set `visible: false` to hide it without leaving a layout gap. Keep its `id` stable. Text and card groups can be added on all three pages; Portfolio additionally supports project showcases, and About me supports one contact section.

```ts
{
  id: "additional-note", type: "text", visible: true, preset: "standard",
  title: "Additional note", description: "Your reviewed wording here."
}
```

Optional text media:

```ts
media: { path: "images/example.png", alt: "Describe the meaningful image." }
```

Supported card group:

```ts
{
  id: "additional-evidence", type: "cards", visible: true, preset: "standard",
  title: "Additional evidence",
  cards: [{
    id: "android-example", title: "Android profiling", description: "Reviewed context.",
    evidence: [{ projectId: "regulus", evidenceId: "android-reports" }]
  }]
}
```

Each card has an `evidence` array; `[]` is valid. Card/group descriptions and reference labels follow their typed fields. Add a supported Portfolio project section by selecting a shared project:

```ts
{ id: "regulus", type: "project", visible: true, preset: "media-left", projectId: "regulus" }
```

Do not render the same project twice: its public heading/evidence anchors would conflict. A different project record needs its own identity and heading anchor. Section IDs are unique per page; card IDs per group; project/evidence IDs in their collections; media/store/detail/report IDs within their owning record. Rendered anchors are unique per page, including the shell and fixed page heading.

## Allowed presets

| Section type | Presets | Compatibility |
| --- | --- | --- |
| Project showcase | `standard`, `media-left`, `media-right` | Side variants require gallery media or a PC capture |
| Text | `standard`, `media-left`, `media-right` | Side variants require supplied local media and an alternative |
| Cards | `standard` | Existing grid adapts automatically |
| About me contact | `standard` | One contact section per page |

`standard` preserves the approved appearance. Project `media-right` uses the established desktop media column; `media-left` places media on the left. Separate PIX evidence stays below gameplay in that media column. Report preview remains before controls in reading order and on narrow screens. Every preset stacks automatically at **900px and below**, preserving title, media, details. No second mobile section list is required. DOM and keyboard order follow the same list; preset CSS does not remount galleries or report viewers.

A completely new section style needs a reusable component and contract extension. Editing support does not authorize new claims, removed interests/workflow/coverage, held features, or replacement evidence. Keep placeholder disclosures and unconfirmed status; mock panels do not establish contributor experience.

## Correcting errors and checking edits

`npm run dev` and `npm start` validate before startup. Saved definitions are validated before hot reload; invalid changes produce terminal diagnostics and the browser overlay, then a corrective save resumes rendering. `npm run build` validates before strict typechecking and the production build. An error points to its editing file, record/section and field.

- **Missing field:** fill the named title, description, identity, action, alternative, or required reference.
- **Unknown reference:** use an existing project/evidence ID and match evidence to its owning project.
- **Hidden target:** correct the incoming live reference or target section's visibility; do not silently redirect it.
- **Duplicate ID/anchor:** choose a unique stable identity; avoid repeated projects and the reserved About me heading.
- **Unsupported type/preset:** use the table above; side presets need compatible media.
- **Invalid default:** choose an existing report ID, independent of its editable label.
- **Missing local asset:** correct the file/path under `public/`; do not substitute an external destination into a local field.
- **Malformed/unresolved link:** correct its scheme, route or evidence selector. URL format alone does not attest external availability.

Run `npm run check:content` for isolated diagnostic fixtures and `npm run check:content-workflow` for the complete definition-edit → validation/dev/build → rendered-page boundary. The workflow asserts independently chosen copy, destinations, supported additions/order/visibility, presets, responsive/keyboard order, and surviving selection/inspection. Fixtures are disposable or restored byte-for-byte; the canonical production build is restored before exit. `node scripts/check-layout-content-workflow.mjs` focuses on the final preset safeguards. Run the required complete validation in `docs/development/validation.md` before publishing a PR.
