import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, closeSync, openSync, renameSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The supervisor owns evidence independently of the browser worker's lifetime.
export async function runRecordedSuite({ suite, args = [], root = process.cwd(), signal,
  worker = new URL('./run-suite.mjs', import.meta.url), stdout = process.stdout, stderr = process.stderr }) {
  const artifactRoot = path.join(root, '.scratch', 'browser-runs');
  await mkdir(artifactRoot, { recursive: true });
  const directory = await mkdtemp(path.join(artifactRoot, 'run-'));
  const summaryPath = path.join(directory, 'summary.json');
  const log = openSync(path.join(directory, 'output.log'), 'a');
  const progress = openSync(path.join(directory, 'progress.jsonl'), 'a');
  const git = args => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 3000 });
    return result.status === 0 ? result.stdout.trim() : null;
  };
  const changes = git(['status', '--porcelain', '--untracked-files=no']);
  const summary = { suite: suite.label, checks: [], selectedChecks: suite.checks.map(check => check.name),
    commit: git(['rev-parse', 'HEAD']), trackedChanges: changes === null ? null : changes !== '',
    pullRequestNumber: Number.isSafeInteger(Number(process.env.PORTFOLIO_PR_NUMBER)) && Number(process.env.PORTFOLIO_PR_NUMBER) > 0 ? Number(process.env.PORTFOLIO_PR_NUMBER) : null,
    pullRequestHeadSha: /^[a-f0-9]{40}$/i.test(process.env.PORTFOLIO_PR_HEAD_SHA ?? '') ? process.env.PORTFOLIO_PR_HEAD_SHA.toLowerCase() : null,
    preview: process.env.PORTFOLIO_URL ? 'external' : 'local',
    startedAt: new Date().toISOString(), status: 'running', inputFingerprint: null };
  // Append-only checkpoints stay readable without replacing an open Windows file.
  const save = () => appendFileSync(progress, JSON.stringify(summary) + '\n');
  const finish = () => {
    save();
    writeFileSync(`${summaryPath}.tmp`, JSON.stringify(summary, null, 2) + '\n');
    renameSync(`${summaryPath}.tmp`, summaryPath);
  };
  const recordOutput = (chunk, destination) => {
    appendFileSync(log, chunk);
    destination.write(chunk);
  };
  save();
  stdout.write(`RUN EVIDENCE: ${directory}\n`);
  let child;
  let interrupted = signal?.aborted ?? false;
  let completion;
  let timer;
  let persistenceError;
  const stopWorker = () => {
    if (child?.connected) child.send({ type: 'interrupt' }, () => {});
    if (child && !timer) timer = setTimeout(() => child.kill(), 5000);
  };
  const capturePersistenceError = error => { persistenceError = error; stopWorker(); };
  const interrupt = () => {
    interrupted = true;
    summary.status = 'interrupted';
    try { save(); } catch (error) { capturePersistenceError(error); }
    // Give the worker time to close its browser and owned preview on every OS.
    stopWorker();
  };
  signal?.addEventListener('abort', interrupt, { once: true });
  try {
    if (interrupted) {
      summary.status = 'interrupted';
      summary.endedAt = new Date().toISOString();
      summary.exitCode = 130;
      finish();
      return { directory, exitCode: 130, summary };
    }
    child = spawn(process.execPath, [worker instanceof URL ? fileURLToPath(worker) : worker, ...args],
      { cwd: root, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    child.stdout.on('data', chunk => recordOutput(chunk, stdout));
    child.stderr.on('data', chunk => recordOutput(chunk, stderr));
    child.on('message', message => {
      if (message.type === 'inputs') summary.inputFingerprint = message.fingerprint;
      if (message.type === 'check-start') {
        summary.checks.push({ name: message.name, status: 'running', startedAt: new Date().toISOString() });
      }
      if (message.type === 'check-result') {
        const check = summary.checks.at(-1);
        if (check?.name === message.name) Object.assign(check, { status: message.status, durationMs: message.durationMs });
      }
      if (message.type === 'complete') completion = message;
      try { save(); } catch (error) { capturePersistenceError(error); }
    });
    if (persistenceError) throw persistenceError;
    const { code, exitSignal } = await new Promise(resolve => {
      child.once('error', error => { summary.error = error.message; });
      child.once('close', (code, exitSignal) => resolve({ code, exitSignal }));
    });
    const completeChecks = summary.checks.length === summary.selectedChecks.length &&
      summary.checks.every((check, index) => check.name === summary.selectedChecks[index] && check.status === 'passed');
    summary.status = interrupted || exitSignal ? 'interrupted' :
      completion?.status === 'obsolete' ? 'obsolete' :
      completion?.status === 'passed' && code === 0 && completeChecks && /^[a-f0-9]{64}$/.test(summary.inputFingerprint) ? 'passed' :
      completion?.status === 'failed' || code !== 0 ? 'failed' : 'incomplete';
    if (completion?.error) summary.error = completion.error;
    if (summary.status === 'obsolete' && summary.checks.at(-1)?.status === 'running') summary.checks.at(-1).status = 'obsolete';
    summary.endedAt = new Date().toISOString();
    summary.exitCode = code;
    summary.signal = exitSignal;
    finish();
    return { directory, summary, exitCode: summary.status === 'passed' ? 0 : interrupted ? 130 : code || 1 };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', interrupt);
    closeSync(log);
    closeSync(progress);
  }
}
