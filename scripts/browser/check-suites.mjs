const slideshow = { name: 'slideshow', module: './gameplay-slideshow.mjs' };
const video = { name: 'video', module: './gameplay-video.mjs' };
const photos = { name: 'photos', module: './gameplay-photos.mjs' };
const gameplay = { name: 'gameplay-previews', module: './gameplay-previews.mjs' };
const fixtures = { name: 'gameplay-fixtures', module: './gameplay-preview-fixtures.mjs' };
const evidence = { name: 'evidence-modal', module: './evidence-modal.mjs' };
const interactions = { name: 'evidence-interactions', module: './evidence-interactions.mjs' };
const overlays = { name: 'overlay-fixture', module: './report-overlay-fixture.mjs' };
const reports = { name: 'report-interactions', module: './report-interactions.mjs' };
const reportLayout = { name: 'report-layout', module: './report-layout.mjs' };
const placeholders = { name: 'placeholder-showcases', module: './placeholder-showcases.mjs' };
const skills = { name: 'skills', module: './skills.mjs' };
const aboutMe = { name: 'about-me', module: './about-me.mjs' };
const gameplayLayout = { name: 'gameplay-layout', module: './gameplay-layout.mjs' };
const galleryKeyboard = { name: 'gallery-keyboard', module: './gallery-keyboard.mjs' };

const suites = new Map([
  [undefined, { label: 'complete portfolio suite', result: 'portfolio', reports: true,
    checks: [skills, aboutMe, placeholders, video, slideshow, photos, gameplay, fixtures, evidence, interactions, reportLayout, overlays, reports] }],
  ['--skills-only', { label: 'Skills and legacy links', result: 'Skills', reports: false, checks: [skills] }],
  ['--about-me-only', { label: 'About me and contact', result: 'About me', reports: false, checks: [aboutMe] }],
  ['--reports-only', { label: 'reports and overlay fixture', result: 'report', reports: true, checks: [reportLayout, overlays, reports] }],
  ['--report-layout-only', { label: 'quick report layout', result: 'report layout', reports: false, checks: [reportLayout] }],
  ['--gameplay-only', { label: 'gameplay', result: 'gameplay', reports: false, checks: [placeholders, video, slideshow, photos, gameplay, fixtures] }],
  ['--placeholders-only', { label: 'placeholder showcases', result: 'placeholder showcase', reports: false, checks: [placeholders] }],
  ['--video-only', { label: 'video completion and playback', result: 'video', reports: false, checks: [video] }],
  ['--gameplay-layout-only', { label: 'gameplay layout', result: 'gameplay layout', reports: false, checks: [gameplayLayout] }],
  ['--gallery-keyboard-only', { label: 'gallery keyboard and focus', result: 'gallery keyboard', reports: false, checks: [galleryKeyboard] }],
  ['--slideshow-only', { label: 'slideshow', result: 'slideshow', reports: false, checks: [slideshow] }],
  ['--photos-only', { label: 'photos', result: 'photo', reports: false, checks: [photos] }],
  ['--evidence-only', { label: 'evidence', result: 'evidence', reports: true, checks: [evidence, interactions] }],
]);

export function selectSuite(args) {
  const suite = suites.get(args[0]);
  if (args.length > 1 || !suite) {
    throw new Error('Usage: node scripts/check-browser.mjs [--skills-only | --about-me-only | --reports-only | --report-layout-only | --gameplay-only | --gameplay-layout-only | --gallery-keyboard-only | --video-only | --photos-only | --evidence-only | --slideshow-only | --placeholders-only]');
  }
  return suite;
}
