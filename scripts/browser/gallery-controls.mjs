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

export default async function checkGalleryControls(page) {
  await installPausedClock(page);
  await page.setViewportSize({width: 1366, height: 12000});
  for (const motion of ['no-preference', 'reduce']) {
    await page.emulateMedia({reducedMotion: motion});
    await page.reload();
    const galleries = await page.locator('.game-gallery').all();
    assert.equal(galleries.length, 5);
    // Explicit pause persists across manual selection in every gallery.
    for (const gallery of galleries) {
      await checkGalleryControlLayout(gallery);
      const player = await gallery.locator('iframe').count() ? await gallery.locator('iframe').elementHandle() : null;
      if (motion === 'no-preference') await gallery.getByRole('button', {name: 'Pause slideshow', exact: true}).click();
      if (player) assert(await player.evaluate(e => e.isConnected), 'Overlay activation preserves player identity');
      await gallery.locator('.gallery-thumbnail').nth(1).click();
      await waitForPhoto(gallery);
      await checkGalleryControlLayout(gallery);
      assert.equal(await gallery.getByRole('button', {name: 'Resume slideshow', exact: true}).count(), 1);
    }
    await release(page);
    await page.clock.fastForward(20000);
    for (const gallery of galleries) await selected(gallery, 1, 'Paused selection survives more than a dwell');
    for (let actor = 0; actor < galleries.length; actor++) {
      const gallery = galleries[actor];
      const control = gallery.locator('.gallery-slideshow-control');
      await control.focus();
      await page.keyboard.press('Enter');
      assert(await control.evaluate(e => e.matches(':focus-visible') && getComputedStyle(e).outlineStyle !== 'none'),
        'Keyboard activation has visible focus');
      await page.clock.fastForward(20000);
      await selected(gallery, 1, 'Resume waits for keyboard inspection to clear');
      await release(page);
      const dwell = actor < 2 ? 5000 : 6500;
      await page.clock.fastForward(dwell - 500);
      await selected(gallery, 1, 'Resume starts a full existing interval');
      await page.clock.fastForward(700);
      await waitForPhoto(gallery);
      await selected(gallery, 2, 'Resume enables progression, including under reduced motion');
      if (motion === 'reduce') assert.equal(await gallery.locator('.gallery-photo').evaluate(e => getComputedStyle(e).animationName), 'none');
      await gallery.getByRole('button', {name: 'Pause slideshow', exact: true}).click();
      for (let other = 0; other < galleries.length; other++) {
        await selected(galleries[other], other <= actor ? 2 : 1, 'Pause/Resume affects only its own mounted gallery');
      }
      assert.equal(await page.locator('dialog').count(), 0, 'Overlay never opens image inspection');
    }
  }
  await withBrowserContext(page.context().browser(), {viewport: {width: 390, height: 845}, hasTouch: true, isMobile: true}, async context => {
    const touchPage = await context.newPage();
    await installPausedClock(touchPage);
    await touchPage.goto(page.url());
    for (const gallery of await touchPage.locator('.game-gallery').all()) {
      await gallery.getByRole('button', {name: 'Pause slideshow', exact: true}).tap();
      await gallery.locator('.gallery-thumbnail').nth(1).tap();
      await waitForPhoto(gallery);
      const control = gallery.locator('.gallery-slideshow-control');
      await checkGalleryControlLayout(gallery);
      // A horizontal pointer sequence originating on the overlay is not a photo swipe.
      await control.dispatchEvent('pointerdown', {pointerId: 90, pointerType: 'touch', isPrimary: true, button: 0, clientX: 200, clientY: 50});
      await control.dispatchEvent('pointermove', {pointerId: 90, pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 50});
      await control.dispatchEvent('pointerup', {pointerId: 90, pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 50});
      await selected(gallery, 1, 'Overlay gesture cannot select another photo');
      await release(touchPage);
      await touchPage.clock.fastForward(10000);
      await selected(gallery, 1, 'Touch pause survives manual selection');
      await control.tap();
      await release(touchPage);
      await touchPage.clock.fastForward(6700);
      await waitForPhoto(gallery);
      await selected(gallery, 2, 'Real touch Resume enables photo progression');
      assert.equal(await touchPage.locator('dialog').count(), 0);
      assert(await touchPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  });
  console.log('PASS: all five overlay controls, independent pause/resume, persistent manual pause, keyboard focus, reduced-motion Resume and touch gesture isolation');
}
