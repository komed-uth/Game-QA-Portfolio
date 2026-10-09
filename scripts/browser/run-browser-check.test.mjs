import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { runBrowserCheck } from './run-browser-check.mjs';
import { withStableInputs } from './stable-inputs.mjs';

let browser; let server; let url;
before(async () => {
  browser = await chromium.launch({ headless: true });
  server = createServer((request, response) => {
    response.setHeader('Content-Type', 'text/html');
    response.end('<button id="opener">Inspect photo</button><button class="gallery-thumbnail" aria-pressed="true" aria-label="Selected photo">Photo</button>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });
async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'portfolio-trace-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
test('successful checks report timing, discard traces and close their context', async t => {
  const directory = await fixture(t); const logs = [];
  await runBrowserCheck(browser, url, { name: 'success', check: page => page.locator('#opener').click() },
    { artifactDirectory: directory, log: line => logs.push(line) });
  assert.deepEqual(await readdir(directory), []);
  assert.equal(browser.contexts().length, 0);
  assert.equal(logs[0], 'START: success'); assert.match(logs[1], /^PASS: success \(\d+\.\d+s\)$/);
});
test('failed checks save a real trace and focused DOM diagnostics before closing', async t => {
  const directory = await fixture(t); const logs = []; const original = new Error('fixture assertion');
  await assert.rejects(runBrowserCheck(browser, url, { name: 'failure', check: async page => {
    await page.locator('#opener').focus(); throw original;
  } }, { artifactDirectory: directory, log: line => logs.push(line) }), error => error === original);
  const [folder] = await readdir(directory);
  const trace = await readFile(path.join(directory, folder, 'trace.zip'));
  assert.equal(trace.subarray(0, 2).toString(), 'PK');
  assert(trace.includes(Buffer.from('.trace')), 'Archive contains Playwright trace events');
  const diagnostics = JSON.parse(await readFile(path.join(directory, folder, 'failure.json'), 'utf8'));
  assert.equal(diagnostics.message, original.message); assert(diagnostics.page.activeElement.includes('id="opener"'));
  assert.deepEqual(diagnostics.page.selectedMedia, ['Selected photo']);
  assert.equal(browser.contexts().length, 0); assert(logs.some(line => line.startsWith('FAIL: failure (')));
  assert(logs.some(line => line.startsWith('ARTIFACTS: ')));
});
test('unwritable artifact destinations preserve the original check failure', async t => {
  const directory = await fixture(t); const blocker = path.join(directory, 'file'); await writeFile(blocker, 'blocked');
  const original = new Error('original failure'); const logs = [];
  await assert.rejects(runBrowserCheck(browser, url, { name: 'blocked', check: async () => { throw original; } },
    { artifactDirectory: blocker, log: line => logs.push(line) }), error => error === original);
  assert(logs.some(line => line.startsWith('Could not save failure artifacts:')));
  assert.equal(browser.contexts().length, 0);
});

test('a successful real browser check becomes obsolete when its source changes', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'src'));
  const source = path.join(root, 'src', 'gallery.ts'); await writeFile(source, 'before');
  await assert.rejects(withStableInputs(() => runBrowserCheck(browser, url, { name: 'edited', check: async page => {
    await page.locator('#opener').click(); await writeFile(source, 'after');
  } }, { artifactDirectory: path.join(root, '.scratch', 'browser-checks'), log: () => {} }), root), /OBSOLETE/);
  assert.equal(browser.contexts().length, 0);
});
