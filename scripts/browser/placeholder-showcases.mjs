import assert from 'node:assert/strict';
import { waitForPhoto } from './gallery-photo-ready.mjs';
import { installPausedClock, waitForPhoto as waitForClockPhoto } from './gameplay-slideshow.mjs';
import { withBrowserContext } from './run-browser-check.mjs';

const projectName = 'Invictus: Lost Soul';
const galleryName = projectName + ' mock images';
const viewports = [[360,840],[390,845],[845,390],[840,360],[800,1200],[1200,800],[899,700],[900,700],[901,700],[1366,768],[1920,1080]];

async function selected(gallery) {
  return gallery.locator('.gallery-thumbnail').evaluateAll(es => es.findIndex(e => e.getAttribute('aria-pressed') === 'true'));
}
async function releaseInspection(page) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
  await page.clock.runFor(32);
  await page.waitForTimeout(100);
}
async function dwell(page, gallery, from, to, ready = true) {
  await page.clock.fastForward(6000);
  assert.equal(await selected(gallery), from, 'A ready/resumed photo gets a full dwell');
  await page.clock.fastForward(700);
  assert.equal(await selected(gallery), to, 'Image-only progression wraps in ordered media');
  if (ready) await waitForClockPhoto(gallery);
}
async function closeModal(page, method = 'escape') {
  if (method === 'button') await page.getByRole('button', { name: 'Close evidence', exact: true }).click();
  else if (method === 'backdrop') await page.mouse.click(2, 2);
  else await page.keyboard.press('Escape');
  await page.locator('dialog').waitFor({ state: 'detached' });
}
async function swipe(page, target, direction) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  const y = box.y + box.height * .4;
  await page.mouse.move(box.x + box.width * (direction > 0 ? .8 : .2), y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * (direction > 0 ? .2 : .8), y, { steps: 12 });
  await page.mouse.up();
}

export default async function checkPlaceholders(page) {
  const section = page.getByRole('region', { name: projectName, exact: true });
  const gallery = page.getByRole('region', { name: galleryName, exact: true });
  const previews = gallery.locator('.gallery-thumbnail');
  const opener = gallery.locator('.gallery-viewer .evidence-image-button');
  await section.waitFor();
  assert.equal(await page.getByRole('heading', { name: projectName, exact: true }).count(), 1);
  assert.deepEqual(await page.locator('main .project-title').allTextContents(),
    ['Regulus the Advent', 'Father, Son & Holy Guns', 'Vecchio Furioso', projectName]);
  assert(await section.evaluate(e => e.previousElementSibling.querySelector('h2').textContent.trim() === 'Vecchio Furioso'));
  assert(await page.locator('footer').last().isVisible(), 'Subsequent footer remains present');
  assert.match(await section.innerText(), /Placeholder project content/);
  for (const field of ['My role', 'Responsibilities', 'Platforms', 'Tools']) {
    const detail = section.getByRole('heading', { name: field, exact: true });
    assert.equal(await detail.evaluate(e => e.nextElementSibling.textContent), '[to confirm]');
  }
  assert.equal(await section.locator('iframe, a').count(), 0, 'No invented video or store destinations');
  assert.equal(await previews.count(), 5);
  assert.equal(await selected(gallery), 0, 'Image-only gallery starts on the first image');
  const sources = await previews.locator('img').evaluateAll(es => es.map(e => e.getAttribute('src')));
  assert.equal(new Set(sources).size, 5, 'Five individually addressable panels');
  for (const source of sources) {
    const response = await page.request.get(new URL(source, page.url()).href);
    assert(response.ok(), 'Each base-aware asset loads');
    const text = await page.evaluate(svg => new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement.textContent, await response.text());
    assert(text.includes(projectName) && text.includes('Mock image'), 'The panel itself contains its project name and mock label');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const existing = page.locator('.regulus-showcase .game-gallery, .video-project .game-gallery');
  await existing.first().locator('.gallery-thumbnail').nth(2).click();
  await waitForPhoto(existing.first());
  await existing.nth(1).locator('.gallery-thumbnail').nth(3).click();
  await waitForPhoto(existing.nth(1));
  await page.getByRole('button', { name: 'High', exact: true }).click();

  for (const motion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      await previews.first().click();
      await waitForPhoto(gallery);
      const title = await section.getByRole('heading', { name: projectName, exact: true }).boundingBox();
      const media = await gallery.boundingBox();
      const details = await section.locator('.project-details').boundingBox();
      if (width <= 900) {
        assert(title.y + title.height <= media.y && media.y + media.height <= details.y,
          'At and below 900px the title, gallery, details follow in order');
      } else assert(media.x >= details.x + details.width, 'Desktop details sit beside the gallery');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page-level overflow');
      assert.equal(await gallery.locator('.gallery-viewer img').evaluate(e => getComputedStyle(e).objectFit), 'contain');
      for (let i = 0; i < 5; i++) {
        await previews.nth(i).click();
        await waitForPhoto(gallery, sources[i]);
        assert.equal(await selected(gallery), i);
        assert.equal(await gallery.locator('.gallery-thumbnail[aria-pressed="true"]').count(), 1);
        const alt = await opener.locator('img').getAttribute('alt');
        assert(alt.includes(projectName) && alt.includes('Mock image') && alt.includes('not gameplay'));
        const image = await opener.locator('img').evaluate(e => ({ loaded: e.complete && e.naturalWidth > 0, ratio: e.naturalWidth / e.naturalHeight }));
        assert(image.loaded);
        const box = await opener.boundingBox();
        assert(Math.abs(box.width / box.height - image.ratio) < .02, 'Complete main-image framing retains labels');
        await opener.click();
        const dialog = page.getByRole('dialog', { name: new RegExp(projectName + '.*Mock image') });
        await dialog.locator('img').evaluate(e => e.decode());
        await dialog.evaluate(e => Promise.all(e.getAnimations().map(animation => animation.finished)));
        assert.equal(await dialog.locator('img').getAttribute('src'), sources[i]);
        assert.equal(await dialog.locator('img').getAttribute('alt'), alt);
        assert.equal(await dialog.locator('img').evaluate(e => getComputedStyle(e).objectFit), 'contain');
        const bounds = await dialog.boundingBox();
        assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height,
          'Modal and mock labels stay inside every supported viewport');
        for (const control of await dialog.locator('button, a').all()) {
          const target = await control.boundingBox();
          assert(target.height >= 44 && target.x >= bounds.x && target.x + target.width <= bounds.x + bounds.width + 1);
        }
        await page.keyboard.press('ArrowRight');
        const next = (i + 1) % 5;
        assert.equal(await dialog.locator('img').getAttribute('src'), sources[next], 'Modal wraps within Invictus');
        await closeModal(page, i % 3 === 0 ? 'button' : i % 3 === 1 ? 'backdrop' : 'escape');
        await waitForPhoto(gallery, sources[next]);
        assert.equal(await selected(gallery), next, 'Modal selection synchronizes to main viewer');
        assert(await opener.evaluate(e => e === document.activeElement), 'Dismissal restores the ready image opener');
      }
    }
  }
  assert.equal(await selected(existing.first()), 2, 'Invictus leaves Regulus selection unchanged');
  assert.equal(await selected(existing.nth(1)), 3, 'Invictus leaves Father Son selection unchanged');
  assert.equal(await page.getByRole('button', { name: 'High', exact: true }).getAttribute('aria-pressed'), 'true');
  console.log('PASS: Invictus content, five designed assets, every thumbnail/modal, independence and 11 viewports in both motion modes');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 845 });
  await previews.first().click();
  await waitForPhoto(gallery);
  await previews.first().focus();
  await page.keyboard.press('End');
  assert(await previews.last().evaluate(e => e === document.activeElement));
  assert.equal(await selected(gallery), 0, 'Keyboard browsing keeps selection');
  assert(await previews.last().evaluate(e => getComputedStyle(e).outlineStyle !== 'none'), 'Keyboard focus is visible');
  await page.keyboard.press('Enter');
  await waitForPhoto(gallery, sources[4]);
  await opener.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('dialog img').getAttribute('src'), sources[0]);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('dialog img').getAttribute('src'), sources[4], 'Previous modal navigation wraps through every image');
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    assert(await page.locator('dialog').evaluate(e => e.contains(document.activeElement)), 'Modal retains keyboard focus');
  }
  await closeModal(page);
  await waitForPhoto(gallery);
  await previews.first().click();
  await waitForPhoto(gallery, sources[0]);
  await gallery.getByRole('button', { name: /scroll previews forward/ }).click();
  assert.equal(await selected(gallery), 0, 'Preview controls browse without selecting');
  const strip = gallery.locator('.gallery-thumbnails');
  await strip.evaluate(e => e.scrollLeft = 0);
  await swipe(page, strip, 1);
  assert(await strip.evaluate(e => e.scrollLeft > 0), 'Dragging browses the thumbnail strip');
  assert.equal(await selected(gallery), 0);
  await swipe(page, gallery.locator('.gallery-viewer'), -1);
  await waitForPhoto(gallery, sources[4]);
  assert.equal(await selected(gallery), 4, 'Main-photo swipe wraps backward');
  assert.equal(await page.locator('dialog').count(), 0, 'Swipe does not accidentally open inspection');

  await withBrowserContext(page.context().browser(), { viewport: { width: 390, height: 845 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' }, async context => {
    const touchPage = await context.newPage();
    await touchPage.goto(page.url());
    const touchGallery = touchPage.getByRole('region', { name: galleryName, exact: true });
    const touchStrip = touchGallery.locator('.gallery-thumbnails');
    await waitForPhoto(touchGallery);
    await touchStrip.scrollIntoViewIfNeeded();
    const session = await context.newCDPSession(touchPage);
    async function gesture(target, dx, dy) {
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      const x = box.x + box.width * .8, y = box.y + Math.min(35, box.height * .3);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 8; i++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 8, y: y + dy * i / 8 }] });
        await touchPage.waitForTimeout(20);
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await gesture(touchStrip, -140, 0);
    assert(await touchStrip.evaluate(e => e.scrollLeft > 0));
    assert.equal(await selected(touchGallery), 0, 'Native touch browsing never selects');
    await gesture(touchGallery.locator('.gallery-viewer'), -140, 0);
    await waitForPhoto(touchGallery);
    assert.equal(await selected(touchGallery), 1, 'Native main-image swipe selects next');
    assert.equal(await touchPage.locator('dialog').count(), 0);
    await touchGallery.locator('.gallery-viewer').scrollIntoViewIfNeeded();
    const before = await touchPage.evaluate(() => scrollY);
    await gesture(touchGallery.locator('.gallery-viewer'), 0, -100);
    assert(await touchPage.evaluate(y => scrollY > y, before), 'Vertical photo gesture scrolls the page');
    assert.equal(await selected(touchGallery), 1);
    await touchGallery.locator('.evidence-image-button').tap();
    await touchPage.getByRole('dialog').waitFor();
    await closeModal(touchPage, 'button');
    for (let i = 0; i < 5; i++) {
      await touchGallery.locator('.gallery-thumbnail').nth(i).tap();
      await waitForPhoto(touchGallery);
      assert.equal(await selected(touchGallery), i, 'Every thumbnail remains selectable by touch');
      await touchGallery.locator('.evidence-image-button').tap();
      assert.equal(await touchPage.locator('dialog img').getAttribute('src'), sources[i]);
      await closeModal(touchPage, 'button');
    }
    await session.detach();
  });
  await page.bringToFront();
  console.log('PASS: Invictus keyboard focus/navigation, preview browsing, mouse/native touch swipes, vertical scrolling and tap inspection');

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await installPausedClock(page);
  await page.reload();
  await gallery.scrollIntoViewIfNeeded();
  await waitForClockPhoto(gallery);
  await releaseInspection(page);
  for (let i = 0; i < 5; i++) await dwell(page, gallery, i, (i + 1) % 5);
  await opener.hover();
  await page.clock.fastForward(14000);
  assert.equal(await selected(gallery), 0, 'Hover inspection suspends progression');
  await releaseInspection(page);
  await opener.focus();
  await page.keyboard.press('Shift');
  await page.clock.runFor(32);
  await page.clock.fastForward(14000);
  assert.equal(await selected(gallery), 0, 'Keyboard inspection suspends progression');
  await page.keyboard.press('Enter');
  await page.mouse.move(0, 0);
  await page.clock.fastForward(14000);
  assert.equal(await selected(gallery), 0, 'Modal inspection suspends progression');
  await page.keyboard.press('Escape');
  await page.clock.runFor(220);
  await page.locator('dialog').waitFor({ state: 'detached' });
  await releaseInspection(page);
  await dwell(page, gallery, 0, 1);
  await page.clock.fastForward(3900);
  await previews.nth(4).evaluate(e => e.click());
  await waitForClockPhoto(gallery);
  await releaseInspection(page);
  await dwell(page, gallery, 4, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.clock.runFor(32);
  await page.waitForTimeout(100);
  assert(await gallery.evaluate(e => e.getBoundingClientRect().top >= innerHeight), 'Invictus is completely offscreen');
  await page.clock.fastForward(14000);
  assert.equal(await selected(gallery), 0, 'Offscreen image-only gallery suspends');
  await gallery.scrollIntoViewIfNeeded();
  await releaseInspection(page);
  await dwell(page, gallery, 0, 1);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.runFor(32);
  await page.clock.fastForward(14000);
  assert.equal(await selected(gallery), 1, 'Hidden document suspends image-only progression');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await releaseInspection(page);
  await dwell(page, gallery, 1, 2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(32);
  await page.waitForTimeout(100);
  await page.clock.fastForward(20000);
  assert.equal(await selected(gallery), 2, 'Live reduced motion stops image-only progression');

  await page.setViewportSize({ width: 1366, height: 6000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await existing.first().locator('.gallery-thumbnail').nth(1).evaluate(e => e.click());
  await waitForClockPhoto(existing.first());
  await previews.nth(2).evaluate(e => e.click());
  await waitForClockPhoto(gallery);
  await releaseInspection(page);
  await page.clock.fastForward(3900);
  await previews.nth(4).evaluate(e => e.click());
  await waitForClockPhoto(gallery);
  await releaseInspection(page);
  await page.clock.fastForward(2900);
  assert.equal(await selected(existing.first()), 2, 'Invictus selection does not restart another gallery countdown');
  assert.equal(await selected(gallery), 4, 'Invictus receives its own fresh dwell');
  await existing.first().locator('.gallery-thumbnail').nth(1).evaluate(e => e.click());
  await waitForClockPhoto(existing.first());
  await releaseInspection(page);
  await opener.click();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(6700);
  assert.equal(await selected(existing.first()), 2, 'Invictus modal inspection does not suspend another gallery');
  assert.equal(await selected(gallery), 4, 'Invictus modal inspection keeps its image stable');
  await page.keyboard.press('Escape');
  await page.clock.runFor(220);
  await page.locator('dialog').waitFor({ state: 'detached' });
  await page.setViewportSize({ width: 1366, height: 768 });

  const slowUrl = new URL(sources[1], page.url()).href;
  const failedUrl = new URL(sources[2], page.url()).href;
  let release, retrySucceeds = false;
  const held = new Promise(resolve => { release = resolve; });
  await page.route(slowUrl, async route => { const response = await route.fetch(); await held; await route.fulfill({ response }); });
  await page.route(failedUrl, route => retrySucceeds ? route.continue() : route.fulfill({ status: 503, body: 'Unavailable' }));
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await gallery.scrollIntoViewIfNeeded();
    await waitForClockPhoto(gallery);
    await previews.nth(1).evaluate(e => e.click());
    await page.clock.runFor(200);
    await gallery.getByRole('status').waitFor();
    await releaseInspection(page);
    await page.clock.fastForward(14000);
    assert.equal(await selected(gallery), 1, 'Loading waits beyond the dwell');
    assert.equal(await opener.count(), 0, 'Loading cannot open inspection');
    release();
    await waitForClockPhoto(gallery);
    await dwell(page, gallery, 1, 2, false);
    await page.clock.runFor(200);
    await gallery.getByRole('alert').waitFor();
    await page.clock.fastForward(14000);
    assert.equal(await selected(gallery), 2, 'Failure cannot advance');
    assert.equal(await gallery.getByRole('link', { name: 'Open original file' }).getAttribute('href'), sources[2]);
    retrySucceeds = true;
    await gallery.getByRole('button', { name: 'Retry', exact: true }).click();
    await waitForClockPhoto(gallery);
    await releaseInspection(page);
    await dwell(page, gallery, 2, 3);
  } finally {
    release();
    await page.unroute(slowUrl);
    await page.unroute(failedUrl);
  }
  await page.getByRole('link', { name: /QA approach/ }).first().click();
  await page.goBack();
  assert.equal(await selected(gallery), 0, 'Returning to the homepage resets the image-only gallery to its first panel');
  console.log('PASS: image-only 6.5s progression/wrap, inspection/manual reset, offscreen/hidden state, timer independence, live reduced motion, slow load, failure, Retry and route reset');
}
