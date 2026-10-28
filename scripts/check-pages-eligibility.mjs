import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { selectSuite } from './browser/check-suites.mjs';
import { inputFingerprint } from './browser/stable-inputs.mjs';
import { validateCompleteBrowserSummary } from './complete-browser-summary.mjs';

export async function checkPagesEligibility(root, expectedCommit) {
  assert.match(expectedCommit ?? '', /^[a-f0-9]{40}$/i, 'An exact publication commit is required');
  const git = args => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 });
    assert.equal(result.status, 0, `Git ${args[0]} must succeed: ${result.stderr}`);
    return result.stdout.trim();
  };
  assert.equal(git(['rev-parse', 'HEAD']), expectedCommit, 'Checkout must match the publication commit');
  assert.equal(git(['status', '--porcelain', '--untracked-files=no']), '', 'Publication checkout must be clean');
  const directory = path.join(root, '.scratch/browser-runs');
  const candidates = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const summaryFile = path.join(directory, entry.name, 'summary.json');
    // A checkpoint without a terminal summary is an incomplete run, never a pass.
    let summary;
    try { summary = JSON.parse(await readFile(summaryFile, 'utf8')); }
    catch (error) { throw new Error(`Unavailable or malformed browser evidence: ${summaryFile}`, { cause: error }); }
    if (summary.suite === selectSuite([]).label) candidates.push(summary);
  }
  assert.ok(candidates.length, 'Complete browser evidence is required');
  for (const candidate of candidates) assert.ok(Number.isFinite(Date.parse(candidate.startedAt)), 'Evidence start time is required');
  candidates.sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt));
  assert.ok(candidates.length === 1 || Date.parse(candidates[0].startedAt) > Date.parse(candidates[1].startedAt), 'Latest complete evidence must be unambiguous');
  const summary = candidates[0];
  assert.equal(summary.commit, expectedCommit, 'Evidence must identify the publication commit');
  validateCompleteBrowserSummary(summary);
  assert.equal(await inputFingerprint(root), summary.inputFingerprint, 'Source and dist must still match the validated build');
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const summary = await checkPagesEligibility(process.cwd(), process.env.GITHUB_SHA);
    console.log(`PASS: Pages eligible for ${summary.commit}; validated source/build ${summary.inputFingerprint}`);
  } catch (error) {
    console.error(`FAIL: Pages artifact is ineligible: ${error.message}`);
    process.exitCode = 1;
  }
}
