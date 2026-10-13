import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { selectSuite } from './browser/check-suites.mjs';

const workflowFile = 'validate-pull-requests.yml';
const workflowName = 'Validate pull requests';
const validationJob = 'build-and-browser';
const attestationArtifact = 'browser-validation-evidence';

class NotReady extends Error {}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (!['--repo', '--remote', '--pr'].includes(flag) || !args[index + 1]) {
      throw new NotReady('Usage: node scripts/check-merge-readiness.mjs --repo <owner/name> --remote <remote> --pr <number>');
    }
    const key = flag.slice(2);
    if (options[key]) throw new NotReady(`Option ${flag} was provided more than once.`);
    options[key] = args[++index];
  }
  if (!options.repo || !/^[^/\s]+\/[^/\s]+$/.test(options.repo)) {
    throw new NotReady('Provide --repo as owner/name so the pull request and base repository are explicit.');
  }
  if (!options.remote || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(options.remote)) {
    throw new NotReady('Provide --remote with a valid Git remote name.');
  }
  if (!options.pr || !/^\d+$/.test(options.pr) || Number(options.pr) < 1) {
    throw new NotReady('Provide --pr with a positive pull-request number.');
  }
  return { ...options, pr: Number(options.pr) };
}

function execute(command, args, { cwd, env = process.env, timeout = 30000 } = {}) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout, windowsHide: true });
  if (result.error) throw new NotReady(`${command} could not run (${result.error.code ?? result.error.message}).`);
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function git(root, args, timeout = 30000) {
  const result = execute('git', args, { cwd: root, timeout });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`;
    throw new NotReady(`Git ${args[0]} failed: ${detail}`);
  }
  return result.stdout.trim();
}

function github(root, args, allowedExitCodes = [0]) {
  let prefix = [];
  if (process.env.PORTFOLIO_GH_CLI_ARGS_JSON) {
    try {
      prefix = JSON.parse(process.env.PORTFOLIO_GH_CLI_ARGS_JSON);
      if (!Array.isArray(prefix) || prefix.some(argument => typeof argument !== 'string')) throw new Error('expected a string array');
    } catch (error) {
      throw new NotReady(`PORTFOLIO_GH_CLI_ARGS_JSON must be a JSON array of strings (${error.message}).`);
    }
  }
  const command = process.env.PORTFOLIO_GH_CLI || 'gh';
  const result = execute(command, [...prefix, ...args], { cwd: root, timeout: 60000 });
  if (!allowedExitCodes.includes(result.status)) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`;
    throw new NotReady(`GitHub CLI ${args.slice(0, 2).join(' ')} failed: ${detail}`);
  }
  return result.stdout;
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    throw new NotReady(`${label} returned invalid JSON; GitHub state could not be verified.`);
  }
}

function normalizeRepository(repository) {
  return repository.trim().replace(/\.git$/i, '').toLowerCase();
}

function repositoryFromRemoteUrl(url) {
  const patterns = [
    /^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i,
    /^ssh:\/\/git@github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i,
    /^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i,
  ];
  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) return normalizeRepository(match[1]);
  }
  throw new NotReady(`Remote URL is not a recognizable github.com owner/name URL: ${url}`);
}

function validatePullRequest(pr, expectedNumber, repository) {
  if (Number(pr.number) !== expectedNumber) throw new NotReady(`GitHub returned a different pull request than #${expectedNumber}.`);
  if (String(pr.state).toUpperCase() !== 'OPEN') throw new NotReady(`Pull request #${expectedNumber} is ${String(pr.state).toLowerCase()}, not open.`);
  if (normalizeRepository(pr.baseRepository?.nameWithOwner ?? '') !== normalizeRepository(repository)) {
    throw new NotReady(`Pull request #${expectedNumber} targets ${pr.baseRepository?.nameWithOwner ?? 'an unknown repository'}, not ${repository}.`);
  }
  if (!pr.headRepository?.nameWithOwner) throw new NotReady(`Pull request #${expectedNumber} has no published head repository.`);
  if (!/^[a-f0-9]{40}$/i.test(pr.headRefOid ?? '')) throw new NotReady(`Pull request #${expectedNumber} did not provide an exact 40-character head SHA.`);
  if (!pr.headRefName || !pr.baseRefName) throw new NotReady(`Pull request #${expectedNumber} is missing its head or target branch name.`);
  return { headSha: pr.headRefOid.toLowerCase(), headBranch: pr.headRefName, baseBranch: pr.baseRefName };
}

function readPullRequest(root, options) {
  const fields = 'number,state,headRefName,headRefOid,headRepository,baseRefName,baseRefOid,baseRepository,mergeable,mergeStateStatus';
  const output = github(root, ['pr', 'view', String(options.pr), '--repo', options.repo, '--json', fields]);
  const pr = parseJson(output, 'Pull-request metadata');
  return { pr, ...validatePullRequest(pr, options.pr, options.repo) };
}

function checkGitHubChecks(root, options) {
  const fields = 'name,state,workflow,bucket';
  const output = github(root, [
    'pr', 'checks', String(options.pr), '--repo', options.repo, '--json', fields,
  ], [0, 1, 8]);
  if (output.trim() === '') throw new NotReady('GitHub did not return check results; the required validation status is unavailable.');
  const checks = parseJson(output, 'Pull-request checks');
  if (!Array.isArray(checks)) throw new NotReady('Pull-request checks did not return a list.');
  const validationChecks = checks.filter(check =>
    check.name === validationJob || check.workflow === workflowName);
  if (!validationChecks.length) throw new NotReady(`Required validation is missing: ${workflowName} / ${validationJob}.`);

  for (const check of validationChecks) {
    if (check.bucket === 'pass' || String(check.state).toUpperCase() === 'SUCCESS') continue;
    const state = String(check.bucket || check.state || 'unavailable').toLowerCase();
    if (state === 'pending' || state === 'in_progress' || state === 'queued') {
      throw new NotReady(`Required validation is still running: ${check.name} (${check.state ?? check.bucket}).`);
    }
    if (state === 'cancel' || state === 'cancelled' || state === 'canceled') {
      throw new NotReady(`Required validation was cancelled: ${check.name}.`);
    }
    if (state === 'fail' || state === 'failure' || state === 'timed_out' || state === 'action_required') {
      throw new NotReady(`Required validation failed: ${check.name} (${check.state ?? check.bucket}).`);
    }
    throw new NotReady(`Required validation is not successful: ${check.name} (${check.state ?? check.bucket ?? 'unknown'}).`);
  }
}

function readValidationRuns(root, options, headBranch) {
  const fields = 'databaseId,status,conclusion,event,headBranch,headSha,workflowName,updatedAt,startedAt';
  const output = github(root, [
    'run', 'list', '--repo', options.repo, '--workflow', workflowFile,
    '--branch', headBranch, '--event', 'pull_request', '--limit', '100', '--json', fields,
  ]);
  const runs = parseJson(output, 'Validation workflow history');
  if (!Array.isArray(runs)) throw new NotReady('Validation workflow history did not return a list.');
  return runs.filter(run => run.workflowName === workflowName && run.event === 'pull_request' && run.headBranch === headBranch)
    .sort((left, right) => Date.parse(right.updatedAt ?? right.startedAt ?? 0) - Date.parse(left.updatedAt ?? left.startedAt ?? 0));
}

async function readSummaries(directory, depth = 0) {
  if (depth > 12) return [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const summaries = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) summaries.push(...await readSummaries(entryPath, depth + 1));
    else if (entry.isFile() && entry.name === 'summary.json') {
      try { summaries.push(JSON.parse(await readFile(entryPath, 'utf8'))); } catch { /* An invalid artifact cannot attest to validation. */ }
    }
  }
  return summaries;
}

async function verifyValidationArtifact(root, options, run, headSha) {
  if (!Number.isSafeInteger(run.databaseId)) throw new NotReady('The latest validation run has no usable GitHub run id.');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'portfolio-merge-readiness-'));
  try {
    github(root, [
      'run', 'download', String(run.databaseId), '--repo', options.repo,
      '--name', attestationArtifact, '--dir', directory,
    ]);
    const summaries = await readSummaries(directory);
    const summary = summaries.find(item => item.pullRequestNumber === options.pr);
    if (!summary) throw new NotReady(`Validation run ${run.databaseId} has no browser evidence for pull request #${options.pr}.`);
    if (summary.pullRequestHeadSha !== headSha || summary.commit !== headSha) {
      throw new NotReady(`Validation run ${run.databaseId} is for a different head; expected ${headSha}, found ${summary.pullRequestHeadSha ?? summary.commit ?? 'unknown'}.`);
    }
    const completeSuite = selectSuite([]);
    const expectedChecks = completeSuite.checks.map(check => check.name);
    if (summary.suite !== completeSuite.label || JSON.stringify(summary.selectedChecks) !== JSON.stringify(expectedChecks)) {
      throw new NotReady(`Validation run ${run.databaseId} did not record the complete portfolio suite.`);
    }
    if (summary.preview !== 'local') {
      throw new NotReady(`Validation run ${run.databaseId} used an external preview instead of the PR checkout.`);
    }
    if (summary.status !== 'passed' || summary.trackedChanges !== false || !/^[a-f0-9]{64}$/.test(summary.inputFingerprint ?? '')) {
      throw new NotReady(`Validation run ${run.databaseId} has no completed passing result and stable input fingerprint for ${headSha}.`);
    }
    return summary.inputFingerprint;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function compareTargetToHead(root, targetRef, baseBranch, targetSha, headSha) {
  const result = execute('git', ['merge-base', '--is-ancestor', targetRef, headSha], { cwd: root });
  if (result.status === 0) return;
  if (result.status !== 1) {
    throw new NotReady(`Git could not compare the freshly fetched ${baseBranch} tip ${targetSha} with PR head ${headSha}: ${result.stderr.trim() || `exit ${result.status}`}.`);
  }
  throw new NotReady(`Target branch ${baseBranch} has advanced to ${targetSha}, which is not an ancestor of PR head ${headSha}. Integrate the fetched target with the repository's preservation workflow and rerun validation.`);
}

async function runReadiness(options) {
  const root = path.resolve(git(process.cwd(), ['rev-parse', '--show-toplevel']));
  const initialHead = git(root, ['rev-parse', 'HEAD']).toLowerCase();
  const initialBranch = git(root, ['symbolic-ref', '--quiet', '--short', 'HEAD']);
  const initialStatus = git(root, ['status', '--porcelain', '--untracked-files=all']);
  if (initialStatus) throw new NotReady('The checkout has working-tree changes. Commit or preserve them, then check the published revision.');

  const remoteUrl = git(root, ['config', '--get', `remote.${options.remote}.url`]);
  if (repositoryFromRemoteUrl(remoteUrl) !== normalizeRepository(options.repo)) {
    throw new NotReady(`Remote ${options.remote} does not point to ${options.repo}.`);
  }

  const initial = readPullRequest(root, options);
  if (initialBranch !== initial.headBranch) {
    throw new NotReady(`Current branch ${initialBranch} does not match pull-request head branch ${initial.headBranch}.`);
  }
  if (initialHead !== initial.headSha) {
    throw new NotReady(`Local HEAD ${initialHead} does not match published pull-request head ${initial.headSha}. Push or synchronize the intended branch, then retry.`);
  }

  const targetRef = `refs/remotes/${options.remote}/${initial.baseBranch}`;
  const refCheck = execute('git', ['check-ref-format', targetRef], { cwd: root });
  if (refCheck.status !== 0) throw new NotReady(`Target branch name from the pull request is not a valid Git ref: ${initial.baseBranch}.`);

  const fetchRefspec = `+refs/heads/${initial.baseBranch}:${targetRef}`;
  git(root, ['fetch', '--no-write-fetch-head', '--no-tags', options.remote, fetchRefspec], 120000);
  const fetchedTarget = git(root, ['rev-parse', targetRef]).toLowerCase();
  compareTargetToHead(root, targetRef, initial.baseBranch, fetchedTarget, initial.headSha);

  checkGitHubChecks(root, options);
  const runs = readValidationRuns(root, options, initial.headBranch);
  if (!runs.length) throw new NotReady(`No ${workflowName} run was found for branch ${initial.headBranch}.`);
  const latestRun = runs[0];
  if (latestRun.status !== 'completed') {
    const status = String(latestRun.status ?? 'not complete').toLowerCase();
    if (['queued', 'in_progress', 'requested', 'waiting', 'pending'].includes(status)) {
      throw new NotReady(`Required validation is still running (${status}) on workflow run ${latestRun.databaseId}.`);
    }
    throw new NotReady(`Required validation is ${status} on workflow run ${latestRun.databaseId}.`);
  }
  if (latestRun.conclusion !== 'success') {
    const conclusion = latestRun.conclusion ?? 'unavailable';
    if (conclusion === 'cancelled' || conclusion === 'canceled') {
      throw new NotReady(`Required validation was cancelled on workflow run ${latestRun.databaseId}.`);
    }
    throw new NotReady(`Required validation concluded ${conclusion} on workflow run ${latestRun.databaseId}.`);
  }
  const inputFingerprint = await verifyValidationArtifact(root, options, latestRun, initial.headSha);

  const finalPullRequest = readPullRequest(root, options);
  if (finalPullRequest.headSha !== initial.headSha || finalPullRequest.baseBranch !== initial.baseBranch) {
    throw new NotReady('The pull request head or target changed during this readiness check. Fetch, inspect, validate the current head, and retry.');
  }
  checkGitHubChecks(root, options);

  git(root, ['fetch', '--no-write-fetch-head', '--no-tags', options.remote, fetchRefspec], 120000);
  const finalTarget = git(root, ['rev-parse', targetRef]).toLowerCase();
  compareTargetToHead(root, targetRef, initial.baseBranch, finalTarget, initial.headSha);

  const finalHead = git(root, ['rev-parse', 'HEAD']).toLowerCase();
  const finalBranch = git(root, ['symbolic-ref', '--quiet', '--short', 'HEAD']);
  const finalStatus = git(root, ['status', '--porcelain', '--untracked-files=all']);
  if (finalHead !== initialHead || finalBranch !== initialBranch || finalStatus !== initialStatus) {
    throw new NotReady('The checkout changed during the readiness check. Inspect the current state and retry.');
  }

  return {
    repository: options.repo,
    remote: options.remote,
    pullRequest: options.pr,
    targetBranch: initial.baseBranch,
    targetSha: finalTarget,
    headSha: initial.headSha,
    validationRun: latestRun.databaseId,
    inputFingerprint,
  };
}

try {
  const result = await runReadiness(parseArguments(process.argv.slice(2)));
  console.log(`READY: ${result.repository} PR #${result.pullRequest}`);
  console.log(`Target: ${result.remote}/${result.targetBranch} at ${result.targetSha}`);
  console.log(`PR head: ${result.headSha}`);
  console.log(`Validation: run ${result.validationRun} passed on this PR and exact head; input fingerprint ${result.inputFingerprint}`);
  console.log('No merge or integration was performed.');
} catch (error) {
  console.error(`NOT READY: ${error.message}`);
  process.exitCode = 1;
}
