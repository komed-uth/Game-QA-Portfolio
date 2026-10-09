import assert from "node:assert/strict";
// Keep dwell assertions independent of the machine's wall-clock scheduling.
async function installPausedClock(page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
}
async function waitForPhoto(gallery) {
  const page = gallery.page();
  for (let attempt = 0; attempt < 300; attempt++) {
    await page.clock.runFor(16);
    await page.waitForTimeout(16);
    const photo = gallery.locator('.gallery-viewer .evidence-image-button');
    const source = await gallery.locator('.gallery-thumbnail[aria-pressed="true"] img').getAttribute('src');
    if (await photo.count() && await photo.isEnabled() && await photo.locator('img').getAttribute('src') === source) return;
  }
  throw new Error('Selected photo did not become fully displayed');
}

export default async function checkSlideshow(page) {
  await page.setViewportSize({ width: 1366, height: 768 });
  await installPausedClock(page);
  const galleries = page.locator('.game-gallery');
  async function isSelected(gallery, index, message) {
    const value = await gallery.locator('.gallery-thumbnail').nth(index).getAttribute('aria-pressed');
    assert.equal(value, 'true', message);
  }
  async function releaseInspection() {
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.activeElement?.blur());
    await page.clock.runFor(1);
    await page.waitForTimeout(60);
  }
  async function photo(gallery, index) {
    await gallery.scrollIntoViewIfNeeded();
    await gallery.locator('.gallery-thumbnail').nth(index).evaluate(e => e.click());
    await waitForPhoto(gallery);
    await releaseInspection();
  }
  async function fullInterval(gallery, from, to) {
    await gallery.scrollIntoViewIfNeeded();
    // Let browser rendering and passive effects settle before advancing its clock.
    await page.clock.runFor(32);
    await page.waitForTimeout(100);
    await page.clock.fastForward(4500);
    await isSelected(gallery, from, 'A ready/resumed photo receives a full five-second interval');
    await page.clock.fastForward(700);
    await isSelected(gallery, to, 'Eligible photo advances in media order');
  }

  for (let index = 0; index < 2; index++) {
    await page.reload();
    const gallery = galleries.nth(index);
    assert.equal(await gallery.getByRole('button', { name: 'Pause slideshow', exact: true }).count(), 1);
    await photo(gallery, 1);
    await fullInterval(gallery, 1, 2);
    await waitForPhoto(gallery);
    await fullInterval(gallery, 2, 3);
    await waitForPhoto(gallery);
    await fullInterval(gallery, 3, 0);
    const player = gallery.locator('iframe');
    assert.match(await player.getAttribute('src'), /autoplay=1&mute=1/);
    const identity = await player.elementHandle();
    await page.clock.fastForward(15000);
    await isSelected(gallery, 0, 'No timer skips video');
    assert(await identity.evaluate(e => e.isConnected));
    await isSelected(galleries.nth(1 - index), 0, 'Other gallery selection is independent');

    await photo(gallery, 1);
    await page.clock.fastForward(3000);
    await photo(gallery, 2);
    await fullInterval(gallery, 2, 3);
    await photo(gallery, 1);
    await page.clock.fastForward(3000);
    await gallery.locator('.gallery-thumbnail').nth(1).evaluate(e => e.click());
    await page.clock.fastForward(2300);
    await isSelected(gallery, 2, 'Active reselection does not restart dwell');

    await photo(gallery, 1);
    await gallery.getByRole('button', { name: 'Pause slideshow', exact: true }).click();
    await photo(gallery, 2);
    await page.clock.fastForward(10000);
    await isSelected(gallery, 2, 'Explicit Pause survives manual selection');
    assert.equal(await galleries.nth(1 - index).getByRole('button', { name: 'Pause slideshow', exact: true }).count(), 1);
    await gallery.getByRole('button', { name: 'Resume slideshow', exact: true }).click();
    await releaseInspection();
    await fullInterval(gallery, 2, 3);

    await photo(gallery, 1);
    await page.clock.fastForward(3000);
    await gallery.locator('.gallery-thumbnail').nth(1).hover();
    await gallery.locator('.gallery-thumbnail').nth(2).focus();
    await page.clock.fastForward(7000);
    await isSelected(gallery, 1, 'Hover and focus suspend selection');
    await page.mouse.move(0, 0);
    await page.clock.fastForward(7000);
    await isSelected(gallery, 1, 'Clearing hover alone cannot clear focus suspension');
    await releaseInspection();
    await fullInterval(gallery, 1, 2);

    await photo(gallery, 1);
    await gallery.locator('.gallery-thumbnails').dispatchEvent('pointerdown', { pointerId: 42, isPrimary: true, button: 0, pointerType: 'touch' });
    await releaseInspection();
    await page.clock.fastForward(7000);
    await isSelected(gallery, 1, 'Active drag suspends even outside gallery');
    await page.locator('body').dispatchEvent('pointerup', { pointerId: 42, isPrimary: true, button: 0, pointerType: 'touch' });
    await page.clock.runFor(1);
    await page.waitForTimeout(60);
    await fullInterval(gallery, 1, 2);

    await photo(gallery, 1);
    await gallery.evaluate(e => window.scrollTo(0, e.getBoundingClientRect().bottom + scrollY + 20));
    await page.clock.runFor(32);
    await page.waitForTimeout(100);
    await page.clock.fastForward(7000);
    await isSelected(gallery, 1, 'Offscreen gallery suspends');
    await gallery.scrollIntoViewIfNeeded();
    await page.clock.runFor(32);
    await page.waitForTimeout(100);
    await fullInterval(gallery, 1, 2);

    await photo(gallery, 1);
    // Exercise the browser visibility event with controlled hidden/visible state.
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await gallery.locator('.gallery-thumbnail').nth(1).hover();
    await page.clock.fastForward(7000);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.clock.fastForward(7000);
    await isSelected(gallery, 1, 'Visible tab still waits for hover to clear');
    await releaseInspection();
    await fullInterval(gallery, 1, 2);
    await page.evaluate(() => delete document.hidden);

    await photo(gallery, 1);
    await gallery.locator('.gallery-caption .evidence-open').first().click();
    await page.mouse.move(0, 0);
    await page.clock.fastForward(7000);
    await isSelected(gallery, 1, 'Modal inspection suspends progression');
    await page.getByRole('button', { name: 'Close evidence', exact: true }).click();
    await page.clock.runFor(220);
    await page.locator('dialog').waitFor({ state: 'detached' });
    await releaseInspection();
    await fullInterval(gallery, 1, 2);
  }

  // Hold network loading longer than a dwell; retry also receives a new interval.
  for (let index = 0; index < 2; index++) {
    const gallery = galleries.nth(index);
    const sources = await gallery.locator('.gallery-thumbnail img').evaluateAll(es => es.map(e => e.getAttribute('src')));
    const slowUrl = new URL(sources[2], page.url()).href;
    const failedUrl = new URL(sources[3], page.url()).href;
    let release;
    let succeeds = false;
    const held = new Promise(resolve => { release = resolve; });
    await page.route(slowUrl, async route => { const response = await route.fetch(); await held; await route.fulfill({ response }); });
    await page.route(failedUrl, route => succeeds ? route.continue() : route.fulfill({ status: 503, body: 'Unavailable' }));
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await photo(gallery, 1);
      await gallery.locator('.gallery-thumbnail').nth(2).evaluate(e => e.click());
      await gallery.getByRole('status').waitFor();
      await releaseInspection();
      await page.clock.fastForward(10000);
      await isSelected(gallery, 2, 'Loading never consumes dwell');
      release();
      await waitForPhoto(gallery);
      await fullInterval(gallery, 2, 3);
      await gallery.getByRole('alert').waitFor();
      await page.clock.fastForward(10000);
      await isSelected(gallery, 3, 'Failed photo has no countdown');
      succeeds = true;
      await gallery.getByRole('button', { name: 'Retry', exact: true }).click();
      await waitForPhoto(gallery);
      await releaseInspection();
      await fullInterval(gallery, 3, 0);
    } finally {
      release();
      await page.unroute(slowUrl);
      await page.unroute(failedUrl);
    }
  }

  // Native panning cancels pointer delivery while the finger remains down.
  const touchContext = await page.context().browser().newContext({ viewport: {width:390,height:845}, hasTouch:true, isMobile:true });
  try {
    const touchPage = await touchContext.newPage();
    await touchPage.goto(page.url());
    await installPausedClock(touchPage);
    const touchGallery = touchPage.locator('.game-gallery').first();
    await touchGallery.locator('.gallery-thumbnail').nth(1).tap();
    await waitForPhoto(touchGallery);
    await touchPage.evaluate(() => document.activeElement?.blur());
    const strip = touchGallery.locator('.gallery-thumbnails');
    await strip.scrollIntoViewIfNeeded();
    await strip.evaluate(e => {
      window.touchPointerCancelled = false;
      e.addEventListener('pointercancel', () => { window.touchPointerCancelled = true; }, {once:true});
    });
    const box = await strip.boundingBox();
    const session = await touchContext.newCDPSession(touchPage);
    const x = box.x + box.width * .8;
    const y = box.y + 20;
    await session.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x,y}]});
    for (let i = 1; i <= 8; i++) {
      await session.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:x-box.width*.6*i/8,y}]});
      await touchPage.waitForTimeout(20);
    }
    assert(await touchPage.evaluate(() => window.touchPointerCancelled), 'Native strip panning cancels pointer delivery');
    await touchPage.clock.fastForward(7000);
    assert.equal(await touchGallery.locator('.gallery-thumbnail').nth(1).getAttribute('aria-pressed'), 'true', 'Finger still down suspends progression after pointercancel');
    await session.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
    await touchPage.waitForTimeout(100);
    await touchPage.clock.fastForward(4500);
    assert.equal(await touchGallery.locator('.gallery-thumbnail').nth(1).getAttribute('aria-pressed'), 'true', 'Touch release receives a fresh interval');
    await touchPage.clock.fastForward(700);
    assert.equal(await touchGallery.locator('.gallery-thumbnail').nth(2).getAttribute('aria-pressed'), 'true', 'Progression resumes after actual touch release');
    await session.detach();
  } finally { await touchContext.close(); }
  await page.bringToFront();

  // Both timers run on the same visible portfolio while one gallery stays paused.
  await page.setViewportSize({ width: 1366, height: 6000 });
  await page.reload();
  await photo(galleries.first(), 1);
  await galleries.first().getByRole('button', { name: 'Pause slideshow', exact: true }).evaluate(e => e.click());
  await photo(galleries.nth(1), 1);
  await fullInterval(galleries.nth(1), 1, 2);
  await isSelected(galleries.first(), 1, 'Pausing one gallery does not suspend the other timer');
  await page.setViewportSize({ width: 1366, height: 768 });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const gallery = galleries.first();
  await photo(gallery, 1);
  assert.equal(await gallery.getByRole('button', { name: 'Resume slideshow', exact: true }).count(), 1);
  await page.clock.fastForward(7000);
  await isSelected(gallery, 1, 'Reduced motion defaults paused');
  await gallery.getByRole('button', { name: 'Resume slideshow', exact: true }).click();
  await releaseInspection();
  await fullInterval(gallery, 1, 2);
  await waitForPhoto(gallery);
  assert.equal(await gallery.locator('.gallery-photo').evaluate(e => getComputedStyle(e).animationName), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await photo(galleries.first(), 1);
  await galleries.first().getByRole('button', { name: 'Pause slideshow', exact: true }).click();
  await page.getByRole('link', { name: /QA approach/ }).first().click();
  await page.goBack();
  await isSelected(galleries.first(), 0, 'Route return resets video-first selection');
  assert.equal(await galleries.first().getByRole('button', { name: 'Pause slideshow', exact: true }).count(), 1);
  console.log('PASS: both slideshow sequences, full dwell/reset/reselection, video retention, pause independence, combined hover/focus/visibility, drag, offscreen, modal, reduced motion and route reset');
}
