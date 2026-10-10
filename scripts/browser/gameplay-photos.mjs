import assert from "node:assert/strict";

import { waitForPhoto as ready } from "./gallery-photo-ready.mjs";

export default async function checkPhotoChanges(page) {
  await page.setViewportSize({ width: 1366, height: 768 });
  const galleries = await page.locator('.game-gallery').all();
  for (const gallery of galleries) {
    const previews = gallery.locator('.gallery-thumbnail');
    const sources = await previews.locator('img').evaluateAll(elements => elements.map(e => e.getAttribute('src')));
    const viewer = gallery.locator('.gallery-viewer');
    const open = gallery.locator('.gallery-caption .evidence-open');
    await previews.nth(1).click();
    await ready(gallery, sources[1]);
    const before = await viewer.boundingBox();
    await viewer.evaluate(element => {
      window.photoAnimations = [];
      const recordAnimation = event => {
        if (!event.animationName.startsWith('gallery-photo-')) return;
        window.photoAnimations.push({ name: event.animationName, type: event.type, elapsed: event.elapsedTime,
          duration: getComputedStyle(event.target).animationDuration,
          transform: getComputedStyle(event.target).transform });
      };
      element.addEventListener('animationstart', recordAnimation);
      element.addEventListener('animationend', recordAnimation);
    });
    // Capture the first frame together: separate browser calls can outlast the 250ms fades.
    const transition = await previews.nth(2).evaluate(element => new Promise(resolve => {
      element.click();
      requestAnimationFrame(() => {
        const gallery = element.closest('.game-gallery');
        resolve({ selected: element.getAttribute('aria-pressed'), caption: gallery.querySelector('.gallery-caption').innerText,
          openingBlocked: gallery.querySelector('.gallery-caption .evidence-open').disabled });
      });
    }));
    assert.equal(transition.selected, 'true');
    assert(transition.caption.includes('3 / 4'));
    assert(transition.openingBlocked, 'Open is blocked during transition');
    await ready(gallery, sources[2]);
    const animations = await page.evaluate(() => window.photoAnimations);
    assert.deepEqual(animations.filter(a => a.type === 'animationstart').map(a => [a.name, a.duration, a.transform]), [
      ['gallery-photo-out', '0.1s', 'none'], ['gallery-photo-in', '0.15s', 'none'],
    ], 'Ordered photo fades use 100/150ms and no zoom');
    assert.deepEqual(animations.map(a => [a.name, a.type, a.elapsed]), [
      ['gallery-photo-out', 'animationstart', 0], ['gallery-photo-out', 'animationend', 0.1],
      ['gallery-photo-in', 'animationstart', 0], ['gallery-photo-in', 'animationend', 0.15],
    ], 'Outgoing fade completes before incoming fade; both finish their CSS durations');
    const after = await viewer.boundingBox();
    assert.equal(after.width, before.width); assert.equal(after.height, before.height);
    const count = animations.length;
    await previews.nth(2).click();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.photoAnimations.length), count, 'Active photo reselection has no animation');
    await previews.nth(1).evaluate(e => e.click());
    await previews.nth(3).evaluate(e => e.click());
    await ready(gallery, sources[3]);
    await previews.nth(2).evaluate(e => e.click());
    await previews.first().evaluate(e => e.click());
    assert.equal(await viewer.locator('iframe').count(), 1, 'Video replaces photo immediately');
    const player = await viewer.locator('iframe').elementHandle();
    await previews.first().click();
    await page.waitForTimeout(300);
    assert(await player.evaluate(e => e.isConnected), 'Video reselection preserves the player');
    assert.equal(await viewer.locator('img').count(), 0, 'Cancelled photo work cannot replace video');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await previews.nth(1).click(); await ready(gallery, sources[1]);
    await previews.nth(2).click(); await ready(gallery, sources[2]);
    assert.equal(await viewer.locator('button').evaluate(e => getComputedStyle(e).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await previews.first().click();
  }

  // Hold real image responses on the rendered page, including thumbnail requests.
  // Each gallery runs independently with its own slow, failed and retried photos.
  for (let galleryIndex = 0; galleryIndex < galleries.length; galleryIndex++) {
    const gallery = page.locator('.game-gallery').nth(galleryIndex);
    const sources = await gallery.locator('.gallery-thumbnail img').evaluateAll(elements => elements.map(e => e.getAttribute('src')));
    const slowUrl = new URL(sources[2], page.url()).href;
    const failedUrl = new URL(sources[3], page.url()).href;
    let release;
    let retrySucceeds = false;
    const held = new Promise(resolve => { release = resolve; });
    await page.route(slowUrl, async route => { const response = await route.fetch(); await held; await route.fulfill({ response }); });
    await page.route(failedUrl, route => retrySucceeds ? route.continue() : route.fulfill({ status: 503, body: 'Photo unavailable' }));
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      const previews = gallery.locator('.gallery-thumbnail');
      const viewer = gallery.locator('.gallery-viewer');
      const open = gallery.locator('.gallery-caption .evidence-open');
      await previews.nth(1).click(); await ready(gallery, sources[1]);
      const size = await viewer.boundingBox();
      await previews.nth(2).click();
      await gallery.getByRole('status').waitFor();
      assert(await open.isDisabled(), 'Slow load blocks caption opening');
      assert.equal(await viewer.locator('.evidence-image-button').count(), 0, 'Loading has no activatable main photo');
      assert.equal((await viewer.boundingBox()).height, size.height, 'Loading keeps viewer height');
      await viewer.evaluate(element => {
        window.photoAnimations = [];
        element.addEventListener('animationstart', event => {
          if (event.animationName.startsWith('gallery-photo-')) window.photoAnimations.push(event.animationName);
        });
      });
      await previews.nth(1).click(); await ready(gallery, sources[1]);
      assert.deepEqual(await page.evaluate(() => window.photoAnimations), ['gallery-photo-in'],
        'A new photo selected from loading still fades in');
      await previews.nth(2).click(); await gallery.getByRole('status').waitFor();
      await previews.first().click();
      assert.equal(await viewer.locator('iframe').count(), 1, 'Video immediately cancels a held photo');
      await previews.nth(1).click(); await ready(gallery, sources[1]);
      release();
      await page.waitForTimeout(350);
      await ready(gallery, sources[1]);
      assert.equal(await previews.nth(1).getAttribute('aria-pressed'), 'true', 'Stale response cannot change selection');
      await previews.nth(2).click(); await ready(gallery, sources[2]);
      await previews.nth(3).click();
      await gallery.getByRole('alert').waitFor();
      assert(await open.isDisabled());
      const original = gallery.getByRole('link', { name: 'Open original file' });
      assert.equal(await original.getAttribute('href'), sources[3]);
      assert.equal(await original.getAttribute('target'), '_blank');
      assert.equal((await viewer.boundingBox()).height, size.height, 'Failure keeps viewer height');
      const other = page.locator('.game-gallery').nth(1 - galleryIndex);
      assert.equal(await other.locator('iframe').count(), 1, 'Loading/failure stays within the chosen gallery');
      await previews.nth(1).click(); await ready(gallery, sources[1]);
      await previews.nth(3).click(); await gallery.getByRole('alert').waitFor();
      retrySucceeds = true;
      await gallery.getByRole('button', { name: 'Retry', exact: true }).click();
      await ready(gallery, sources[3]);
      await open.click();
      assert.equal(await page.locator('dialog img').getAttribute('src'), sources[3], 'Retried photo opens for inspection');
      await page.getByRole('button', { name: 'Next screenshot' }).click();
      await page.getByRole('button', { name: 'Close evidence' }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      await ready(gallery, sources[1]);
      assert(await open.evaluate(e => e === document.activeElement), 'Early modal close restores opener after the photo fade');
      await previews.first().click();
    } finally {
      release();
      await page.unroute(slowUrl);
      await page.unroute(failedUrl);
    }
  }
  console.log('PASS: both galleries, ordered 100/150ms fades, no zoom, stable loading/failure, retry/original, stale responses, rapid image/video changes, active reselection and reduced motion');
}
