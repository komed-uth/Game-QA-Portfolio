import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const checker = fileURLToPath(new URL('./check-diff-whitespace.mjs', import.meta.url));

function run(cwd, command, args) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', windowsHide: true });
  assert.ifError(result.error);
  return result;
}

function git(cwd, ...args) {
  const result = run(cwd, 'git', args);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

async function repository(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'portfolio-whitespace-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  git(directory, 'init', '--quiet');
  git(directory, 'config', 'user.name', 'Portfolio Test');
  git(directory, 'config', 'user.email', 'portfolio-test@example.invalid');
  return directory;
}

function check(cwd, ...args) {
  return run(cwd, process.execPath, [checker, ...args]);
}

test('fails on trailing whitespace added to the pull-request diff with a line diagnostic', async t => {
  const directory = await repository(t);
  await writeFile(path.join(directory, 'notes.txt'), 'clean line\n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'base');
  const base = git(directory, 'rev-parse', 'HEAD');

  await writeFile(path.join(directory, 'notes.txt'), 'clean line\nnew line with trailing space \n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'add whitespace');
  const head = git(directory, 'rev-parse', 'HEAD');

  const result = check(directory, '--base', base, '--head', head);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /FAIL: whitespace errors in pull-request diff/);
  assert.match(result.stderr, /notes\.txt:2: trailing whitespace\./);
});

test('uses the same trailing-whitespace policy when local Git configuration disables it', async t => {
  const directory = await repository(t);
  await writeFile(path.join(directory, 'notes.txt'), 'clean line\n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'base');
  const base = git(directory, 'rev-parse', 'HEAD');

  await writeFile(path.join(directory, 'notes.txt'), 'clean line\nnew line with trailing space \n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'add whitespace');
  const head = git(directory, 'rev-parse', 'HEAD');
  git(directory, 'config', 'core.whitespace', '-blank-at-eol');

  const result = check(directory, '--base', base, '--head', head);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /notes\.txt:2: trailing whitespace\./);
});

test('passes a clean diff without flagging unchanged historical whitespace', async t => {
  const directory = await repository(t);
  await writeFile(path.join(directory, 'legacy.txt'), 'historical trailing space \n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'historical content');
  const base = git(directory, 'rev-parse', 'HEAD');

  await writeFile(path.join(directory, 'new.txt'), 'clean addition\n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'clean change');
  const head = git(directory, 'rev-parse', 'HEAD');

  const result = check(directory, '--base', base, '--head', head);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PASS: no whitespace errors/);
});

test('checks unstaged tracked work before a commit', async t => {
  const directory = await repository(t);
  await writeFile(path.join(directory, 'notes.txt'), 'clean line\n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'base');
  const base = git(directory, 'rev-parse', 'HEAD');

  await writeFile(path.join(directory, 'notes.txt'), 'clean line\nunstaged trailing space \n');
  const result = check(directory, '--base', base);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unstaged tracked diff/);
  assert.match(result.stderr, /notes\.txt:2: trailing whitespace\./);
});

test('checks staged content even when the unstaged copy has already been fixed', async t => {
  const directory = await repository(t);
  await writeFile(path.join(directory, 'notes.txt'), 'clean line\n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'base');
  const base = git(directory, 'rev-parse', 'HEAD');

  await writeFile(path.join(directory, 'notes.txt'), 'clean line\nstaged trailing space \n');
  git(directory, 'add', 'notes.txt');
  await writeFile(path.join(directory, 'notes.txt'), 'clean line\n');

  const result = check(directory, '--base', base);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /FAIL: whitespace errors in staged diff against base/);
  assert.match(result.stderr, /notes\.txt:2: trailing whitespace\./);
});

test('fails clearly when a base, head, or merge base is unavailable', async t => {
  const directory = await repository(t);
  await writeFile(path.join(directory, 'notes.txt'), 'base\n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'base');
  const base = git(directory, 'rev-parse', 'HEAD');

  const missingBase = check(directory, '--base', 'missing-base', '--head', base);
  assert.notEqual(missingBase.status, 0);
  assert.match(missingBase.stderr, /base revision "missing-base" is not available/);
  assert.match(missingBase.stderr, /do not skip this guardrail/);

  const missingHead = check(directory, '--base', base, '--head', 'missing-head');
  assert.notEqual(missingHead.status, 0);
  assert.match(missingHead.stderr, /head revision "missing-head" is not available/);

  git(directory, 'switch', '--orphan', 'unrelated-history');
  await rm(path.join(directory, 'notes.txt'), { force: true });
  await writeFile(path.join(directory, 'different.txt'), 'different root\n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '--quiet', '-m', 'unrelated root');
  const unrelatedHead = git(directory, 'rev-parse', 'HEAD');

  const missingMergeBase = check(directory, '--base', base, '--head', unrelatedHead);
  assert.notEqual(missingMergeBase.status, 0);
  assert.match(missingMergeBase.stderr, /No merge base is available/);
  assert.match(missingMergeBase.stderr, /Fetch enough history/);
});
