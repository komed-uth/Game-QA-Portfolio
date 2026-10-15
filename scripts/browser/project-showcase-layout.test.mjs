import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { chromium } from 'playwright';
import { startPreview } from './preview-server.mjs';
import { installVideoFixture } from './fixtures/youtube-provider.mjs';
import { waitForPhoto } from './gallery-photo-ready.mjs';
import { checkGalleryActionTargets } from './project-showcase-layout.mjs';

let browser;
let preview;
before(async () => {
  preview = await startPreview();
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  try { await browser?.close(); } finally { preview?.kill(); }
});

async function galleryPage(t) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  t.after(() => context.close());
  await installVideoFixture(context);
  const page = await context.newPage();
  await page.goto(preview.url, { waitUntil: 'domcontentloaded' });
  const gallery = page.getByRole('region', { name: 'Father, Son & Holy Guns media', exact: true });
  await gallery.locator('.gallery-thumbnail').nth(1).click();
  await waitForPhoto(gallery);
  await page.mouse.move(0, 0);
  page.setDefaultTimeout(1000);
  return { page, gallery };
}

test('gallery target checks tolerate photo/video control removal during measurement', async t => {
  const { page, gallery } = await galleryPage(t);
  await page.evaluate(() => {
    let photo = false;
    window.layoutSwitches = 0;
    window.layoutStress = setInterval(() => {
      document.querySelectorAll('.video-project .gallery-thumbnail')[photo ? 1 : 0].click();
      photo = !photo;
      window.layoutSwitches += 1;
    }, 8);
  });
  try {
    for (let attempt = 0; attempt < 500; attempt++) {
      await checkGalleryActionTargets(gallery, 'Father, Son & Holy Guns');
    }
    assert(await page.evaluate(() => window.layoutSwitches >= 4), 'Media actually changed during measurement');
  } finally {
    await page.evaluate(() => clearInterval(window.layoutStress));
  }
});

test('gallery target checks still reject zero-sized and undersized visible actions', async t => {
  const { page, gallery } = await galleryPage(t);
  for (const size of [0, 20]) {
    await page.addStyleTag({ content: '.video-project .gallery-slideshow-control { width: ' + size + 'px !important; min-width: 0 !important; height: ' + size + 'px !important; min-height: 0 !important; padding: 0 !important; border: 0 !important; }' });
    await assert.rejects(checkGalleryActionTargets(gallery, 'Father, Son & Holy Guns'), /usable media action targets/);
  }
});
