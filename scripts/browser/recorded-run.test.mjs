import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { runRecordedSuite } from './recorded-run.mjs';

const suite = { label: 'fixture suite', checks: [{ name: 'first' }, { name: 'second' }] };
const stableInputs = new URL('./stable-inputs.mjs', import.meta.url).href;
const recorder = new URL('./recorded-run.mjs', import.meta.url).href;
const sink = () => new Writable({ write(chunk, encoding, callback) { callback(); } });
async function fixture(t, mode) {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-recorded-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src', 'input.ts'), 'before');
  // A real subprocess uses the real input-stability gate; no browser is needed.
  const worker = path.join(root, 'fixture.mjs');
  await writeFile(worker, `
    import { writeFile } from 'node:fs/promises';
    import { withStableInputs } from ${JSON.stringify(stableInputs)};
    const send = message => new Promise(resolve => process.send(message, resolve));
    const mode = ${JSON.stringify(mode)};
    console.log('fixture stdout'); console.error('fixture stderr');
    try {
      await withStableInputs(async (validate, { fingerprint }) => {
        await send({ type: 'inputs', fingerprint });
        await send({ type: 'check-start', name: 'first' });
        await validate();
        await send({ type: 'check-result', name: 'first', status: 'passed', durationMs: 10 });
        await send({ type: 'check-start', name: 'second' });
        if (mode === 'wait') {
          process.on('disconnect', () => process.exit(130));
          process.on('message', message => { if (message.type === 'interrupt') process.exit(130); });
          console.log('waiting for interruption');
          await new Promise(() => {});
        }
        if (mode === 'obsolete') await writeFile('src/input.ts', 'changed');
        if (mode === 'failure') {
          await validate();
          await send({ type: 'check-result', name: 'second', status: 'failed', durationMs: 20 });
          throw new Error('fixture assertion');
        }
        await validate();
        await send({ type: 'check-result', name: 'second', status: 'passed', durationMs: 20 });
        if (mode === 'final-edit') await writeFile('src/input.ts', 'changed at final gate');
      });
      if (mode !== 'missing-completion') await send({ type: 'complete', status: 'passed' });
    } catch (error) {
      console.error(error.message);
      await send({ type: 'complete', status: error.name === 'ObsoleteInputError' ? 'obsolete' : 'failed', error: error.message });
      process.exitCode = 1;
    } finally { if (process.connected) process.disconnect(); }
  `);
  return { root, worker };
}
async function readSummary(directory) {
  try { return JSON.parse(await readFile(path.join(directory, 'summary.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const lines = (await readFile(path.join(directory, 'progress.jsonl'), 'utf8')).split('\n');
  // A forcibly terminated write may leave a partial last record.
  for (const line of lines.reverse()) {
    try { return JSON.parse(line); } catch {}
  }
  throw new Error('No readable progress checkpoint');
}
async function waitForCheckpoint(root) {
  const deadline = Date.now() + 5000;
  let latest;
  while (Date.now() < deadline) {
    const [folder] = await readdir(path.join(root, '.scratch', 'browser-runs'));
    const directory = path.join(root, '.scratch', 'browser-runs', folder);
    const summary = await readSummary(directory);
    latest = summary;
    if (summary.checks[0]?.status === 'passed' && summary.checks[1]?.status === 'running') return directory;
    await delay(10);
  }
  throw new Error(`Expected durable checkpoint was not saved: ${JSON.stringify(latest)}`);
}

test('successful subprocess runs preserve output, commit, input identity and all check results', async t => {
  const options = await fixture(t, 'success');
  for (const args of [['init', '--quiet'], ['add', 'src/input.ts'], ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '--quiet', '-m', 'Fixture']]) {
    assert.equal(spawnSync('git', args, { cwd: options.root }).status, 0);
  }
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: options.root, encoding: 'utf8' }).stdout.trim();
  const result = await runRecordedSuite({ ...options, suite, stdout: sink(), stderr: sink() });
  assert.equal(result.exitCode, 0);
  const summary = await readSummary(result.directory);
  assert.equal(summary.status, 'passed');
  assert.equal(summary.commit, commit);
  assert.equal(summary.trackedChanges, false);
  assert.match(summary.inputFingerprint, /^[a-f0-9]{64}$/);
  assert.deepEqual(summary.checks.map(check => [check.name, check.status]), [['first', 'passed'], ['second', 'passed']]);
  assert(summary.endedAt);
  const output = await readFile(path.join(result.directory, 'output.log'), 'utf8');
  assert.match(output, /fixture stdout/); assert.match(output, /fixture stderr/);
  const second = await runRecordedSuite({ ...options, suite, stdout: sink(), stderr: sink() });
  assert.notEqual(second.directory, result.directory, 'Concurrent/repeated runs never overwrite prior evidence');
});

for (const [mode, status] of [['failure', 'failed'], ['obsolete', 'obsolete'], ['final-edit', 'obsolete'], ['missing-completion', 'incomplete']]) {
  test(`${mode} retains progress without claiming suite success`, async t => {
    const options = await fixture(t, mode);
    const result = await runRecordedSuite({ ...options, suite, stdout: sink(), stderr: sink() });
    assert.notEqual(result.exitCode, 0);
    const summary = await readSummary(result.directory);
    assert.equal(summary.status, status);
    assert.equal(summary.checks[0].status, 'passed');
    if (mode === 'failure') assert.equal(summary.checks[1].status, 'failed');
    if (mode === 'obsolete') assert.equal(summary.checks[1].status, 'obsolete');
    if (mode === 'final-edit') assert.equal(summary.checks[1].status, 'passed', 'Per-check passes do not override a failed final stability gate');
    if (mode !== 'missing-completion') assert(summary.error);
  });
}

test('cancellation preserves earlier passes and interrupted status', async t => {
  const options = await fixture(t, 'wait');
  const controller = new AbortController();
  let ready;
  const waiting = new Promise(resolve => { ready = resolve; });
  const stdout = new Writable({ write(chunk, encoding, callback) {
    if (chunk.toString().includes('waiting for interruption')) ready();
    callback();
  } });
  const run = runRecordedSuite({ ...options, suite, signal: controller.signal, stdout, stderr: sink() });
  void run.catch(() => {}); // Attach immediately while inspecting live progress.
  await waiting;
  await waitForCheckpoint(options.root);
  controller.abort();
  const result = await run;
  assert.equal(result.exitCode, 130);
  const summary = await readSummary(result.directory);
  assert.equal(summary.status, 'interrupted');
  assert.equal(summary.checks[0].status, 'passed');
  assert.equal(summary.checks[1].status, 'running');
  assert.match(await readFile(path.join(result.directory, 'output.log'), 'utf8'), /waiting for interruption/);
});

test('a forcibly terminated supervisor leaves readable incomplete checkpoints', async t => {
  const options = await fixture(t, 'wait');
  const entry = path.join(options.root, 'supervisor.mjs');
  await writeFile(entry, `import { runRecordedSuite } from ${JSON.stringify(recorder)};
    await runRecordedSuite({ suite: ${JSON.stringify(suite)}, worker: ${JSON.stringify(options.worker)} });`);
  const child = spawn(process.execPath, [entry], { cwd: options.root, stdio: ['ignore', 'pipe', 'pipe'] });
  let errors = '';
  child.stderr.on('data', chunk => { errors += chunk; });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  await new Promise((resolve, reject) => {
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; if (output.includes('waiting for interruption')) resolve(); });
    child.once('error', reject);
    child.once('exit', () => reject(new Error('Supervisor exited before checkpoint')));
  });
  const directory = await waitForCheckpoint(options.root).catch(error => { throw new Error(`${error.message}\nSupervisor stderr: ${errors}`); });
  const closed = new Promise(resolve => child.once('close', resolve));
  child.kill('SIGKILL');
  await closed;
  const summary = await readSummary(directory);
  assert.equal(summary.status, 'running', 'Abrupt termination cannot manufacture a final result');
  assert.equal(summary.endedAt, undefined);
  await assert.rejects(readFile(path.join(directory, 'summary.json')), { code: 'ENOENT' });
  assert.equal(summary.checks[0].status, 'passed');
  assert.match(await readFile(path.join(directory, 'output.log'), 'utf8'), /waiting for interruption/);
});
