import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, rename, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { withStableInputs } from './stable-inputs.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-inputs-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src'));
  await mkdir(path.join(root, 'scripts'));
  await mkdir(path.join(root, 'dist'));
  await writeFile(path.join(root, 'dist', 'index.html'), 'built page');
  await writeFile(path.join(root, 'src', 'gallery.ts'), 'original');
  await writeFile(path.join(root, 'scripts', 'check.mjs'), 'original check');
  return root;
}

test('unchanged content and diagnostic output remain valid', async t => {
  const root = await fixture(t);
  await withStableInputs(async () => {
    await utimes(path.join(root, 'src', 'gallery.ts'), new Date(), new Date());
    await mkdir(path.join(root, '.scratch', 'browser-checks'), { recursive: true });
    await writeFile(path.join(root, '.scratch', 'browser-checks', 'trace.zip'), 'diagnostic output');
  }, root);
});
for (const [name, edit, file] of [
  ['source edit', root => writeFile(path.join(root, 'src', 'gallery.ts'), 'changed'), 'src/gallery.ts'],
  ['check edit', root => writeFile(path.join(root, 'scripts', 'check.mjs'), 'changed check'), 'scripts/check.mjs'],
  ['changed production bundle', root => writeFile(path.join(root, 'dist', 'index.html'), 'rebuilt page'), 'dist/index.html'],
  ['new source file', root => writeFile(path.join(root, 'src', 'new.ts'), 'new'), 'src/new.ts'],
  ['removed source file', root => rm(path.join(root, 'src', 'gallery.ts')), 'src/gallery.ts'],
  ['renamed source file', root => rename(path.join(root, 'src', 'gallery.ts'), path.join(root, 'src', 'renamed.ts')), 'src/renamed.ts'],
]) {
  test(`${name} invalidates successful results and names the changed input`, async t => {
    const root = await fixture(t);
    await assert.rejects(withStableInputs(() => edit(root), root), error => {
      assert.match(error.message, /OBSOLETE:.*Rebuild and rerun/);
      assert(error.message.includes(file)); return true;
    });
  });
}
test('changed inputs invalidate a failed check and retain its original cause', async t => {
  const root = await fixture(t);
  const original = new Error('old assertion failed');
  await assert.rejects(withStableInputs(async () => {
    await writeFile(path.join(root, 'scripts', 'check.mjs'), 'new assertion');
    throw original;
  }, root), error => { assert.match(error.message, /OBSOLETE/); assert.equal(error.cause, original); return true; });
});
test('unchanged failures preserve the check error', async t => {
  const root = await fixture(t); const original = new Error('real failure');
  await assert.rejects(withStableInputs(async () => { throw original; }, root), error => error === original);
});
