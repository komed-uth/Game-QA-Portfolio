import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateCompleteBrowserSummary } from './complete-browser-summary.mjs';
import { selectSuite } from './browser/check-suites.mjs';

test('complete browser evidence requires every selected result and terminal stable local input', () => {
  const suite = selectSuite([]);
  const summary = {
    suite: suite.label, selectedChecks: suite.checks.map(check => check.name),
    checks: suite.checks.map(check => ({ name: check.name, status: 'passed' })),
    status: 'passed', exitCode: 0, trackedChanges: false, preview: 'local',
    startedAt: '2026-10-27T01:00:00Z', endedAt: '2026-10-27T02:00:00Z',
    inputFingerprint: 'a'.repeat(64),
  };
  assert.doesNotThrow(() => validateCompleteBrowserSummary(summary));
  for (const change of [
    { status: 'running' }, { exitCode: 23 }, { endedAt: null },
    { trackedChanges: true }, { preview: 'external' }, { checks: [] },
    { selectedChecks: [] }, { inputFingerprint: 'invalid' }, { suite: 'focused' },
  ]) assert.throws(() => validateCompleteBrowserSummary({ ...summary, ...change }));
});
