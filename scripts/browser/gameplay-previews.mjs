import assert from "node:assert/strict";

async function drag(page, locator, from, to) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 12 });
  await page.mouse.up();
}
async function selected(gallery) {
  return gallery.locator('.gallery-thumbnail[aria-pressed="true"]').getAttribute('aria-label');
}
async function waitForScroll(page) {
  await page.waitForTimeout(400);
}

export default async function checkGameplay(page) {
  for (const motion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const [width, height] of [[360,840],[390,845],[845,390],[840,360],[800,1200],[1200,800],[899,700],[901,700],[1366,768],[1920,1080]]) {
      await page.setViewportSize({ width, height });
      for (const gallery of await page.locator('.game-gallery').all()) {
        const previews = gallery.locator('.gallery-thumbnail');
        const strip = gallery.locator('.gallery-thumbnails');
        await previews.first().click();
        assert.equal(await previews.count(), 4);
        assert.equal(await gallery.locator('.gallery-dots').count(), 0);
        assert.equal(await gallery.getByRole('button', { name: /previous media|next media/ }).count(), 0);
        const iframe = await gallery.locator('iframe').elementHandle();
        await iframe.evaluate(element => { element.dataset.continuity = 'active'; });
        const initial = await selected(gallery);
        if (width <= 390) {
          await strip.evaluate(element => element.scrollLeft = 0);
          await waitForScroll(page);
          const boxes = await previews.evaluateAll(elements => elements.map(e => e.getBoundingClientRect().toJSON()));
          const box = await strip.boundingBox();
          assert(boxes[2].right <= box.x + box.width + 1, 'Three complete phone previews');
          assert(boxes[3].left < box.x + box.width && boxes[3].right > box.x + box.width, 'Partial next preview');
          const backward = gallery.getByRole('button', { name: /scroll previews backward/ });
          const forward = gallery.getByRole('button', { name: /scroll previews forward/ });
          assert(await backward.isDisabled());
          for (const arrow of [backward,forward]) { const bounds = await arrow.boundingBox(); assert(bounds.width >= 44 && bounds.height >= 44); }
          await forward.click();
          await waitForScroll(page);
          assert(await forward.isDisabled(), 'Finite forward end');
          assert.equal(await selected(gallery), initial);
          await backward.click();
          await waitForScroll(page);
          await strip.scrollIntoViewIfNeeded();
          await strip.hover();
          await page.mouse.wheel(100, 0);
          await waitForScroll(page);
          assert(await strip.evaluate(e => e.scrollLeft > 0), 'Horizontal wheel browses previews');
          assert.equal(await selected(gallery), initial);
          await strip.evaluate(e => e.scrollLeft = 0);
          await drag(page, strip, [.5,.3], [.1,.3]);
          assert(await strip.evaluate(e => e.scrollLeft > 0), 'Mouse drag browses previews');
          assert.equal(await selected(gallery), initial, 'Dragging does not select');
          assert.equal(await page.locator('dialog').count(), 0);
          await strip.evaluate(e => e.scrollLeft = 0);
          const releasedBox = await strip.boundingBox();
          await page.mouse.move(releasedBox.x + releasedBox.width * .5, releasedBox.y + 20);
          await page.mouse.down();
          await page.mouse.move(releasedBox.x + releasedBox.width * .5, releasedBox.y - 15);
          await page.mouse.up();
          await page.mouse.move(releasedBox.x + releasedBox.width * .2, releasedBox.y + 20);
          await page.mouse.move(releasedBox.x + releasedBox.width * .8, releasedBox.y + 20, { steps: 8 });
          assert.equal(await strip.evaluate(e => e.scrollLeft), 0, 'Release outside strip ends mouse browsing');
          // Native scrollbar track/thumb remain draggable below the previews.
          await strip.evaluate(e => e.scrollLeft = 0);
          const scrollbarBox = await strip.boundingBox();
          const metrics = await strip.evaluate(e => ({ height: e.clientHeight, total: e.offsetHeight }));
          assert(metrics.total > metrics.height, "Overflowing previews have a visible scrollbar");
          {
            await page.mouse.move(scrollbarBox.x + 15, scrollbarBox.y + metrics.height + (metrics.total - metrics.height) / 2);
            await page.mouse.down();
            await page.mouse.move(scrollbarBox.x + scrollbarBox.width - 15, scrollbarBox.y + metrics.height + (metrics.total - metrics.height) / 2, { steps: 10 });
            await page.mouse.up();
            assert(await strip.evaluate(e => e.scrollLeft > 0), 'Native scrollbar browses previews');
            assert.equal(await selected(gallery), initial);
          }
        } else {
          assert.equal(await gallery.locator('.gallery-controls').count(), 0, 'Fitting previews hide controls');
        }
        await previews.first().click();
        assert(await iframe.evaluate(e => e.isConnected && e.dataset.continuity === 'active'), 'Browsing and active-video reselection preserve player identity');
        await previews.first().focus();
        await page.keyboard.press('End');
        await waitForScroll(page);
        assert(await previews.last().evaluate(e => e === document.activeElement));
        assert.equal(await selected(gallery), initial, 'Focus does not select');
        const visible = await previews.last().evaluate(e => {
          const p=e.parentElement.getBoundingClientRect(), b=e.getBoundingClientRect(); return b.left >= p.left-1 && b.right <= p.right+1;
        });
        assert(visible, 'Keyboard focus reveals its preview');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Enter');
        assert.equal(await selected(gallery), await previews.nth(2).getAttribute('aria-label'));
        assert((await gallery.locator('.gallery-caption').innerText()).includes('3 / 4'));
        await page.keyboard.press('Home');
        assert.equal(await selected(gallery), await previews.nth(2).getAttribute('aria-label'));
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Space');
        assert((await gallery.locator('.gallery-caption').innerText()).includes('2 / 4'));
        const image=gallery.locator('.gallery-viewer img');
        await image.evaluate(e => e.decode());
        assert.equal(await image.evaluate(e => getComputedStyle(e).objectFit), 'contain');
        assert(await image.getAttribute('alt'));
        // Both galleries retain independent selection (verified separately below).
        assert.equal(await page.locator('dialog').count(),0);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page horizontal overflow');
    }
    await page.setViewportSize({width:390,height:845});
    for (const gallery of await page.locator('.game-gallery').all()) {
      const previews=gallery.locator('.gallery-thumbnail');
      await previews.first().click();
      await waitForScroll(page);
      await previews.first().focus();
      await page.keyboard.press('End');
      await page.keyboard.press('Home');
      await waitForScroll(page);
      assert(await previews.first().evaluate(e => {
        const bounds=e.getBoundingClientRect(), strip=e.parentElement.getBoundingClientRect();
        return e === document.activeElement && bounds.left >= strip.left-1 && bounds.right <= strip.right+1;
      }), 'Latest keyboard target cancels obsolete smooth scrolling');
      assert.equal(await previews.first().getAttribute('aria-pressed'), 'true', 'Rapid focus navigation does not select');
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Home');
      await page.keyboard.press('Enter');
      await waitForScroll(page);
      assert.equal(await previews.first().getAttribute('aria-pressed'), 'true', 'Latest rapid selection wins');
      assert((await gallery.locator('.gallery-caption').innerText()).includes('1 / 4'));
      assert(await previews.first().evaluate(e => {
        const bounds=e.getBoundingClientRect(), strip=e.parentElement.getBoundingClientRect();
        return bounds.left >= strip.left-1 && bounds.right <= strip.right+1;
      }), 'Latest selected preview stays visible after obsolete scrolling');
      await page.keyboard.press('End');
      await page.waitForTimeout(100);
      const strip=gallery.locator('.gallery-thumbnails');
      await drag(page,strip,[.2,.3],[.8,.3]);
      await waitForScroll(page);
      assert.equal(await strip.evaluate(e => e.scrollLeft), 0, 'Pointer browsing works after keyboard navigation');
      assert.equal(await previews.first().getAttribute('aria-pressed'), 'true', 'Pointer browsing does not select');
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  const galleries=await page.locator('.game-gallery').all();
  const secondSelection=await selected(galleries[1]);
  await galleries[0].locator('.gallery-thumbnail').last().click();
  const surface=galleries[0].locator('.gallery-viewer');
  await drag(page,surface,[.8,.5],[.2,.5]);
  assert((await galleries[0].locator('.gallery-caption').innerText()).includes('1 / 4'), 'Left swipe wraps to video');
  await galleries[0].locator('.gallery-thumbnail').nth(1).click();
  await drag(page,surface,[.2,.5],[.8,.5]);
  assert((await galleries[0].locator('.gallery-caption').innerText()).includes('1 / 4'), 'Right swipe goes back to video');
  assert.equal(await selected(galleries[1]),secondSelection, 'Projects remain independent');
  assert.equal(await page.locator('dialog').count(),0,'Swipe never opens image');
  await galleries[0].locator('.gallery-thumbnail').last().click();
  await page.setViewportSize({width:390,height:845});
  await waitForScroll(page);
  assert((await galleries[0].locator('.gallery-caption').innerText()).includes('4 / 4'), 'Resize retains selection');
  console.log('PASS: gameplay strip phone peek, finite arrows, drag/wheel/scrollbar browsing, player continuity, keyboard, swipe direction, independence and ten viewports in normal/reduced motion');
}
