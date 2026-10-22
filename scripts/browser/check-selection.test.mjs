import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { selectSuite } from './check-suites.mjs';

test('focused package commands use supported selectors and checkout dependency guards', async () => {
  const { scripts } = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  for (const [command, selector] of [
    ['check:video', '--video-only'],
    ['check:gameplay-layout', '--gameplay-layout-only'],
    ['check:gallery-keyboard', '--gallery-keyboard-only'],
  ]) {
    assert.equal(scripts[command], `node scripts/check-browser.mjs ${selector}`);
    assert.equal(scripts[`pre${command}`], 'npm run check:project-dependencies');
  }
});

const cases = [
  { mode: '--about-me-only', checks: ['about-me'], reports: false },
  { mode: undefined, checks: ['skills', 'about-me', 'placeholder-showcases', 'video', 'slideshow', 'photos', 'gameplay-previews', 'gameplay-fixtures',
    'evidence-modal', 'evidence-interactions', 'report-layout', 'overlay-fixture', 'report-interactions'], reports: true },
  { mode: '--skills-only', checks: ['skills'], reports: false },
  { mode: '--reports-only', checks: ['report-layout', 'overlay-fixture', 'report-interactions'], reports: true },
  { mode: '--report-layout-only', checks: ['report-layout'], reports: false },
  { mode: '--gameplay-only', checks: ['placeholder-showcases', 'video', 'slideshow', 'photos', 'gameplay-previews', 'gameplay-fixtures'], reports: false },
  { mode: '--placeholders-only', checks: ['placeholder-showcases'], reports: false },
  { mode: '--photos-only', checks: ['photos'], reports: false },
  { mode: '--evidence-only', checks: ['evidence-modal', 'evidence-interactions'], reports: true },
  { mode: '--slideshow-only', checks: ['slideshow'], reports: false },
  { mode: '--video-only', checks: ['video'], reports: false },
  { mode: '--gameplay-layout-only', checks: ['gameplay-layout'], reports: false },
  { mode: '--gallery-keyboard-only', checks: ['gallery-keyboard'], reports: false },
];
for (const { mode, checks, reports } of cases) {
  test(`${mode ?? 'default'} selects the intended checks`, () => {
    const suite = selectSuite(mode ? [mode] : []);
    assert.deepEqual(suite.checks.map(check => check.name), checks);
    assert.equal(suite.reports, reports);
  });
}
const modes = cases.map(({ mode }) => mode).filter(mode => mode !== undefined);
const invalid = [['--unknown'], ...modes.flatMap(left => modes.map(right => [left, right]))];
for (const args of invalid) {
  test(`${args.join(' ')} fails before readiness or browser startup`, () => {
    const result = spawnSync(process.execPath, ['scripts/check-browser.mjs', ...args], { encoding: 'utf8' });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Usage: node scripts\/check-browser.mjs/);
    assert.equal(result.stdout, '', 'Invalid arguments must not start checks or a preview');
  });
}
