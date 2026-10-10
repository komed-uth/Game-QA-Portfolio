import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { inflateRawSync } from 'node:zlib';
import { runBrowserCheck, withBrowserContext } from './run-browser-check.mjs';
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

// Read archive entries through ZIP's central directory (Playwright uses deflate).
function traceText(zip) {
  let end = zip.length - 22;
  while (zip.readUInt32LE(end) !== 0x06054b50) end--;
  let offset = zip.readUInt32LE(end + 16);
  const texts = [];
  for (let index = 0; index < zip.readUInt16LE(end + 10); index++) {
    const length = zip.readUInt16LE(offset + 28);
    const name = zip.subarray(offset + 46, offset + 46 + length).toString();
    const local = zip.readUInt32LE(offset + 42);
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const data = zip.subarray(start, start + zip.readUInt32LE(offset + 20));
    if (name.endsWith('.trace')) texts.push((zip.readUInt16LE(offset + 10) === 8 ? inflateRawSync(data) : data).toString());
    offset += 46 + length + zip.readUInt16LE(offset + 30) + zip.readUInt16LE(offset + 32);
  }
  return texts.join('\n');
}

test('child context failures retain child actions and DOM before cleanup', async t => {
  const directory = await fixture(t);
  const original = new Error('child assertion');
  await assert.rejects(runBrowserCheck(browser, url, { name: 'child', check: async () => {
    await withBrowserContext(browser, { isMobile: true, hasTouch: true, viewport: { width: 390, height: 700 } }, async context => {
      const page = await context.newPage();
      await page.goto(`${url}/child`);
      await page.setContent('<button id="child-only">Child evidence</button>');
      await page.locator('#child-only').click();
      throw original;
    });
  } }, { artifactDirectory: directory, log: () => {} }), error => error === original);
  const [folder] = await readdir(directory);
  const diagnostics = JSON.parse(await readFile(path.join(directory, folder, 'failure.json'), 'utf8'));
  assert.equal(diagnostics.url, `${url}/child`);
  assert.match(diagnostics.page.activeElement, /child-only/);
  const screenshot = await readFile(path.join(directory, folder, diagnostics.screenshot));
  assert.equal(screenshot.readUInt32BE(16), 390);
  assert.equal(screenshot.readUInt32BE(20), 700);
  const events = traceText(await readFile(path.join(directory, folder, 'trace.zip')));
  assert.match(events, /"method":"click"/);
  assert.match(events, /#child-only/);
  assert.match(events, /Child evidence/);
  assert.equal(browser.contexts().length, 0);
});

test('handled child failures discard their artifacts when the check succeeds', async t => {
  const directory = await fixture(t);
  await runBrowserCheck(browser, url, { name: 'handled', check: async () => {
    await assert.rejects(withBrowserContext(browser, {}, async () => { throw new Error('expected'); }));
  } }, { artifactDirectory: directory, log: () => {} });
  assert.deepEqual(await readdir(directory), []);
  assert.equal(browser.contexts().length, 0);
});

for (const fails of [false, true]) {
  test(`edited ${fails ? 'failing' : 'successful'} checks report no ordinary result`, async t => {
    const root = await fixture(t); const logs = []; const original = new Error('obsolete assertion');
    await mkdir(path.join(root, 'src'));
    const source = path.join(root, 'src', 'gallery.ts'); await writeFile(source, 'before');
    await assert.rejects(withStableInputs(validateInputs => runBrowserCheck(browser, url, { name: 'edited', check: async page => {
      await page.locator('#opener').click(); await writeFile(source, 'after');
      if (fails) throw original;
    } }, { validateInputs, artifactDirectory: path.join(root, '.scratch', 'browser-checks'), log: line => logs.push(line) }), root), error => {
      assert.match(error.message, /OBSOLETE/);
      assert.equal(error.cause, fails ? original : undefined);
      return true;
    });
    assert.deepEqual(logs, ['START: edited']);
    assert.equal(browser.contexts().length, 0);
  });
}

test('failure artifacts include observable inspection state and a viewport screenshot', async t => {
  const directory = await fixture(t);
  const original = new Error('ready photo did not advance');
  await assert.rejects(runBrowserCheck(browser, url, { name: 'slideshow-state', check: async page => {
    await page.setViewportSize({ width: 400, height: 300 });
    const image = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="green"/></svg>';
    await page.setContent(`<div class="game-gallery" aria-label="Ready gallery" style="width:300px;height:150px">
      <div class="gallery-viewer"><button id="inspect" class="gallery-photo ready"><img src='${image}'></button></div>
      <span aria-live="polite">2 / 2 · Photo</span>
      <button class="gallery-thumbnail" aria-pressed="false">Video</button>
      <button class="gallery-thumbnail" aria-pressed="true" aria-label="Show photo"><img src='${image}'></button>
      </div><div class="game-gallery" aria-label="Loading gallery" style="margin-top:500px;width:300px;height:150px">
      <div role="status">Loading photo…</div></div>`);
    await page.locator('#inspect img').evaluate(image => image.decode());
    await page.locator('#inspect').focus();
    await page.mouse.move(399, 299);
    await page.locator('#inspect').hover();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    });
    throw original;
  } }, { artifactDirectory: directory, log: () => {} }), error => error === original);
  const [folder] = await readdir(directory);
  const diagnostics = JSON.parse(await readFile(path.join(directory, folder, 'failure.json'), 'utf8'));
  assert.deepEqual(diagnostics.scenario, { check: 'slideshow-state', assertion: original.message });
  assert.deepEqual(diagnostics.page.viewport, { width: 400, height: 300, scrollX: 0, scrollY: 0 });
  assert.equal(diagnostics.page.visibility.hidden, true);
  assert.equal(diagnostics.page.visibility.state, 'hidden');
  const [ready, loading] = diagnostics.page.galleries;
  assert.equal(ready.name, 'Ready gallery');
  assert.equal(ready.selectionAnnouncement, '2 / 2 · Photo');
  assert.equal(ready.selectedMedia.index, 1);
  assert.equal(ready.selectedMedia.label, 'Show photo');
  assert.match(ready.selectedMedia.source, /^data:image\/svg\+xml/);
  assert.equal(ready.photo.phase, 'ready');
  assert.equal(ready.photo.ready, true);
  assert.equal(ready.photo.complete, true);
  assert.equal(ready.photo.naturalWidth, 40);
  assert.equal(typeof ready.hovered, 'boolean');
  assert.equal(ready.focusWithin, true);
  assert.equal(ready.inViewport, true);
  assert.equal(ready.bounds.width, 300);
  assert.equal(loading.photo.phase, 'loading');
  assert.equal(loading.photo.ready, false);
  assert.equal(loading.inViewport, false);
  assert.equal(diagnostics.screenshot, 'screenshot.png');
  const screenshot = await readFile(path.join(directory, folder, diagnostics.screenshot));
  assert.equal(screenshot.subarray(1, 4).toString(), 'PNG');
  assert.equal(screenshot.readUInt32BE(16), 400);
  assert.equal(screenshot.readUInt32BE(20), 300);
  assert.equal(browser.contexts().length, 0);
});

test('screenshot failure preserves JSON, trace and original assertion', async t => {
  const directory = await fixture(t);
  const original = new Error('photo assertion');
  await assert.rejects(runBrowserCheck(browser, url, { name: 'screenshot-failure', check: async page => {
    page.screenshot = async () => { throw new Error('Screenshot unavailable'); };
    throw original;
  } }, { artifactDirectory: directory, log: () => {} }), error => error === original);
  const [folder] = await readdir(directory);
  const diagnostics = JSON.parse(await readFile(path.join(directory, folder, 'failure.json'), 'utf8'));
  assert.equal(diagnostics.message, original.message);
  assert.equal(diagnostics.screenshotError, 'Screenshot unavailable');
  assert.equal(diagnostics.screenshot, undefined);
  assert.equal((await readFile(path.join(directory, folder, 'trace.zip'))).subarray(0, 2).toString(), 'PK');
  assert.equal(browser.contexts().length, 0);
});

test('closing the failed page still preserves failure JSON and trace', async t => {
  const directory = await fixture(t);
  const original = new Error('closed page assertion');
  await assert.rejects(runBrowserCheck(browser, url, { name: 'closed-page', check: async page => {
    await page.close();
    throw original;
  } }, { artifactDirectory: directory, log: () => {} }), error => error === original);
  const [folder] = await readdir(directory);
  const diagnostics = JSON.parse(await readFile(path.join(directory, folder, 'failure.json'), 'utf8'));
  assert.equal(diagnostics.message, original.message);
  assert.equal(typeof diagnostics.pageError, 'string');
  assert.equal(diagnostics.screenshotError, 'No open page available for screenshot');
  assert.equal((await readFile(path.join(directory, folder, 'trace.zip'))).subarray(0, 2).toString(), 'PK');
  assert.equal(browser.contexts().length, 0);
});
