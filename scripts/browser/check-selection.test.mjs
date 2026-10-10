import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { selectSuite } from './check-suites.mjs';

const modes = [undefined, '--reports-only', '--gameplay-only', '--photos-only', '--evidence-only', '--slideshow-only'];
const expected = [
  ['slideshow', 'photos', 'gameplay-previews', 'gameplay-fixtures', 'evidence-modal', 'evidence-interactions', 'overlay-fixture', 'report-interactions'],
  ['overlay-fixture', 'report-interactions'], ['slideshow', 'photos', 'gameplay-previews', 'gameplay-fixtures'],
  ['photos'], ['evidence-modal', 'evidence-interactions'], ['slideshow'],
];
for (const [index, mode] of modes.entries()) {
  test(`${mode ?? 'default'} selects the intended checks`, () => {
    assert.deepEqual(selectSuite(mode ? [mode] : []).checks.map(check => check.name), expected[index]);
    assert.equal(selectSuite(mode ? [mode] : []).reports, ![2, 3, 5].includes(index));
  });
}
const invalid = [['--unknown'], ...modes.slice(1).flatMap(left => modes.slice(1).map(right => [left, right]))];
for (const args of invalid) {
  test(`${args.join(' ')} fails before readiness or browser startup`, () => {
    const result = spawnSync(process.execPath, ['scripts/check-browser.mjs', ...args], { encoding: 'utf8' });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Usage: node scripts\/check-browser.mjs/);
    assert.equal(result.stdout, '', 'Invalid arguments must not start checks or a preview');
  });
}
