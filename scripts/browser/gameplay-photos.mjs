import assert from "node:assert/strict";

import { waitForPhoto as ready } from "./gallery-photo-ready.mjs";
import { installVideoFixture } from './fixtures/youtube-provider.mjs';

async function overlap(gallery, index) {
  const result = await gallery.locator('.gallery-thumbnail').nth(index).evaluate(element => new Promise((resolve, reject) => {
    const gallery = element.closest('.game-gallery');
    const oldSource = gallery.querySelector('.gallery-photo img').getAttribute('src');
    element.click();
    let frames = 0;
    const sample = () => {
      if (++frames > 180) { reject(new Error('No visible photo overlap within 180 render frames')); return; }
      const incoming = gallery.querySelector('.gallery-photo.fading-in');
      const outgoing = gallery.querySelector('.gallery-photo-backdrop');
      const opacity = incoming && Number(getComputedStyle(incoming).opacity);
      if (incoming && outgoing && opacity > 0.05 && opacity < 0.95) {
        const style = getComputedStyle(incoming);
        const image = incoming.querySelector('img');
        resolve({ opacity, backdropOpacity: Number(getComputedStyle(outgoing).opacity),
          oldSource, backdropSource: outgoing.querySelector('img').getAttribute('src'),
          duration: style.animationDuration, easing: style.animationTimingFunction, transform: style.transform,
          background: style.backgroundColor,
          decoded: image.complete && image.naturalWidth > 0, framing: getComputedStyle(image).objectFit,
          selected: element.getAttribute('aria-pressed'), announcement: gallery.querySelector('[aria-live]').textContent,
          blocked: incoming.disabled, hidden: outgoing.getAttribute('aria-hidden'),
          outgoingDisabled: outgoing.disabled, outgoingTabIndex: outgoing.tabIndex });
      } else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  assert(result.opacity > 0 && result.opacity < 1, 'Incoming photo is visibly translucent during overlap');
  assert.equal(result.backdropOpacity, 1, 'Opaque outgoing backdrop prevents a dark interval');
  assert.equal(result.backdropSource, result.oldSource);
  assert.equal(result.duration, '0.3s'); assert.equal(result.easing, 'ease-in-out');
  assert.equal(result.transform, 'none'); assert.equal(result.framing, 'contain'); assert(result.decoded);
  assert.equal(result.background, 'rgb(9, 14, 12)', 'Incoming canvas fades letterboxing as well as image pixels');
  assert.equal(result.selected, 'true'); assert(result.announcement.includes(`${index + 1} /`));
  assert(result.blocked && result.outgoingDisabled); assert.equal(result.hidden, 'true'); assert.equal(result.outgoingTabIndex, -1);
  await ready(gallery);
  assert.equal(await gallery.locator('.gallery-photo-layer').count(), 1, 'Completion releases outgoing layers');
  assert.equal(await gallery.locator('.gallery-photo').evaluate(e => Number(getComputedStyle(e).opacity)), 1);
}

async function decodeAndInterrupt(page, selector) {
  const gallery = page.locator(selector).first();
  const previews = gallery.locator('.gallery-thumbnail');
  const start = selector.includes('placeholder') ? 0 : 1;
  const target = start + 1;
  const latest = target + 1;
  const sources = await previews.locator('img').evaluateAll(images => images.map(e => e.getAttribute('src')));
  await page.evaluate(source => {
    const decode = HTMLImageElement.prototype.decode;
    window.decodeFixture = { source: new URL(source, location.href).href, mode: 'hold', pending: [] };
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      if (this.isConnected || this.src !== window.decodeFixture.source) return;
      if (window.decodeFixture.mode === 'fail') throw new Error('Controlled decoding failure');
      if (window.decodeFixture.mode === 'hold') await new Promise(resolve => window.decodeFixture.pending.push(resolve));
    };
    window.restoreDecode = () => { HTMLImageElement.prototype.decode = decode; };
  }, sources[target]);
  try {
    await previews.nth(start).click(); await ready(gallery);
    await previews.nth(target).click();
    await page.waitForFunction(() => window.decodeFixture.pending.length === 1);
    assert.equal(await gallery.locator('.gallery-photo-backdrop img').getAttribute('src'), sources[start]);
    assert.equal(await gallery.locator('.gallery-photo.fading-in').count(), 0, 'Decode must finish before presentation');
    await previews.nth(latest).click(); await ready(gallery);
    await page.evaluate(() => window.decodeFixture.pending.splice(0).forEach(resolve => resolve()));
    await page.waitForTimeout(350);
    await ready(gallery, sources[latest]);
    assert.equal(await previews.nth(latest).getAttribute('aria-pressed'), 'true', 'Stale decode cannot replace latest selection');
    await page.evaluate(() => { window.decodeFixture.mode = 'fail'; });
    await previews.nth(target).click(); await gallery.getByRole('alert').waitFor();
    assert.equal(await gallery.locator('.gallery-photo-backdrop img').getAttribute('src'), sources[latest]);
    await page.evaluate(() => { window.decodeFixture.mode = 'pass'; });
    await gallery.getByRole('button', { name: 'Retry', exact: true }).click(); await ready(gallery);

    // Interrupt a rendered fade; retained keyed layers must continue without reset.
    const retained = await previews.nth(start).evaluate((element, latest) => new Promise((resolve, reject) => {
      const gallery = element.closest('.game-gallery');
      element.click();
      let frames = 0;
      const sample = () => {
        if (++frames > 180) { reject(new Error('No interruptible rendered photo fade within 180 frames')); return; }
        const incoming = gallery.querySelector('.gallery-photo.fading-in');
        const opacity = incoming && Number(getComputedStyle(incoming).opacity);
        if (!incoming || opacity < 0.2 || opacity > 0.7) { requestAnimationFrame(sample); return; }
        gallery.querySelectorAll('.gallery-thumbnail')[latest].click();
        // An obsolete completion event must not make the new request inspectable.
        incoming.dispatchEvent(new AnimationEvent('animationend', { animationName: 'gallery-photo-in', bubbles: true }));
        requestAnimationFrame(() => resolve({ connected: incoming.isConnected,
          before: opacity, after: Number(getComputedStyle(incoming).opacity),
          ready: !!gallery.querySelector('.gallery-photo.ready') }));
      };
      requestAnimationFrame(sample);
    }), latest);
    assert(retained.connected && retained.after >= retained.before, 'Interrupted fade retains its visible layer without restarting');
    assert(!retained.ready, 'Obsolete transition cannot mark latest request ready');
    await ready(gallery, sources[latest]);
    assert.equal(await gallery.locator('.gallery-photo-layer').count(), 1);
  } finally {
    await page.evaluate(() => { window.decodeFixture.pending.splice(0).forEach(resolve => resolve()); window.restoreDecode(); });
  }
}

export default async function checkPhotoChanges(page) {
  await installVideoFixture(page);
  await page.reload();
  await page.setViewportSize({ width: 1366, height: 768 });
  const galleries = await page.locator('.regulus-showcase .game-gallery, .video-project .game-gallery').all();
  for (const gallery of galleries) {
    const previews = gallery.locator('.gallery-thumbnail');
    const sources = await previews.locator('img').evaluateAll(elements => elements.map(e => e.getAttribute('src')));
    const viewer = gallery.locator('.gallery-viewer');
    const open = gallery.locator('.gallery-viewer .evidence-image-button');
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
    await overlap(gallery, 2);
    const animations = await page.evaluate(() => window.photoAnimations);
    assert.deepEqual(animations.filter(a => a.type === 'animationstart').map(a => [a.name, a.duration, a.transform]), [
      ['gallery-photo-in', '0.3s', 'none'],
    ], 'Overlapping photo crossfade uses 300ms and no zoom');
    assert.deepEqual(animations.map(a => [a.name, a.type, a.elapsed]), [
      ['gallery-photo-in', 'animationstart', 0], ['gallery-photo-in', 'animationend', 0.3],
    ], 'Crossfade completes its CSS duration');
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
    await viewer.locator('iframe').waitFor({ state: 'attached' });
    assert.equal(await viewer.locator('iframe').count(), 1, 'Video request mounts its player while readiness is pending');
    const player = await viewer.locator('iframe').elementHandle();
    await previews.first().click();
    await page.waitForTimeout(400);
    assert(await player.evaluate(e => e.isConnected), 'Video reselection preserves the player');
    assert.equal(await viewer.locator('img').count(), 0, 'Cancelled photo work cannot replace video');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await previews.nth(1).click(); await ready(gallery, sources[1]);
    await previews.nth(2).click(); await ready(gallery, sources[2]);
    assert.equal(await open.evaluate(e => getComputedStyle(e).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await previews.first().click();
  }

  // Hold real image responses on the rendered page, including thumbnail requests.
  // Each gallery runs independently with its own slow, failed and retried photos.
  for (let galleryIndex = 0; galleryIndex < galleries.length; galleryIndex++) {
    const gallery = page.locator('.regulus-showcase .game-gallery, .video-project .game-gallery').nth(galleryIndex);
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
      const open = gallery.locator('.gallery-viewer .evidence-image-button');
      await previews.nth(1).click(); await ready(gallery, sources[1]);
      const size = await viewer.boundingBox();
      await previews.nth(2).click();
      await gallery.getByRole('status').waitFor();
      assert.equal(await open.count(), 0, 'Slow load has no main-image opener');
      assert.equal(await viewer.locator('.evidence-image-button').count(), 0, 'Loading has no activatable main photo');
      assert.equal(await viewer.locator('.gallery-photo-backdrop img').getAttribute('src'), sources[1], 'Slow loading retains the outgoing photo');
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
      await viewer.locator('iframe').waitFor({ state: 'attached' });
      assert.equal(await viewer.locator('iframe').count(), 1, 'Video selection cancels the held photo request');
      await previews.nth(1).click(); await ready(gallery, sources[1]);
      release();
      await page.waitForTimeout(350);
      await ready(gallery, sources[1]);
      assert.equal(await previews.nth(1).getAttribute('aria-pressed'), 'true', 'Stale response cannot change selection');
      await previews.nth(2).click(); await ready(gallery, sources[2]);
      await previews.nth(3).click();
      await gallery.getByRole('alert').waitFor();
      assert.equal(await open.count(), 0, 'Failure has no main-image opener');
      assert.equal(await viewer.locator('.gallery-photo-backdrop img').getAttribute('src'), sources[2], 'Failure retains the outgoing photo');
      const original = gallery.getByRole('link', { name: 'Open original file' });
      assert.equal(await original.getAttribute('href'), sources[3]);
      assert.equal(await original.getAttribute('target'), '_blank');
      assert.equal((await viewer.boundingBox()).height, size.height, 'Failure keeps viewer height');
      const other = page.locator('.regulus-showcase .game-gallery, .video-project .game-gallery').nth(1 - galleryIndex);
      assert.equal(await other.locator('iframe').count(), 1, 'Loading/failure stays within the chosen gallery');
      await previews.nth(1).click(); await ready(gallery, sources[1]);
      await previews.nth(3).click(); await gallery.getByRole('alert').waitFor();
      retrySucceeds = true;
      const retry = gallery.getByRole('button', { name: 'Retry', exact: true });
      const retryBounds = await retry.boundingBox();
      assert(retryBounds.width >= 44 && retryBounds.height >= 44, 'Failed-photo Retry retains a usable target');
      assert(await retry.evaluate(e => getComputedStyle(e).borderRadius === '50%' &&
        getComputedStyle(e).color === 'rgb(161, 231, 125)'), 'Retry retains its circular green action presentation');
      await retry.click();
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
  // Image-only consumers inherit the same rendered overlap, including wraparound.
  for (const gallery of await page.locator('.placeholder-project .game-gallery').all()) {
    await gallery.locator('.gallery-thumbnail').first().click(); await ready(gallery);
    await overlap(gallery, 1);
    await overlap(gallery, 4);
    await overlap(gallery, 0);
  }
  await decodeAndInterrupt(page, '.regulus-showcase .game-gallery');
  await decodeAndInterrupt(page, '.placeholder-project .game-gallery');
  console.log('PASS: shared 300ms overlap/completion, framing, accessible backdrops, stable loading/failure, retry/original, stale responses, rapid selection, inspection and reduced motion');
}
