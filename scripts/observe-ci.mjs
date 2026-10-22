import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const conclusions = new Set(['success', 'failure', 'cancelled', 'canceled', 'timed_out', 'action_required', 'neutral', 'skipped', 'stale', 'startup_failure']);

function options(args) {
  const result = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag === '--watch' && !result.watch) { result.watch = true; continue; }
    if (!['--repo', '--remote', '--pr', '--timeout-seconds', '--interval-seconds'].includes(flag) || !args[index + 1] || result[flag.slice(2)] !== undefined) {
      throw new Error('Usage: node scripts/observe-ci.mjs --repo <owner/name> --remote <remote> --pr <number> [--watch --timeout-seconds 300 --interval-seconds 15]');
    }
    result[flag.slice(2)] = args[++index];
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(result.repo ?? '') ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(result.remote ?? '') ||
      !/^[1-9]\d*$/.test(result.pr ?? '')) throw new Error('Provide explicit --repo owner/name, --remote and positive --pr.');
  if (!result.watch && result['interval-seconds'] !== undefined) throw new Error('--interval-seconds requires --watch.');
  result.timeout = Number(result['timeout-seconds'] ?? (result.watch ? 300 : 60));
  result.interval = Number(result['interval-seconds'] ?? 15);
  if (!Number.isFinite(result.timeout) || result.timeout < 0.1 || result.timeout > 3600 || !Number.isFinite(result.interval) || result.interval < 0.1 || result.interval > 60) throw new Error('Timeout must be 0.1-3600 seconds; interval must be 0.1-60 seconds.');
  return result;
}

const cancellation = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => cancellation.abort());

async function execute(command, args, deadline, { tree = false } = {}) {
  if (cancellation.signal.aborted) throw new Error('Observation interrupted; success is unknown.');
  const remaining = deadline - performance.now();
  if (remaining <= 0) throw new Error('Observation timed out; success is unknown.');
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', expired = false;
    let cleanup;
    const stop = () => {
      if (cleanup || !child.pid) return;
      if (process.platform !== 'win32') {
        cleanup = new Promise(resolveCleanup => {
          try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already exited. */ }
          setTimeout(() => {
            try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already exited. */ }
            resolveCleanup();
          }, 200);
        });
        return;
      }
      if (!tree) { child.kill(); return; }
      // Readiness owns Git subprocesses too. Stop only this command's process tree.
      cleanup = new Promise(resolveCleanup => {
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        const finish = () => { clearTimeout(killTimer); resolveCleanup(); };
        const killTimer = setTimeout(() => { killer.kill(); child.kill(); finish(); }, 1500);
        killer.once('error', () => { child.kill(); finish(); });
        killer.once('close', finish);
      });
    };
    const timer = setTimeout(() => { expired = true; stop(); }, Math.min(remaining, 60000));
    cancellation.signal.addEventListener('abort', stop, { once: true });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', text => { stdout = (stdout + text).slice(-1024 * 1024); });
    child.stderr.on('data', text => { stderr = (stderr + text).slice(-6000); });
    child.on('error', reject);
    child.on('close', async (code, signal) => {
      clearTimeout(timer);
      cancellation.signal.removeEventListener('abort', stop);
      await cleanup;
      if (cancellation.signal.aborted) reject(new Error('Observation interrupted; success is unknown.'));
      else if (expired || performance.now() >= deadline) reject(new Error('Observation timed out while reading CI/readiness; success is unknown.'));
      else resolve({ code, signal, stdout, stderr });
    });
  });
}

async function github(args, deadline) {
  let prefix = [];
  if (process.env.PORTFOLIO_GH_CLI_ARGS_JSON) {
    prefix = JSON.parse(process.env.PORTFOLIO_GH_CLI_ARGS_JSON);
    if (!Array.isArray(prefix) || prefix.some(item => typeof item !== 'string')) throw new Error('PORTFOLIO_GH_CLI_ARGS_JSON must contain a string array.');
  }
  const result = await execute(process.env.PORTFOLIO_GH_CLI || 'gh', [...prefix, ...args], deadline);
  if (result.code !== 0) throw new Error(`GitHub ${args.slice(0, 2).join(' ')} read unavailable (exit ${result.code ?? 'unknown'}${result.signal ? `, interrupted by ${result.signal}` : ''}): ${result.stderr.trim() || 'unknown result'}`);
  return result.stdout;
}

async function api(endpoint, deadline) {
  return JSON.parse(await github(['api', endpoint], deadline));
}

async function observe(settings) {
  const deadline = performance.now() + settings.timeout * 1000;
  console.log(`Actions / PR checks: https://github.com/${settings.repo}/pull/${settings.pr}/checks`);
  const endpoint = `repos/${settings.repo}`;
  const pr = await api(`${endpoint}/pulls/${settings.pr}`, deadline);
  if (String(pr.state).toLowerCase() !== 'open' || !/^[a-f0-9]{40}$/i.test(pr.head?.sha ?? '') ||
      !pr.head.ref || pr.base?.repo?.full_name?.toLowerCase() !== settings.repo.toLowerCase() || String(pr.number) !== settings.pr) throw new Error('PR identity or current head is unavailable.');
  const list = await api(`${endpoint}/actions/workflows/validate-pull-requests.yml/runs?event=pull_request&branch=${encodeURIComponent(pr.head.ref)}&per_page=100`, deadline);
  const pinned = list.workflow_runs?.find(item => item.head_sha === pr.head.sha && item.head_branch === pr.head.ref && item.event === 'pull_request');
  if (!pinned || !Number.isSafeInteger(pinned.id) || !Number.isSafeInteger(pinned.run_attempt) || pinned.id < 1 || pinned.run_attempt < 1) throw new Error('No validation run is available for the current PR head; success is unknown.');
  function validateRun(run) {
    if (run.id !== pinned.id || run.run_attempt !== pinned.run_attempt || run.head_sha !== pr.head.sha || run.head_branch !== pr.head.ref || run.event !== 'pull_request') throw new Error('Observed run or attempt changed; start a new observation for the current head and attempt.');
    const association = run.pull_requests?.find(item => String(item.number) === settings.pr && item.head?.sha === pr.head.sha);
    const baseRepo = association?.base?.repo;
    if (!association || !(baseRepo?.full_name?.toLowerCase() === settings.repo.toLowerCase() || baseRepo?.url?.toLowerCase() === `https://api.github.com/repos/${settings.repo}`.toLowerCase())) throw new Error('Run PR association is unavailable or belongs to another PR/repository; success is unknown.');
    return run;
  }
  validateRun(pinned);
  console.log(`PR #${settings.pr} head ${pr.head.sha}; run ${pinned.id}, attempt ${pinned.run_attempt}`);
  console.log(`Actions: https://github.com/${settings.repo}/actions/runs/${pinned.id}/attempts/${pinned.run_attempt}`);
  console.log('Live logs may be unavailable until a job completes; use the Actions URL now.');
  const transitions = new Map();
  function transition(key, label, state, record) {
    if (transitions.get(key) === state) return;
    transitions.set(key, state);
    const started = Date.parse(record.started_at);
    const ended = record.status === 'completed' ? Date.parse(record.completed_at) : Date.now();
    const elapsed = Number.isFinite(started) && Number.isFinite(ended) && ended >= started
      ? `${((ended - started) / 1000).toFixed(1)}s` : 'unknown';
    console.log(`${label}: ${state}; elapsed ${elapsed}`);
  }
  while (true) {
    let run = validateRun(await api(`${endpoint}/actions/runs/${pinned.id}`, deadline));
    const jobs = await api(`${endpoint}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`, deadline);
    if (!Array.isArray(jobs.jobs)) throw new Error('Job state unavailable; success is unknown.');
    for (const job of jobs.jobs) {
      const statuses = ['queued', 'in_progress', 'completed', 'waiting', 'pending', 'requested'];
      if (!Number.isSafeInteger(job.id) || job.id < 1 || typeof job.name !== 'string' || !job.name || !statuses.includes(job.status) ||
          (job.status === 'completed' && !conclusions.has(job.conclusion)) ||
          (job.run_id !== undefined && job.run_id !== pinned.id) || (job.run_attempt !== undefined && job.run_attempt !== pinned.run_attempt) ||
          (job.head_sha !== undefined && job.head_sha !== pr.head.sha)) throw new Error('Job state unavailable or inconsistent with this run/attempt; success is unknown.');
      if (job.steps !== undefined && !Array.isArray(job.steps)) throw new Error('Job step state unavailable; success is unknown.');
      for (const step of job.steps ?? []) {
        if (!Number.isSafeInteger(step.number) || step.number < 1 || typeof step.name !== 'string' || !step.name || !statuses.includes(step.status) ||
            (step.status === 'completed' && !conclusions.has(step.conclusion))) throw new Error('Job step state unavailable; success is unknown.');
      }
      transition(`job:${job.id}`, job.name, `${job.status ?? 'unknown'}${job.conclusion ? ` / ${job.conclusion}` : ''}`, job);
      for (const step of job.steps ?? []) transition(`step:${job.id}:${step.number}`, `  ${step.name}`, `${step.status ?? 'unknown'}${step.conclusion ? ` / ${step.conclusion}` : ''}`, step);
    }
    const currentPr = await api(`${endpoint}/pulls/${settings.pr}`, deadline);
    if (currentPr.head?.sha !== pr.head.sha || currentPr.head?.ref !== pr.head.ref || currentPr.state !== 'open') throw new Error('PR head changed or PR closed during observation; inspect the current PR and start again.');
    run = validateRun(await api(`${endpoint}/actions/runs/${pinned.id}`, deadline));
    transition('run', 'Validation', `${run.status ?? 'unknown'}${run.conclusion ? ` / ${run.conclusion}` : ''}`, { status: run.status, started_at: run.run_started_at, completed_at: run.updated_at });
    const awaitingJobs = run.status === 'completed' && run.conclusion === 'success' && jobs.jobs.some(job => job.status !== 'completed');
    if (run.status === 'completed' && run.conclusion === 'success' && (!jobs.jobs.length || (awaitingJobs && !settings.watch))) throw new Error('Job state unavailable or unfinished for terminal CI; success is unknown.');
    if (run.status === 'completed' && run.conclusion === 'success' && !awaitingJobs) {
      console.log('CI PASSED on observed exact head; running existing merge-readiness check.');
      const readiness = await execute(process.execPath, [fileURLToPath(new URL('./check-merge-readiness.mjs', import.meta.url)), '--repo', settings.repo, '--remote', settings.remote, '--pr', settings.pr], deadline, { tree: true });
      if (readiness.code === 0) {
        const finalPr = await api(`${endpoint}/pulls/${settings.pr}`, deadline);
        const finalRun = validateRun(await api(`${endpoint}/actions/runs/${pinned.id}`, deadline));
        if (finalPr.head?.sha !== pr.head.sha || finalPr.head?.ref !== pr.head.ref || finalPr.state !== 'open' || finalRun.status !== 'completed' || finalRun.conclusion !== 'success') throw new Error('PR head or validation changed during readiness; success is unknown.');
      }
      process.stdout.write(readiness.stdout);
      process.stderr.write(readiness.stderr);
      return readiness.code === 0 ? 0 : 1;
    }
    if (run.status === 'completed' && !awaitingJobs) {
      if (!conclusions.has(run.conclusion)) throw new Error('Completed run has no known conclusion; success is unknown.');
      const outcome = ['cancelled', 'canceled'].includes(run.conclusion) ? 'CANCELLED' : 'FAILED';
      console.log(`CI ${outcome}: ${run.conclusion}`);
      try {
        const logs = await github(['run', 'view', String(run.id), '--repo', settings.repo, '--attempt', String(run.run_attempt), '--log-failed'], deadline);
        console.log(`Failed log excerpt (last 6000 characters):\n${logs.slice(-6000) || 'No failed logs available; use the Actions URL.'}`);
      } catch {
        console.log('Failed logs unavailable; use the Actions URL above.');
      }
      try {
        const artifacts = await api(`${endpoint}/actions/runs/${run.id}/artifacts?per_page=100`, deadline);
        for (const artifact of artifacts.artifacts ?? []) {
          if (Number.isSafeInteger(artifact.id)) console.log(`Artifact: ${artifact.name}${artifact.expired ? ' (expired)' : ''} https://github.com/${settings.repo}/actions/runs/${run.id}/artifacts/${artifact.id}`);
        }
      } catch {
        console.log('Artifact metadata unavailable; inspect the Actions URL above.');
      }
      return 1;
    }
    if (!awaitingJobs && !['queued', 'in_progress', 'requested', 'waiting', 'pending'].includes(run.status)) throw new Error(`Unknown workflow state ${run.status ?? 'unavailable'}; success is unknown.`);
    if (!settings.watch) { console.log('IN PROGRESS: validation has no confirmed terminal success.'); return 1; }
    if (performance.now() >= deadline) throw new Error('Observation timed out; success is unknown.');
    await new Promise(resolve => {
      const finish = () => { clearTimeout(timer); cancellation.signal.removeEventListener('abort', finish); resolve(); };
      const timer = setTimeout(finish, Math.min(settings.interval * 1000, deadline - performance.now()));
      cancellation.signal.addEventListener('abort', finish, { once: true });
    });
    if (cancellation.signal.aborted) throw new Error('Observation interrupted; success is unknown.');
  }
}

try {
  process.exitCode = await observe(options(process.argv.slice(2)));
} catch (error) {
  console.error(`UNKNOWN / NOT READY: ${error.message}`);
  process.exitCode = 1;
}
