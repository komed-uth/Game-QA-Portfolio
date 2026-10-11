const slideshow = { name: 'slideshow', module: './gameplay-slideshow.mjs' };
const photos = { name: 'photos', module: './gameplay-photos.mjs' };
const gameplay = { name: 'gameplay-previews', module: './gameplay-previews.mjs' };
const fixtures = { name: 'gameplay-fixtures', module: './gameplay-preview-fixtures.mjs' };
const evidence = { name: 'evidence-modal', module: './evidence-modal.mjs' };
const interactions = { name: 'evidence-interactions', module: './evidence-interactions.mjs' };
const overlays = { name: 'overlay-fixture', module: './report-overlay-fixture.mjs' };
const reports = { name: 'report-interactions', module: './report-interactions.mjs' };
const reportLayout = { name: 'report-layout', module: './report-layout.mjs' };

const suites = new Map([
  [undefined, { label: 'complete portfolio suite', result: 'portfolio', reports: true,
    checks: [slideshow, photos, gameplay, fixtures, evidence, interactions, reportLayout, overlays, reports] }],
  ['--reports-only', { label: 'reports and overlay fixture', result: 'report', reports: true, checks: [reportLayout, overlays, reports] }],
  ['--report-layout-only', { label: 'quick report layout', result: 'report layout', reports: false, checks: [reportLayout] }],
  ['--gameplay-only', { label: 'gameplay', result: 'gameplay', reports: false, checks: [slideshow, photos, gameplay, fixtures] }],
  ['--slideshow-only', { label: 'slideshow', result: 'slideshow', reports: false, checks: [slideshow] }],
  ['--photos-only', { label: 'photos', result: 'photo', reports: false, checks: [photos] }],
  ['--evidence-only', { label: 'evidence', result: 'evidence', reports: true, checks: [evidence, interactions] }],
]);

export function selectSuite(args) {
  const suite = suites.get(args[0]);
  if (args.length > 1 || !suite) {
    throw new Error('Usage: node scripts/check-browser.mjs [--reports-only | --report-layout-only | --gameplay-only | --photos-only | --evidence-only | --slideshow-only]');
  }
  return suite;
}
