# Editing portfolio content

The current editable content lives in these typed files:

- `src/content/pages/skills.ts` owns the Skills title/optional description, card and text sections, headings, capability/tool copy, section IDs/order/visibility, and action text.
- `src/content/pages/aboutMe.ts` owns the About me page title, eyebrow, section IDs, order, visibility, text, and contact presentation.
- `src/content/site.ts` owns the portfolio name, navigation labels and destinations, shared contact destination, footer landmark label, and common interface text, including the identity link's accessible “home” label.
- `src/content/pages/portfolio.ts` selects the migrated Regulus project by stable `projectId`, section identity, visibility, and the supported `standard` preset. The other five showcases retain their existing presentation until their migration tickets.
- `src/content/projects.ts` owns Regulus's name, project labels and details, store destinations/icons, and ordered gameplay media with alternatives. Keep each media entry's ID stable when changing its label, path, or position. Images use local `path` references under `public/`; videos use an 11-character YouTube `videoId`. The existing gallery supports one video.
- `src/content/evidence.ts` owns Android report choices, paths, default, report-control labels and alternatives, and shared Android/PIX destinations and link labels. Skills selects these records by stable `evidenceId`, with an optional shared `projectId` that must own the selected report evidence. Schemas and validation live outside the editing files.

For example, edit a project detail's `value`, change a store's `destination` to an absolute HTTP(S) URL, or move a media entry within `media`. Update its `path` and `alt` together. Local report paths also resolve under the site's hosting base. Change the `very-high` report's label from `Very High` to `Ultra` without changing its ID; `defaultReportId: "very-high"` keeps it selected. Report inspection memory is keyed by report ID rather than label or filename.

Keep the public `android-reports` and `pix-capture` anchors/destinations stable for existing bookmarks. Unknown project/evidence references, duplicate IDs/anchors, missing local files, malformed links, unsupported media, and invalid report defaults fail normal validation with file/record/field context. Hiding Regulus fails validation while visible Skills sections link to its evidence. Remove those references or hide the referring sections first. Hiding unreferenced Skills sections is valid.

About me sections render in array order. Set `visible` to `false` to hide a section. Text sections currently support the `standard` preset; unsupported presets and duplicate section IDs fail validation. Add another text section by copying this shape:

```ts
{
  id: "testing-approach",
  type: "text",
  visible: true,
  preset: "standard",
  title: "Testing approach",
  description: "Describe the approach here.",
}
```

Text-section media is optional. When supplied, set a path relative to `public/` and descriptive alternative text. For example, `path: "images/example.png"` resolves through the site's base-aware asset helper and is checked for a local file before development or production builds. Parent-directory segments are rejected so an existing file cannot resolve outside the deployed site base. Omitting `media` renders no image element or empty frame.

Change `siteContent.contact.destination` once to update both the header contact link and the About me contact link. The About me page owns its contact heading and link label. Contact destinations must be absolute HTTP(S) or mailto URLs. Navigation destinations must match a supported route: `/`, `/skills`, or `/about-me`. The validator reports unknown routes and malformed destinations.

`npm run dev` validates content before starting Vite and validates each saved definition edit while Vite is running. Development waits for 100ms of file stability before processing a save, so rapid corrections are not lost to the filesystem watcher's same-file event throttle. Invalid edits are reported in the terminal and browser overlay, and are withheld from hot reload until corrected. `npm run build` validates before typechecking and building. Diagnostics include the definition file, record, and field. Run `npm run check:content` for validator coverage and `npm run check:content-workflow` to exercise copy, contact, ordering, visibility, media, invalid-definition, development-server updates, build, and browser behavior with disposable edits that are restored before the check exits.

## Skills editing

Edit a card's `title` or `description` in `pages/skills.ts`. Card identities stay stable when copy changes. Every section supports `preset: "standard"`; card grids adapt automatically. Array order controls both rendered headings and keyboard order. Hide a section with `visible: false`. Add a supported text section with:

```ts
{ id: "additional-note", type: "text", visible: true, preset: "standard",
  title: "Additional note", description: "Your text here." }
```

To add another card group, copy an existing `type: "cards"` section, give it a unique section ID, and replace its `title` and `cards`. Each card needs an ID unique within its group, title, description, and an `evidence` array (empty is allowed). Page and group descriptions are optional. The existing approved definition adds no new claims or sections.

Evidence references use `{ evidenceId: "android-reports", projectId: "regulus" }` or `{ evidenceId: "pix-capture" }`. The optional project reference uses the shared catalogue; PIX can be selected independently while the remaining project migration is unfinished. Change a shared record's `label` once for all Skills uses, or set a reference's optional `label` for page-specific action wording. `evidenceActionSuffix` owns the trailing action text. Never copy a destination into a Skills card.

Edit destinations in `evidence.ts`. Internal links must retain their existing evidence selector, e.g. `/?context=review&evidence=android-reports`; additional query parameters are permitted, but a different target, duplicate selector, fragment, or malformed route fails validation. Existing plain destinations/bookmarks remain valid. Edit a report's local `path` to update the report opened from both Portfolio and Skills. Original supplied reports remain unchanged. PIX's capture file still belongs to its existing project until the remaining-project migration.

`npm run check:content-workflow` also exercises Skills live development edits/recovery, copy/actions, shared link and report-file edits, added card/text sections, reordering/hiding, desktop/mobile keyboard order, and field-specific invalid-reference diagnostics. Temporary definitions and the canonical build are restored before it exits. Run `node scripts/check-skills-content-workflow.mjs` for the focused production workflow. The existing `node scripts/check-browser.mjs --skills-only` remains the baseline for approved copy/navigation/Android and PIX interactions.
