# Editing About me and shared site content

The current editable content lives in two typed files:

- `src/content/pages/aboutMe.ts` owns the About me page title, eyebrow, section IDs, order, visibility, text, and contact presentation.
- `src/content/site.ts` owns the portfolio name, navigation labels and destinations, shared contact destination, footer landmark label, and common interface text, including the identity link's accessible “home” label.

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

Change `siteContent.contact.destination` once to update both the header contact link and the About me contact link. The About me page owns its contact heading and link label. Navigation destinations must match a supported route: `/`, `/skills`, or `/about-me`. The validator reports unknown routes and malformed destinations. Shared external contact destinations must be valid HTTP(S) or mailto URLs.

`npm run dev` validates content before starting Vite and validates each saved definition edit while Vite is running. Invalid edits are reported in the terminal and browser overlay, and are withheld from hot reload until corrected. `npm run build` validates before typechecking and building. Diagnostics include the definition file, record, and field. Run `npm run check:content` for validator coverage and `npm run check:content-workflow` to exercise copy, contact, ordering, visibility, media, invalid-definition, development-server updates, build, and browser behavior with disposable edits that are restored before the check exits.
