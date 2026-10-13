#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function fail(message) {
  console.error('FAIL: ' + message);
  process.exit(1);
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (name === '--help' || name === '-h') {
      console.log('Usage: node scripts/check-diff-whitespace.mjs --base <ref> [--head <ref>]');
      console.log('Without --head, checks tracked and staged work against the base revision.');
      console.log('PR_BASE_SHA and PR_HEAD_SHA can provide an immutable pull-request comparison.');
      process.exit(0);
    }
    if (name !== '--base' && name !== '--head') fail('Unknown argument: ' + name);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) fail('Missing value for ' + name);
    if (options[name]) fail('Duplicate argument: ' + name);
    options[name] = value;
    index += 1;
  }
  return { base: options['--base'], head: options['--head'] };
}

function runGit(args) {
  return spawnSync('git', args, {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30000,
  });
}

function resolveCommit(reference, label) {
  const result = runGit(['rev-parse', '--verify', '--quiet', '--end-of-options', reference + '^{commit}']);
  if (result.error) fail('Unable to run Git while resolving the ' + label + ' revision: ' + result.error.message);
  if (result.status !== 0) {
    fail('The ' + label + ' revision "' + reference +
      '" is not available. Fetch the comparison history before checking; do not skip this guardrail.');
  }
  return result.stdout.trim();
}

const options = parseArguments(process.argv.slice(2));
const environmentBase = process.env.PR_BASE_SHA;
const environmentHead = process.env.PR_HEAD_SHA;
if (Boolean(environmentBase) !== Boolean(environmentHead)) {
  fail('PR_BASE_SHA and PR_HEAD_SHA must both be set for a pull-request comparison.');
}

const baseReference = options.base ?? environmentBase;
const headReference = options.head ?? environmentHead;
if (!baseReference) {
  fail('Supply --base <ref>, or provide both PR_BASE_SHA and PR_HEAD_SHA. Fetch missing comparison history; do not skip this guardrail.');
}

const base = resolveCommit(baseReference, 'base');
const head = headReference ? resolveCommit(headReference, 'head') : undefined;
if (head) {
  const mergeBase = runGit(['merge-base', base, head]);
  if (mergeBase.error) fail('Unable to run Git while checking the merge base: ' + mergeBase.error.message);
  if (mergeBase.status !== 0) {
    fail('No merge base is available for the supplied revisions. Fetch enough history to compare them; do not skip this guardrail.');
  }
}

const range = head ? base + '...' + head : base;
const diff = runGit(['diff', '--check', '--no-ext-diff', range]);
if (diff.error) fail('Unable to run Git diff --check: ' + diff.error.message);
if (diff.status !== 0) {
  console.error('FAIL: whitespace errors in ' + (head ? 'pull-request diff ' : 'working-tree diff ') + range);
  const diagnostics = [diff.stdout, diff.stderr].filter(Boolean).join('').trimEnd();
  console.error(diagnostics || 'Git could not inspect the requested diff. Fetch enough comparison history and retry.');
  process.exitCode = 1;
} else {
  console.log('PASS: no whitespace errors in ' + (head ? 'pull-request diff ' : 'working-tree diff ') + range);
}
