import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm, readdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('preflight reports missing tools without installation, authentication or history writes', () => {
  const isolatedEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== 'PATH'));
  isolatedEnvironment.PATH = '';
  const result = spawnSync(process.execPath, ['scripts/check-workstation.mjs'], {
    env: isolatedEnvironment, encoding: 'utf8', windowsHide: true,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  for (const label of ['npm executable', 'Git executable', 'Ripgrep executable', 'GitHub CLI authenticated account', 'Repository Git metadata location']) {
    assert(result.stderr.includes(`FAIL: ${label}`));
  }
  assert.match(result.stderr, /approved execution fallback/);
  assert.match(result.stdout, /Connector access: unverified/);
  assert.doesNotMatch(result.stdout, /ACCOUNT:|Git metadata write access|PASS: workstation preflight/);
});

test('preflight reports a verified CLI account without credentials and leaves metadata clean', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'preflight-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const init = spawnSync('git', ['init', directory], { encoding: 'utf8', windowsHide: true });
  assert.equal(init.status, 0, init.stderr);
  const cli = path.join(directory, 'account.mjs');
  await writeFile(cli, "if (JSON.stringify(process.argv.slice(2)) !== JSON.stringify(['api','user','--jq','.login'])) process.exit(9); console.log('test-account');");
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./check-workstation.mjs', import.meta.url))], {
    cwd: directory, encoding: 'utf8', windowsHide: true,
    env: { ...process.env, PORTFOLIO_GH_CLI: process.execPath, PORTFOLIO_GH_CLI_ARGS_JSON: JSON.stringify([cli]) },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ACCOUNT: test-account/);
  assert.match(result.stdout, /Connector access: unverified/);
  assert.match(result.stdout, /Dependency readiness: unverified/);
  assert.doesNotMatch(result.stdout + result.stderr, /token|password|secret/i);
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: directory, encoding: 'utf8', windowsHide: true });
  assert.equal(status.stdout.trim(), '?? account.mjs');
  assert(!(await readdir(path.join(directory, '.git'))).some(name => name.startsWith('workstation-preflight-')));
  const observations = path.join(directory, 'connector.json');
  await writeFile(observations, JSON.stringify({
    version: 1, repository: 'test/portfolio', account: { login: 'connector-account', observedAt: new Date().toISOString() },
    capabilities: ['pull-requests:read', 'checks:read', 'actions:read', 'artifacts:read'],
  }));
  const connector = spawnSync(process.execPath, [fileURLToPath(new URL('./check-workstation.mjs', import.meta.url)),
    '--repo', 'test/portfolio', '--observations', observations, '--expected-login', 'connector-account'], {
    cwd: directory, encoding: 'utf8', windowsHide: true,
    env: { ...process.env, PORTFOLIO_GH_CLI: 'unavailable-github-cli' },
  });
  assert.equal(connector.status, 0, connector.stderr);
  assert.match(connector.stderr, /FAIL: GitHub CLI authenticated account/);
  assert.match(connector.stdout, /Connector access: verified observations; account connector-account/);
  assert.doesNotMatch(connector.stdout, /PASS: GitHub CLI|ACCOUNT:/);
});

test('preflight distinguishes malformed Git configuration without repairing owner settings', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'preflight-config-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const config = path.join(directory, 'broken-gitconfig');
  const content = '[invalid configuration\n';
  await writeFile(config, content);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./check-workstation.mjs', import.meta.url))], {
    cwd: directory, encoding: 'utf8', windowsHide: true,
    env: { ...process.env, GIT_CONFIG_GLOBAL: config },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /CAUSE: malformed Git configuration/);
  assert.equal(await readFile(config, 'utf8'), content);
});

test('Windows preflight executes the npm launcher and refuses an unusable shim', { skip: process.platform !== 'win32' }, async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'npm launcher '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(path.join(directory, 'npm.cmd'), '@echo off\r\nexit /b 23\r\n');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== 'PATH'));
  env.PATH = directory;
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./check-workstation.mjs', import.meta.url))], {
    cwd: directory, env, encoding: 'utf8', windowsHide: true,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL: npm executable \(exit 23\)/);
  assert.doesNotMatch(result.stdout, /PASS: npm executable/);
});
