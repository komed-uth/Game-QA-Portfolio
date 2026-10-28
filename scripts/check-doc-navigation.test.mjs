import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const run = (...files) => spawnSync(process.execPath, ['scripts/check-doc-navigation.mjs', ...files], { encoding: 'utf8' });
test('task navigation resolves compatibility anchors and representative task routes', () => {
  const result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('missing files and anchors fail with the source and selected target', t => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'doc-navigation-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const source = path.join(directory, 'index.md');
  writeFileSync(source, '[startup](missing.md#start)');
  const missingFile = run(source);
  assert.notEqual(missingFile.status, 0);
  assert.match(missingFile.stderr, /index.md.*missing.md/);
  writeFileSync(source, '[startup](target.md#absent)');
  writeFileSync(path.join(directory, 'target.md'), '# Present\n');
  const missingAnchor = run(source);
  assert.notEqual(missingAnchor.status, 0);
  assert.match(missingAnchor.stderr, /index.md.*absent/);
});
