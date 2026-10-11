import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

test('report generation normalizes CRLF copies, preserves original bytes and remains repeatable', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-reports-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'scripts'));
  await mkdir(path.join(root, 'Performance-Testing-Mobile', 'Full Report'), { recursive: true });
  await copyFile(new URL('./sync-reports.mjs', import.meta.url), path.join(root, 'scripts', 'sync-reports.mjs'));
  await copyFile(new URL('../.gitattributes', import.meta.url), path.join(root, '.gitattributes'));
  const original = Buffer.from('<html>\r\n<head><title>Report</title></head>\r\n<body><script>const meerkatData = {"screenshotPathLists":[]};</script></body>\r\n</html>\r\n');
  const filenames = ['Very_High', 'High', 'Medium', 'Low', 'Very_Low'].map(quality => `S10_${quality}_Fixed.html`);
  for (const filename of filenames) await writeFile(path.join(root, 'Performance-Testing-Mobile', 'Full Report', filename), original);
  const run = () => {
    const result = spawnSync(process.execPath, ['scripts/sync-reports.mjs'], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  run();
  for (const filename of filenames) {
    const generated = await readFile(path.join(root, 'public', 'Performance-Testing-Mobile', 'Full Report', filename), 'utf8');
    assert(!generated.includes('\r'));
    assert.equal(generated.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<link rel="stylesheet" href="../../report-responsive.css">\n', ''), original.toString().replace(/\r\n/g, '\n'));
    assert.deepEqual(await readFile(path.join(root, 'Performance-Testing-Mobile', 'Full Report', filename)), original);
  }
  for (const args of [['init', '--quiet'], ['config', 'core.autocrlf', 'true'], ['add', '.'],
    ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '--quiet', '-m', 'Reports']]) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  // Match the Windows checkout mode that produced the original session's churn.
  const preservedTime = new Date('2000-01-01T00:00:00Z');
  for (const filename of filenames) await utimes(path.join(root, 'public', 'Performance-Testing-Mobile', 'Full Report', filename), preservedTime, preservedTime);
  for (let pass = 0; pass < 2; pass++) {
    run();
    const status = spawnSync('git', ['status', '--porcelain', '--', 'public'], { cwd: root, encoding: 'utf8' });
    assert.equal(status.status, 0, status.stderr);
    assert.equal(status.stdout, '');
    const tracked = spawnSync('git', ['ls-files', '--eol', '--', 'public'], { cwd: root, encoding: 'utf8' });
    assert.equal(tracked.status, 0);
    assert(tracked.stdout.split('\n').filter(Boolean).every(line => line.startsWith('i/lf    w/lf')));
    for (const filename of filenames) {
      assert.equal((await stat(path.join(root, 'public', 'Performance-Testing-Mobile', 'Full Report', filename))).mtimeMs, preservedTime.getTime(), 'Identical generated reports are not rewritten');
      assert.deepEqual(await readFile(path.join(root, 'Performance-Testing-Mobile', 'Full Report', filename)), original);
    }
  }
});
