import assert from 'node:assert/strict';
import { selectSuite } from './browser/check-suites.mjs';

// Shared evidence contract; callers retain commit, PR/run and current-input guards.
export function validateCompleteBrowserSummary(summary) {
  const suite = selectSuite([]);
  const checks = suite.checks.map(check => check.name);
  assert.equal(summary.suite, suite.label, 'Evidence must select the complete suite');
  assert.deepEqual(summary.selectedChecks, checks, 'Evidence must select the complete suite');
  assert.equal(summary.preview, 'local', 'Evidence must use the owned production preview');
  assert.equal(summary.status, 'passed', 'Latest complete suite must have passed');
  assert.equal(summary.exitCode, 0, 'Browser process must exit successfully');
  assert.equal(summary.trackedChanges, false, 'Evidence must identify a clean checkout');
  assert.ok(Date.parse(summary.endedAt) >= Date.parse(summary.startedAt), 'Evidence must be terminal');
  const results = Array.isArray(summary.checks) ? summary.checks.map(check => [check?.name, check?.status]) : null;
  assert.deepEqual(results, checks.map(name => [name, 'passed']), 'Every selected check must pass');
  assert.match(summary.inputFingerprint ?? '', /^[a-f0-9]{64}$/, 'Evidence fingerprint is required');
}
