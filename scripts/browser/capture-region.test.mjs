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

async function samplePng(page, png, points) {
  return page.evaluate(async ({ base64, points }) => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + base64;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      pixels: points.map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data)),
    };
  }, { base64: png.toString('base64'), points });
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

test('regional captures retain responsive layout and identifiable content at every edge', async t => {
  const { page, directory } = await fixture(t);
  await page.setContent(
    '<style>' +
      'html { overflow: scroll; scrollbar-gutter: stable; }' +
      'body { width: 1200px; min-height: 2400px; margin: 0; }' +
      '#heading { position: absolute; left: 137px; top: 1400px; width: 200px; height: 40px; background: #ff0000; }' +
      '#preview { position: absolute; left: 150px; top: 1450px; width: 300px; height: 180px; display: grid; grid-template-columns: 1fr 1fr; }' +
      '#preview .first { background: #00ff00; }' +
      '#preview .second { background: #0000ff; }' +
      '@media (max-width: 600px) {' +
        '#heading { left: 23px; top: 1000px; width: 130px; height: 40px; }' +
        '#preview { left: 38px; top: 1050px; width: 220px; height: 160px; grid-template-columns: 1fr; }' +
      '}' +
    '</style>' +
    '<div id="heading"></div>' +
    '<div id="preview"><div class="first"></div><div class="second"></div></div>',
  );
  await page.evaluate(() => document.fonts.ready);

  for (const scenario of [
    {
      name: 'wide',
      viewport: { width: 900, height: 300 },
      expectedClip: { x: 137, y: 1400, width: 313, height: 230 },
      columns: 2,
      firstContentPixel: [15, 52],
    },
    {
      name: 'narrow',
      viewport: { width: 390, height: 300 },
      expectedClip: { x: 23, y: 1000, width: 235, height: 210 },
      columns: 1,
      firstContentPixel: [17, 52],
    },
  ]) {
    await page.setViewportSize(scenario.viewport);
    await page.evaluate(() => window.scrollTo(24, 120));
    const before = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollX,
      scrollY,
    }));
    assert.equal(before.scrollX, 24, 'Fixture exercises a scrolled document coordinate');
    assert.equal(before.scrollY, 120, 'Fixture keeps the capture region below the viewport');
    const columns = await page.locator('#preview').evaluate(element =>
      getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length);
    assert.equal(columns, scenario.columns, scenario.name + ' layout uses its expected responsive flow');

    const output = path.join(directory, scenario.name + '.png');
    const clip = await captureRegion(page, { selectors: ['#heading', '#preview'], path: output });
    assert.deepEqual(clip, scenario.expectedClip, scenario.name + ' capture uses document coordinates');
    const png = await readFile(output);
    const image = await samplePng(page, png, [
      [0, 0],
      scenario.firstContentPixel,
      [clip.width - 1, clip.height - 1],
    ]);
    assert.deepEqual([image.width, image.height], [clip.width, clip.height]);
    assert.deepEqual(image.pixels, [
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255],
    ], scenario.name + ' image contains the top-left, flowing content, and bottom-right edges');
    assert.deepEqual(await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollX,
      scrollY,
    })), before, scenario.name + ' capture preserves viewport, scrollbar layout, and document position');
    assert.equal(page.isClosed(), false, 'Caller retains control of page cleanup');
  }
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
