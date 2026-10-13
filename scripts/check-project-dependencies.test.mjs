import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const checker = fileURLToPath(new URL('./check-project-dependencies.mjs', import.meta.url));
const projectDependencyModule = fileURLToPath(new URL('./project-dependencies.mjs', import.meta.url));
const manifestPath = fileURLToPath(new URL('../package.json', import.meta.url));
const requiredFiles = [
  'vite/bin/vite.js',
  `.bin/vite${process.platform === 'win32' ? '.cmd' : ''}`,
  'typescript/bin/tsc',
  `.bin/tsc${process.platform === 'win32' ? '.cmd' : ''}`,
  'playwright/package.json',
];

async function createCheckout(root, { installDependencies = false } = {}) {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    devDependencies: { vite: '7.0.0', typescript: '5.9.2', playwright: '1.62.1' },
  }));
  await writeFile(path.join(root, 'package-lock.json'), '{}\n');
  if (installDependencies) {
    for (const file of requiredFiles) {
      const location = path.join(root, 'node_modules', file);
      await mkdir(path.dirname(location), { recursive: true });
      await writeFile(location, '{}\n');
    }
  }
}

function runChecker(cwd) {
  return spawnSync(process.execPath, [checker], { cwd, encoding: 'utf8', windowsHide: true });
}

function runNpmScript(cwd, name) {
  if (process.platform === 'win32') {
    return spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `npm run ${name}`], {
      cwd, encoding: 'utf8', windowsHide: true,
    });
  }
  return spawnSync('npm', ['run', name], { cwd, encoding: 'utf8', windowsHide: true });
}

test('project dependency readiness passes with the required local installation', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'project-deps-ready-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await createCheckout(root, { installDependencies: true });

  const result = runChecker(root);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PASS: build and preview dependencies resolve inside/);
});

test('missing local dependencies fail early with a locked-install instruction', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'project-deps-missing-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await createCheckout(root);

  const result = runChecker(root);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(result.stderr, /Run npm ci from/);
});

test('packages in a parent checkout cannot satisfy the intended checkout', async t => {
  const parent = await mkdtemp(path.join(tmpdir(), 'parent-with-deps-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const checkout = path.join(parent, 'worktree');
  await createCheckout(parent, { installDependencies: true });
  await createCheckout(checkout);

  const result = runChecker(checkout);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, new RegExp(checkout.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(result.stderr, /Run npm ci from/);
});

test('build and preview hooks stop before work even when a parent checkout supplies packages', async t => {
  const parent = await mkdtemp(path.join(tmpdir(), 'parent-install-lifecycle-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const checkout = path.join(parent, 'worktree');
  await createCheckout(parent, { installDependencies: true });
  await mkdir(path.join(checkout, 'scripts'), { recursive: true });
  await copyFile(checker, path.join(checkout, 'scripts', 'check-project-dependencies.mjs'));
  await copyFile(projectDependencyModule, path.join(checkout, 'scripts', 'project-dependencies.mjs'));

  const repositoryManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await writeFile(path.join(checkout, 'package.json'), JSON.stringify({
    scripts: {
      'check:project-dependencies': 'node scripts/check-project-dependencies.mjs',
      prebuild: repositoryManifest.scripts.prebuild,
      prepreview: repositoryManifest.scripts.prepreview,
      'sync:reports': "node -e \"require('node:fs').writeFileSync('sync-started', 'yes')\"",
      build: "node -e \"require('node:fs').writeFileSync('build-started', 'yes')\"",
      preview: "node -e \"require('node:fs').writeFileSync('preview-started', 'yes')\"",
    },
  }));

  for (const [script, marker] of [['build', 'build-started'], ['preview', 'preview-started']]) {
    const result = runNpmScript(checkout, script);
    assert.equal(result.error, undefined, result.error?.message);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(`${result.stdout}\n${result.stderr}`, /Run npm ci from/);
    await assert.rejects(access(path.join(checkout, marker)));
  }
  await assert.rejects(access(path.join(checkout, 'sync-started')));
});

test('focused browser npm scripts run the checkout dependency preflight first', async t => {
  const parent = await mkdtemp(path.join(tmpdir(), 'parent-focused-browser-install-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const checkout = path.join(parent, 'worktree');
  await createCheckout(parent, { installDependencies: true });
  await createCheckout(checkout);
  await mkdir(path.join(checkout, 'scripts'), { recursive: true });
  await copyFile(checker, path.join(checkout, 'scripts/check-project-dependencies.mjs'));
  await copyFile(projectDependencyModule, path.join(checkout, 'scripts/project-dependencies.mjs'));

  const repositoryManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const focusedChecks = ['reports', 'report-layout', 'gameplay', 'slideshow', 'placeholders', 'photos', 'evidence'];
  const scripts = { 'check:project-dependencies': 'node scripts/check-project-dependencies.mjs' };
  for (const check of focusedChecks) {
    scripts[`precheck:${check}`] = repositoryManifest.scripts[`precheck:${check}`];
    scripts[`check:${check}`] = `node -e "require('node:fs').writeFileSync('check-${check}-started', 'yes')"`;
  }
  await writeFile(path.join(checkout, 'package.json'), JSON.stringify({ scripts }));

  for (const check of focusedChecks) {
    const result = runNpmScript(checkout, `check:${check}`);
    assert.equal(result.error, undefined, result.error?.message);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(`${result.stdout}\n${result.stderr}`, /Run npm ci from/);
    await assert.rejects(access(path.join(checkout, `check-${check}-started`)));
  }
});

test('direct focused browser runs reject parent Playwright before external-preview checks', async t => {
  const parent = await mkdtemp(path.join(tmpdir(), 'parent-browser-install-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const checkout = path.join(parent, 'worktree');
  await createCheckout(parent, { installDependencies: true });
  await createCheckout(checkout);

  const repositoryRoot = path.dirname(manifestPath);
  const runnerFiles = [
    'scripts/check-browser.mjs',
    'scripts/project-dependencies.mjs',
    'scripts/browser/check-suites.mjs',
    'scripts/browser/recorded-run.mjs',
    'scripts/browser/run-suite.mjs',
    'scripts/browser/preview-server.mjs',
    'scripts/browser/stable-inputs.mjs',
    'scripts/browser/run-browser-check.mjs',
  ];
  for (const relative of runnerFiles) {
    const destination = path.join(checkout, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(repositoryRoot, relative), destination);
  }

  const importMarker = path.join(parent, 'parent-playwright-loaded');
  const playwrightDirectory = path.join(parent, 'node_modules', 'playwright');
  await writeFile(path.join(playwrightDirectory, 'package.json'), JSON.stringify({ type: 'module', main: 'index.mjs' }));
  await writeFile(path.join(playwrightDirectory, 'index.mjs'), [
    "import { writeFileSync } from 'node:fs';",
    "writeFileSync(process.env.PLAYWRIGHT_IMPORT_MARKER, 'loaded');",
    "export const chromium = { launch: async () => { throw new Error('parent Playwright was imported'); } };",
  ].join('\n'));

  const result = spawnSync(process.execPath, [path.join(checkout, 'scripts/check-browser.mjs'), '--photos-only'], {
    cwd: checkout,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, PORTFOLIO_URL: 'https://example.invalid', PLAYWRIGHT_IMPORT_MARKER: importMarker },
  });
  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 1, output);
  assert.ok(output.includes(checkout), output);
  assert.match(output, /Run npm ci from/);
  await assert.rejects(access(importMarker));
});
