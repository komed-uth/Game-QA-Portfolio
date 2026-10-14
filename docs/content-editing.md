# Editing portfolio content

The current editable content lives in these typed files:

- `src/content/pages/aboutMe.ts` owns the About me page title, eyebrow, section IDs, order, visibility, text, and contact presentation.
- `src/content/site.ts` owns the portfolio name, navigation labels and destinations, shared contact destination, footer landmark label, and common interface text, including the identity link's accessible “home” label.
- `src/content/pages/portfolio.ts` contains the complete ordered list of six project showcases, selected by stable `projectId`. Move section entries to reorder the Portfolio; keep their section IDs and project IDs unchanged. Section visibility and the supported `standard` preset retain each project’s established presentation.
- `src/content/projects.ts` owns every project’s name, facts, labels, disclosures, store destinations/icons, and ordered gameplay media with alternatives. Keep project, detail, and media IDs stable when changing copy or order. Images use either a local `path` under `public/` or an absolute HTTP(S) `url`; videos use an 11-character YouTube `videoId`. Each gallery supports at most one video. Set `media: []` to intentionally omit optional gameplay without an empty frame. A supplied missing local file still fails validation.
- `src/content/evidence.ts` owns Android report choices, paths, default, report-control labels and alternatives, and shared Android/PIX destinations and link labels. The PIX record also owns its independent capture path, alternative, opening label, and modal title. Skills uses these same destinations through compatibility references. Schemas and validation live outside the editing files.

For example, edit a project detail's `value`, change a store's `destination` to an absolute HTTP(S) URL, or move a media entry within `media`. Update its `path` and `alt` together. Local report paths also resolve under the site's hosting base. Change the `very-high` report's label from `Very High` to `Ultra` without changing its ID; `defaultReportId: "very-high"` keeps it selected. Report inspection memory is keyed by report ID rather than label or filename.

Keep the public `android-reports` and `pix-capture` anchors/destinations stable for existing bookmarks. Unknown project/evidence references, duplicate IDs/anchors, missing local files, malformed links, unsupported media, and invalid report defaults fail normal validation with file/record/field context. Hiding Regulus or Vecchio currently fails validation because preserved Skills links still point at their evidence; remove incoming references in the later Skills migration before hiding them. Projects without incoming evidence references can be hidden.

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

`npm run dev` validates content before starting Vite and validates each saved definition edit while Vite is running. Invalid edits are reported in the terminal and browser overlay, and are withheld from hot reload until corrected. `npm run build` validates before typechecking and building. Diagnostics include the definition file, record, and field. Run `npm run check:content` for validator coverage and `npm run check:content-workflow` to exercise copy, contact, ordering, visibility, media, invalid-definition, development-server updates, build, and browser behavior with disposable edits that are restored before the check exits.

To edit Father, Son & Holy Guns, find `id: "father-son"` in the shared project file and update a detail value or a media `path` and `alt` together. To edit a placeholder, find its stable ID (for example `invictus-lost-soul`) and update its copy/panels while retaining explicit placeholder disclosures and unconfirmed status. Editable panels do not establish contributor experience or verified results. Vecchio’s `captureEvidenceId: "pix-capture"` selects the separately inspectable evidence record; its gameplay gallery remains separate. Keep each `presentation`, public `headingId`, and evidence anchor stable during routine edits.

For a Portfolio reorder, move the complete `father-son` section before `regulus` in `src/content/pages/portfolio.ts`; their gallery identities and evidence destinations stay unchanged. Array order also determines showcase reading and keyboard order. A duplicate rendered project or unknown selected project fails with the relevant file/field context. `npm run check:content-workflow` exercises representative real and placeholder edits, Portfolio reordering, local/external media, omitted galleries, PIX and store edits, subfolder hosting, and responsive/keyboard traversal, then restores canonical content.
