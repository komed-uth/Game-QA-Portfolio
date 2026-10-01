# Game QA Portfolio

A React + TypeScript portfolio adapted from the local **Portfolio Template** for game QA work. It preserves the template's dark background, gaming typography, cyan project headings, green links, responsive project/media layout, and separate approach page. Vite supplies the development server and production build; hash routing works on static hosts without server rewrites.

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

The build checks TypeScript before creating `dist/`. Publish the contents of `dist/` to a static host. The root source `index.html` needs the development server; it is not the deployable site. Relative asset URLs support repository subfolders.

GitHub Pages uses `.github/workflows/deploy-pages.yml` to build and publish every push to `main`. The repository's Pages publishing source must be **GitHub Actions**. Live site: https://komed-uth.github.io/Game-QA-Portfolio/.

## Change your information later

Edit **`src/data.ts`**. The `personalInfo` object controls the name, role, introduction, description, profile links, and optional photo/CV. Missing photo, CV, and links are hidden automatically.

```ts
name: 'Your name',
role: 'Game QA Tester',
introduction: 'Your short introduction',
image: 'images/profile.jpg',
cvUri: 'files/my-cv.pdf',
links: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-profile' }],
```

Place optional files in `public/`. Use relative paths without a leading slash. The browser title follows the profile name; edit `index.html` to customize the initial title and search description too. Project details, report settings, workflow, tools, and planned coverage also live in `src/data.ts`.

## Current evidence

- Regulus the Advent cutscene performance demonstration on Samsung Galaxy S10.
- Five original ARM Streamline / Performance Advisor reports: Very High, High, Medium, Low, and Very Low.
- One Regulus project showcase combines a single introduction, device details, and store badges on the left with the media gallery and live HTML report viewer stacked on the right. On narrow screens, the introduction and details come first, followed by the gallery and reports. Its static capture image is not displayed or linked.
- Report selector with Medium selected by default, an Overall image summary, and a full-report link for each quality setting.
- Vecchio Furioso PC performance testing: a Microsoft PIX GPU frame capture with a full-size image link.
- Father, Son & Holy Guns: an embedded project video and YouTube link directly below Regulus the Advent.
- The PC environment is documented as Intel Core i7-7700K, NVIDIA GeForce GTX 1060 6GB, 16 GB RAM, and Windows 10 Home (build 19045). These specifications were read from this PC when the project was added.

Vecchio Furioso currently presents the supplied screenshot as rendering-event and timing evidence. Performance findings can be added to `pcProject` in `src/data.ts` when documented.

Manual test cases, defect reports, and coverage documents remain **work in progress**. The approach page describes the intended QA process, not completed execution results. The original `test-cases/TC-MOV-001` is a placeholder.

## Structure

```text
src/
  App.tsx              Shared shell and routes
  data.ts              Editable portfolio content
  types.ts             Content interfaces
  Components/          Header, project, report viewer, footer
  Pages/               Portfolio and QA approach
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
