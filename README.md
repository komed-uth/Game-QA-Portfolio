# Game QA Portfolio

A React + TypeScript portfolio adapted from the local **Portfolio Template** for game QA work. It preserves the template's dark background, gaming typography, cyan project headings, green links, and responsive project/media layout. Vite supplies the development server and production build; hash routing works on static hosts without server rewrites.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

## Build and preview

```sh
npm run build
npm run preview
```

The build validates editable content and checks TypeScript before creating `dist/`. Publish the contents of `dist/` to a static host. The root source `index.html` needs the development server; it is not the deployable site. Relative asset URLs support repository subfolders.

GitHub Pages uses `.github/workflows/deploy-pages.yml` to build and publish every push to `main`. The repository's Pages publishing source must be **GitHub Actions**. Live site: https://komed-uth.github.io/Game-QA-Portfolio/.

## Edit portfolio content

Open **`src/data.ts`** to edit every page. Its labeled sections contain `siteContent` (shared name, navigation, contact and footer), `portfolioPage` (showcase order/layout), `projects` (all project descriptions and gallery images), `evidence` (reports and PIX capture), `skillsPage`, and `aboutMePage`. Search for a project name to replace its pictures. Development validates definitions on startup and when saved edits are made; builds validate them before typechecking. Errors identify `src/data.ts`, the record and field. See the [content editing guide](docs/content-editing.md) for examples, including replacing placeholder pictures.

Local pictures and files stay in `public/`; edit their relative paths in `src/data.ts`. The current approved About me presentation does not include a photo or CV.

## Current evidence

- Regulus the Advent cutscene performance demonstration on Samsung Galaxy S10.
- Five original ARM Streamline / Performance Advisor reports: Very High, High, Medium, Low, and Very Low.
- One Regulus project showcase combines a single introduction, device details, and store badges on the left with the media gallery and live HTML report viewer stacked on the right. On narrow screens, the introduction and details come first, followed by the gallery and reports. Its static capture image is not displayed or linked.
- Report selector with Medium selected by default, an Overall image summary, and a full-report link for each quality setting.
- Vecchio Furioso PC performance testing: a Microsoft PIX GPU frame capture with a full-size image link.
- Father, Son & Holy Guns: a media gallery with its video and three gameplay screenshots directly below Regulus the Advent.
- The PC environment is documented as Intel Core i7-7700K, NVIDIA GeForce GTX 1060 6GB, 16 GB RAM, and Windows 10 Home (build 19045). These specifications were read from this PC when the project was added.

Vecchio Furioso currently presents the supplied screenshot as rendering-event and timing evidence. Performance findings can be added to its record in `projects` in `src/data.ts` when documented.

Manual test cases, defect reports, and coverage documents remain **work in progress**. The Planned gameplay coverage section is removed without replacement under [#88](https://github.com/komed-uth/Game-QA-Portfolio/issues/88); this supersedes its retention and placement under #49, #74, and #77 and makes no claim of completed manual testing. Skills at `#/skills` presents the approved QA capabilities and Tools, with links to supplied Android and PC performance evidence. Legacy `#/about` links redirect to Skills. About me at `#/about-me` presents the approved biography and email, phone, and LinkedIn contact. The former QA approach and numbered workflow are removed. The original `test-cases/TC-MOV-001` is a placeholder, not completed evidence.

On 2026-10-12 the owner authorized #77's implementation, testing, branch push, and PR, and confirmed Project Regulus as the planned coverage's project. The Skills and About me copy was already approved in #77. Deployment remains on hold: merging to `main` triggers the Pages workflow and requires separate owner authorization.

## Structure

```text
src/
  App.tsx              Shared shell and routes
  data.ts              Single editable file for every page, project, and shared content
  content-schema.ts    Project and evidence types
  page-schema.ts       Page section and shared site types
  types.ts             Report interfaces
  Components/          Header, project, report viewer, footer
  Pages/               Portfolio, Skills, and About me
  Styles/              Responsive styling
  assets/              Template fonts and background
public/
  Performance-Testing-Mobile/Full Report/  Published original reports
  images/                                 Published capture
Performance-Testing-Mobile/                Preserved original evidence
test-cases/                                Manual QA work in progress
```

The evidence in `Performance-Testing-Mobile/Full Report/` stays unchanged. `scripts/sync-reports.mjs` generates the published copies by adding a viewport tag and a link to `public/report-responsive.css`; all capture data and chart scripts are preserved. Development and build commands automatically regenerate the published copies. Legacy `assets/css/style.css` is preserved but unused by the React app.

## Responsive support

Layouts adapt to available width and support both orientations. Project sections stack below 900px, report summary charts stack below 760px, and the embedded viewer adapts to viewport height. Controls provide at least 44px tap height. Full reports can be opened separately to avoid nested scrolling.

Validation viewports include 1920 × 1080 and 1366 × 768 desktops, 390 × 845 (19.5:9) and 360 × 840 (21:9) phones and their landscape rotations, and a 1200 × 800 (3:2) tablet with its portrait rotation. These are browser viewport checks rather than physical-device certification.

## Template attribution

Visual assets and design adapted from the local Portfolio Template by Sol Elan. Its MIT copyright and terms are preserved in **`LICENSE.template`**. The source template repository was left unchanged.
