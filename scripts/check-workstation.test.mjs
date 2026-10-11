import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('preflight reports missing tools without installation, authentication or history writes', () => {
  const isolatedEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== 'PATH'));
  isolatedEnvironment.PATH = '';
  const result = spawnSync(process.execPath, ['scripts/check-workstation.mjs'], {
    env: isolatedEnvironment, encoding: 'utf8', windowsHide: true,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  for (const label of ['Git executable', 'Ripgrep executable', 'GitHub CLI authenticated account', 'Repository Git metadata location']) {
    assert(result.stderr.includes(`FAIL: ${label}`));
  }
  assert.match(result.stderr, /approved execution fallback/);
  assert.doesNotMatch(result.stdout, /ACCOUNT:|Git metadata write access|PASS: workstation preflight/);
});
