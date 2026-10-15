import assert from 'node:assert/strict';
import { installPausedClock, waitForPhoto } from './gameplay-slideshow.mjs';
import { withBrowserContext } from './run-browser-check.mjs';
import { checkGalleryControlLayout } from './gallery-control-layout.mjs';

async function release(page) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
  await page.clock.runFor(32);
  await page.waitForTimeout(100);
}

async function selected(gallery, index, message) {
  assert.equal(await gallery.locator('.gallery-thumbnail').nth(index).getAttribute('aria-pressed'), 'true', message);
}

async function keyboardPath(page, gallery) {
  const opener = gallery.getByRole('button', {name: /Open full-size/});
  await opener.focus();
  // The next real tab stop is the first preview: no invisible or relocated action.
  for (const preview of await gallery.locator('.gallery-thumbnail').all()) {
    await page.keyboard.press('Tab');
    assert(await preview.evaluate(e => e === document.activeElement && e.matches(':focus-visible') &&
      getComputedStyle(e).outlineStyle !== 'none'), 'Each Tab reaches the next visibly focused preview');
  }
  await page.keyboard.press('Tab');
  assert(!await gallery.evaluate(e => e.contains(document.activeElement)), 'Tab leaves after the last preview');
}

export default async function checkGalleryControls(page) {
  await installPausedClock(page);
  for (const motion of ['no-preference', 'reduce']) {
    await page.emulateMedia({reducedMotion: motion});
    for (const width of [1366, 900, 390]) {
      await page.setViewportSize({width, height: 845});
      await page.reload();
      const galleries = await page.locator('.game-gallery').all();
      assert.equal(galleries.length, 6);
      for (const [index, gallery] of galleries.entries()) {
        await gallery.scrollIntoViewIfNeeded();
        await checkGalleryControlLayout(gallery); // Includes the initial videos.
        const player = await gallery.locator('iframe').count() ? await gallery.locator('iframe').elementHandle() : null;
        await gallery.locator('.gallery-thumbnail').first().hover();
        await checkGalleryControlLayout(gallery);
        await gallery.locator('.gallery-thumbnail').first().focus();
        await page.keyboard.press('Shift');
        await checkGalleryControlLayout(gallery);
        if (player) assert(await player.evaluate(e => e.isConnected), 'Hover/focus preserve the active player');
        await gallery.locator('.gallery-thumbnail').nth(1).click();
        await waitForPhoto(gallery);
        await checkGalleryControlLayout(gallery);
        await keyboardPath(page, gallery);
        await release(page);
        await gallery.scrollIntoViewIfNeeded();
        await page.clock.runFor(32);
        await page.waitForTimeout(100);
        const dwell = index < 2 ? 5000 : 6500;
        await page.clock.fastForward(motion === 'reduce' ? 20000 : dwell - 500);
        await selected(gallery, 1, 'Manual reduced-motion selection or full normal-motion dwell is retained');
        if (motion === 'reduce') {
          assert.equal(await gallery.locator('.gallery-photo').evaluate(e => getComputedStyle(e).animationName), 'none');
        } else {
          await page.clock.fastForward(700);
          await waitForPhoto(gallery);
          await selected(gallery, 2, 'Every normal-motion gallery keeps its existing photo interval');
        }
        await checkGalleryControlLayout(gallery);
        assert.equal(await page.locator('dialog').count(), 0, 'Tab navigation never opens inspection');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page overflow');
      }
    }
  }
  for (const motion of ['no-preference', 'reduce']) {
    await withBrowserContext(page.context().browser(), {viewport: {width: 390, height: 845}, hasTouch: true, isMobile: true,
      reducedMotion: motion}, async context => {
      const touchPage = await context.newPage();
      await installPausedClock(touchPage);
      await touchPage.goto(page.url());
      for (const [index, gallery] of (await touchPage.locator('.game-gallery').all()).entries()) {
        await gallery.scrollIntoViewIfNeeded();
        await checkGalleryControlLayout(gallery);
        await gallery.locator('.gallery-thumbnail').nth(1).tap();
        await waitForPhoto(gallery);
        await checkGalleryControlLayout(gallery);
        await keyboardPath(touchPage, gallery);
        // Tabbing out can scroll this gallery offscreen; return before timing it.
        await gallery.scrollIntoViewIfNeeded();
        await release(touchPage);
        assert(await gallery.evaluate(e => {
          const b = e.getBoundingClientRect();
          return b.bottom > 0 && b.top < innerHeight;
        }), 'Touch dwell starts with the gallery onscreen');
        await touchPage.clock.fastForward(motion === 'reduce' ? 20000 : (index < 2 ? 5200 : 6700));
        await selected(gallery, motion === 'reduce' ? 1 : 2, 'Touch retains motion-dependent progression without a slideshow action');
        await waitForPhoto(gallery);
        await checkGalleryControlLayout(gallery);
        assert(await touchPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
    });
  }
  console.log('PASS: six galleries without slideshow actions or focus stops; desktop/tablet/phone, hover, keyboard, touch, normal intervals and manual reduced motion');
}
