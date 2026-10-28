import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, cpSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('documented PowerShell readiness recipe preserves exact argv and child status across paths with spaces', { skip: process.platform !== 'win32' }, t => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'readiness recipe with spaces '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(path.join(directory, 'scripts'));
  const entrypoint = path.join(directory, 'scripts', 'check-merge-readiness.mjs');
  copyFileSync('scripts/check-merge-readiness.mjs', entrypoint);
  const echo = path.join(directory, 'argument echo.cjs');
  const received = path.join(directory, 'received.json');
  writeFileSync(echo, "require('node:fs').writeFileSync(process.env.RECIPE_ARGV, JSON.stringify(process.argv.slice(1))); process.exit(Number(process.env.RECIPE_STATUS));\n");
  const document = readFileSync('docs/development/publishing.md', 'utf8').replaceAll('\r\n', '\n');
  const recipe = document.match(/<!-- readiness-powershell-start -->\s*```powershell\n([\s\S]*?)\n```/)[1];
  const shellScript = path.join(directory, 'run recipe.ps1');
  const literal = value => `'${value.replaceAll("'", "''")}'`;
  const prefix = `$env:PATH = ${literal(path.dirname(process.execPath))} + ';' + $env:PATH\n$repository = 'fixture-owner/independent-repository'\n$remote = 'review-remote'\n$pullRequest = 947\n`;
  writeFileSync(shellScript, prefix + recipe);
  for (const status of [0, 23]) {
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', readFileSync(shellScript, 'utf8')], {
      cwd: directory, encoding: 'utf8', windowsHide: true,
      env: { ...process.env, NODE_OPTIONS: `--require ${JSON.stringify(echo)}`, RECIPE_ARGV: received, RECIPE_STATUS: String(status) },
    });
    assert.equal(result.status, status, result.stderr);
    let actual;
    try { actual = JSON.parse(readFileSync(received, 'utf8')); } catch (error) { throw new Error(`${result.stdout}\n${result.stderr}\n${error.message}`); }
    assert.deepEqual(actual, [entrypoint, '--repo', 'fixture-owner/independent-repository', '--remote', 'review-remote', '--pr', '947']);
  }
});

test('actual readiness entrypoint refuses omitted or invalid options through the documented PowerShell recipe', { skip: process.platform !== 'win32' }, t => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'invalid readiness with spaces '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  cpSync('scripts', path.join(directory, 'scripts'), { recursive: true });
  const recipe = readFileSync('docs/development/publishing.md', 'utf8').replaceAll('\r\n', '\n').match(/<!-- readiness-powershell-start -->\s*```powershell\n([\s\S]*?)\n```/)[1];
  const script = path.join(directory, 'invalid recipe.ps1');
  const executableDirectory = path.dirname(process.execPath).replaceAll("'", "''");
  for (const assignments of ["$repository = 'fixture/repo'\n$remote = 'fixture-remote'\n$pullRequest = 0", "$repository = 'fixture/repo'\n$remote = 'fixture-remote'\n$pullRequest = ''"]) {
    writeFileSync(script, `$env:PATH = '${executableDirectory}' + ';' + $env:PATH\n${assignments}\n${recipe}`);
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', readFileSync(script, 'utf8')], { cwd: directory, encoding: 'utf8', env, windowsHide: true });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Usage:|positive pull-request number/);
    assert.doesNotMatch(result.stdout, /READY/);
  }
});
