import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { selectSuite } from './check-suites.mjs';

const cases = [
  { mode: undefined, checks: ['slideshow', 'photos', 'gameplay-previews', 'gameplay-fixtures',
    'evidence-modal', 'evidence-interactions', 'overlay-fixture', 'report-interactions'], reports: true },
  { mode: '--reports-only', checks: ['overlay-fixture', 'report-interactions'], reports: true },
  { mode: '--gameplay-only', checks: ['slideshow', 'photos', 'gameplay-previews', 'gameplay-fixtures'], reports: false },
  { mode: '--photos-only', checks: ['photos'], reports: false },
  { mode: '--evidence-only', checks: ['evidence-modal', 'evidence-interactions'], reports: true },
  { mode: '--slideshow-only', checks: ['slideshow'], reports: false },
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
