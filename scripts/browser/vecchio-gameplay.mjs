import assert from 'node:assert/strict';
import { waitForPhoto } from './gallery-photo-ready.mjs';
import { installPausedClock, waitForPhoto as clockPhoto } from './gameplay-slideshow.mjs';
import { withBrowserContext } from './run-browser-check.mjs';

const files = ['01-daytime-jungle', '02-nighttime-opponent', '03-daytime-aiming', '04-daytime-village', '05-nighttime-field'];
const selected = gallery => gallery.locator('.gallery-thumbnail').evaluateAll(elements => elements.findIndex(e => e.getAttribute('aria-pressed') === 'true'));

export default async function checkVecchioGameplay(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const gallery = page.getByRole('region', { name: 'Vecchio Furioso media', exact: true });
  const previews = gallery.locator('.gallery-thumbnail');
  const opener = gallery.getByRole('button', { name: /Open full-size/ });
  const dialog = page.getByRole('dialog');
  await waitForPhoto(gallery);
  assert.equal(await selected(gallery), 0, 'Vecchio starts on the daytime jungle');
  assert.equal(await previews.count(), 5);
  assert.equal(await gallery.locator('iframe').count(), 0, 'Image-only gameplay');
  const sources = await previews.locator('img').evaluateAll(images => images.map(i => i.getAttribute('src')));
  assert.deepEqual(sources.map(source => source.split('/').at(-1)), files.map(file => file + '.png'), 'Accepted order includes replacement slots');
  const others = page.locator('.game-gallery').filter({ hasNot: previews });
  const otherSelections = await others.locator('.gallery-thumbnail[aria-pressed=true]').allTextContents();
  for (let i = 0; i < 5; i++) {
    await previews.nth(i).click();
    await waitForPhoto(gallery, sources[i]);
    assert.equal(await selected(gallery), i);
    const image = opener.locator('img');
    assert.deepEqual(await image.evaluate(i => [i.naturalWidth, i.naturalHeight]), [1920, 1080]);
    assert.equal(await image.evaluate(i => getComputedStyle(i).objectFit), 'contain');
    assert((await image.getAttribute('alt')).includes('Vecchio Furioso gameplay'));
    await opener.click();
    await dialog.locator('img').evaluate(i => i.decode());
    assert.equal(await dialog.locator('img').getAttribute('src'), sources[i]);
    assert.equal(await dialog.locator('img').evaluate(i => getComputedStyle(i).objectFit), 'contain');
    const original = dialog.getByRole('link');
    assert.equal(await original.getAttribute('href'), sources[i], 'Original pixels remain directly accessible');
    const response = await page.request.get(new URL(sources[i], page.url()).href);
    assert(response.ok(), 'Original source loads');
    await page.keyboard.press('ArrowRight');
    assert.equal(await dialog.locator('img').getAttribute('src'), sources[(i + 1) % 5]);
    await dialog.getByRole('button', { name: /Previous screenshot/ }).click();
    assert.equal(await dialog.locator('img').getAttribute('src'), sources[i]);
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    for (let tab = 0; tab < 6; tab++) {
      await page.keyboard.press('Tab');
      assert(await dialog.evaluate(d => d.contains(document.activeElement)), 'Gameplay modal contains keyboard focus');
    }
    if (i === 0) await dialog.getByRole('button', { name: 'Close evidence' }).click();
    else if (i === 1) await page.mouse.click(2, 2);
    else await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await waitForPhoto(gallery, sources[i]);
    assert(await opener.evaluate(e => e === document.activeElement), 'Gameplay restores its own opener');
    assert.equal(await selected(gallery), i);
  }
  assert.deepEqual(await others.locator('.gallery-thumbnail[aria-pressed=true]').allTextContents(), otherSelections, 'Vecchio selection and inspection leave other galleries unchanged');
  await gallery.page().getByRole('button', { name: 'Open full-size Microsoft PIX capture for Vecchio Furioso' }).click();
  assert.equal(await dialog.getByRole('button', { name: /screenshot/ }).count(), 0, 'PIX stays outside gameplay navigation');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });

  await withBrowserContext(page.context().browser(), { viewport: { width: 390, height: 845 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }, async context => {
    const phone = await context.newPage();
    await phone.goto(page.url());
    const g = phone.getByRole('region', { name: 'Vecchio Furioso media', exact: true });
    await waitForPhoto(g);
    const session = await context.newCDPSession(phone);
    async function gesture(target, dx, dy) {
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      const x = box.x + box.width * .7, y = box.y + box.height / 2;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let step = 1; step <= 8; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 8, y: y + dy * step / 8 }] });
        await phone.waitForTimeout(20);
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    const strip = g.locator('.gallery-thumbnails');
    await gesture(strip, -140, 0);
    assert(await strip.evaluate(e => e.scrollLeft > 0), 'Touch reveals later previews');
    assert.equal(await selected(g), 0, 'Preview browsing does not select');
    await gesture(g.locator('.gallery-viewer'), -140, 0);
    await waitForPhoto(g);
    assert.equal(await selected(g), 1, 'Main photo swipe selects the next image');
    assert.equal(await phone.locator('dialog').count(), 0, 'Swipe does not also open inspection');
    await g.locator('.gallery-viewer').scrollIntoViewIfNeeded();
    const scroll = await phone.evaluate(() => scrollY);
    await gesture(g.locator('.gallery-viewer'), 0, -100);
    assert(await phone.evaluate(before => scrollY > before, scroll), 'Vertical photo gesture scrolls the page');
    assert.equal(await selected(g), 1);
    await session.detach();
  });

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await installPausedClock(page);
  await page.reload();
  await gallery.scrollIntoViewIfNeeded();
  await clockPhoto(gallery);
  async function releaseInspection() {
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.activeElement?.blur());
    await page.clock.runFor(32);
    await page.waitForTimeout(60);
  }
  await releaseInspection();
  for (let i = 0; i < 5; i++) {
    await page.clock.fastForward(4900);
    assert.equal(await selected(gallery), i, 'Five-second dwell has not elapsed');
    await page.clock.fastForward(200);
    await clockPhoto(gallery);
    assert.equal(await selected(gallery), (i + 1) % 5, 'Image-only progression wraps after all five photos');
  }
  await opener.click();
  await page.clock.fastForward(12000);
  assert.equal(await selected(gallery), 0, 'Enlarged inspection suspends progression');
  await page.keyboard.press('Escape');
  await page.clock.runFor(220);
  await dialog.waitFor({ state: 'detached' });
  await page.clock.resume();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  console.log('PASS: Vecchio five full-resolution sources, selection, original access, modal wrap/focus/dismissal, independent PIX, native touch browsing/swipes/page scrolling and progression');
}
