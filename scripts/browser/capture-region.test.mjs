import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { captureRegion } from './capture-region.mjs';

let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'portfolio-capture-'));
  const page = await browser.newPage({ viewport: { width: 500, height: 300 } });
  t.after(async () => { await page.close(); await rm(directory, { recursive: true, force: true }); });
  return { page, directory };
}

test('captures the complete union below the viewport without moving or closing the page', async t => {
  const { page, directory } = await fixture(t);
  await page.setContent(`<style>body { margin: 0; height: 2400px; }
    #heading { position: absolute; left: 20px; top: 1400px; width: 200px; height: 40px; background: red; }
    #preview { position: absolute; left: 30px; top: 1450px; width: 300px; height: 180px; background: green; }</style>
    <div id="heading">Report heading</div><div id="preview">Report preview</div>`);
  const output = path.join(directory, 'nested', 'capture.png');
  const clip = await captureRegion(page, { selectors: ['#heading', '#preview'], path: output });
  assert.deepEqual(clip, { x: 20, y: 1400, width: 310, height: 230 });
  const png = await readFile(output);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 310);
  assert.equal(png.readUInt32BE(20), 230);
  assert.equal(await page.evaluate(() => scrollY), 0);
  assert.equal(page.isClosed(), false, 'Caller retains control of page cleanup');
});

test('missing or empty regions fail clearly without writing an incomplete capture', async t => {
  const { page, directory } = await fixture(t);
  await page.setContent('<div id="hidden" style="display:none">Hidden report</div>');
  const output = path.join(directory, 'capture.png');
  await assert.rejects(captureRegion(page, { selectors: ['#missing'], path: output }), /Capture region not found: #missing/);
  await assert.rejects(captureRegion(page, { selectors: ['#hidden'], path: output }), /Capture region has no visible area: #hidden/);
  await assert.rejects(captureRegion(page, { selectors: [], path: output }), /at least one selector/);
  assert.deepEqual(await readdir(directory), []);
});
