import assert from 'node:assert/strict';
import { waitForPhoto } from './gallery-photo-ready.mjs';

const projects = [
  { name: 'Regulus the Advent', selector: '.regulus-showcase', eyebrow: 'Project showcase / 01' },
  { name: 'Father, Son & Holy Guns', selector: '.video-project', eyebrow: 'Project showcase / 02' },
  { name: 'Vecchio Furioso', selector: '.pc-project', eyebrow: 'Project showcase / 03' },
];

async function precedes(before, after, message) {
  const target = await after.elementHandle();
  assert(await before.evaluate((element, target) =>
    !!(element.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING), target), message);
}

export async function checkProjectLayout(page) {
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(await page.locator('main .project-grid .project-title').allTextContents(), [
    'Regulus the Advent', 'Father, Son & Holy Guns', 'Vecchio Furioso',
    'Invictus: Lost Soul', 'The Collectors', 'MeowMoney',
  ], 'Complete configured Portfolio preserves the published showcase inventory and order');
  const narrow = page.viewportSize().width <= 900;
  for (const { name, selector, eyebrow } of projects) {
    const project = page.locator(selector);
    const heading = project.getByRole('heading', { name, exact: true });
    const context = project.getByText(eyebrow, { exact: true });
    const media = project.locator('.game-gallery');
    const details = project.locator('.project-details');
    assert.equal(await project.getAttribute('aria-labelledby'), await heading.getAttribute('id'), `${name}: named project`);
    await precedes(context, heading, `${name}: eyebrow stays before title`);
    await precedes(heading, media, `${name}: reading order puts title before media`);
    await precedes(media, details, `${name}: reading order puts complete media before details`);
    const title = await heading.boundingBox();
    const frame = await media.boundingBox();
    const info = await details.boundingBox();
    const caption = await context.boundingBox();
    assert(caption.y + caption.height <= title.y + 1, `${name}: eyebrow stays above title`);
    if (narrow) {
      assert(Math.abs(frame.y - title.y - title.height - 24) < 1, `${name}: natural heading/media gap`);
      assert(Math.abs(info.y - frame.y - frame.height - 24) < 1, `${name}: complete media precedes details with natural spacing`);
      assert(Math.abs(frame.x - info.x) < 1, `${name}: stacked alignment`);
    } else {
      assert(frame.x >= info.x + info.width, `${name}: desktop details-left/media-right`);
      assert(Math.abs(frame.y - caption.y) < 1, `${name}: desktop media starts beside heading`);
      assert(Math.abs(info.y - title.y - title.height - 16) < 1, `${name}: desktop title/details gap retained`);
    }
    const bounds = await project.boundingBox();
    assert(frame.width > 0 && frame.height > 0 && frame.x >= bounds.x - 1 &&
      frame.x + frame.width <= bounds.x + bounds.width + 1, `${name}: media stays inside project`);
    await checkOriginalImageFraming(media, name);
    {
      assert(await media.getByRole('group', { name: `${name} media gameplay previews`, exact: true }).isVisible());
      const viewer = await media.locator('.gallery-viewer').boundingBox();
      assert(Math.abs(viewer.width / viewer.height - 16 / 9) < .02, `${name}: gallery frame proportions`);
    }
    for (const control of await media.locator('button').all()) {
      const box = await control.boundingBox();
      assert(box.width >= 44 && box.height >= 44, `${name}: usable media action targets`);
    }
    const stores = project.locator('.store-links');
    if (await stores.count()) {
      await precedes(details, stores, `${name}: store reading order follows details`);
      const links = await stores.boundingBox();
      assert(links.y >= info.y + info.height, `${name}: stores follow details visually`);
    }
    if (name === 'Vecchio Furioso') {
      assert.equal(await project.locator('.capture-media').count(), 0, 'PIX has moved to Skills');
      assert.equal(await project.getByRole('link', { name: /Microsoft PIX GPU capture/ }).getAttribute('href'), '#/skills?evidence=pix-capture');
    }
  }
  assert.equal(await page.locator('.regulus-showcase .report-block, .regulus-showcase .capture-media').count(), 0);
  assert.equal(await page.locator('.regulus-showcase .skill-evidence').getAttribute('href'), '#/skills?evidence=android-reports');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page overflow');
}

async function checkOriginalImageFraming(media, name) {
  const frames = await media.locator('.gallery-photo img, .capture-media img').evaluateAll(async images => {
    const frames = [];
    for (const image of images) {
      let decodeError = '';
      try {
        await image.decode();
      } catch (error) {
        decodeError = error instanceof Error ? error.message : String(error);
      }
      if (!image.isConnected) continue;
      const box = image.getBoundingClientRect();
      frames.push({
        source: image.currentSrc || image.src,
        decodeError,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        width: box.width,
        height: box.height,
        objectFit: image.ownerDocument.defaultView.getComputedStyle(image).objectFit,
      });
    }
    return frames;
  });
  for (const frame of frames) {
    const detail = `${frame.source}; fit=${frame.objectFit}; displayed=${frame.width}x${frame.height}; ` +
      `original=${frame.naturalWidth}x${frame.naturalHeight}${frame.decodeError ? `; decode=${frame.decodeError}` : ''}`;
    assert(!frame.decodeError && frame.naturalWidth > 0 && frame.naturalHeight > 0 &&
      frame.width > 0 && frame.height > 0, `${name}: original image decodes and has a visible frame (${detail})`);
    const complete = frame.objectFit === 'contain' ||
      Math.abs(frame.width / frame.height - frame.naturalWidth / frame.naturalHeight) < .01;
    assert(complete, `${name}: complete original image framing (${detail})`);
  }
}

async function visibleFocus(page, locator) {
  assert(await locator.evaluate(element => element === document.activeElement && element.matches(':focus-visible') &&
    getComputedStyle(element).outlineStyle !== 'none' && parseFloat(getComputedStyle(element).outlineWidth) > 0),
  'Mobile keyboard action has visible focus');
}

export async function checkShowcaseResizeAndKeyboard(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const galleries = await page.getByRole('region', { name: / media$/ }).all();
  for (const [index, gallery] of galleries.entries()) {
    await gallery.locator('.gallery-thumbnail').nth(index + 1).click();
    await waitForPhoto(gallery);
  }
  await page.getByRole('button', { name: 'Low', exact: true }).click();
  const selections = await page.locator('.gallery-thumbnail[aria-pressed=true]').evaluateAll(
    elements => elements.map(element => element.getAttribute('aria-label')));
  const sources = await page.locator('.gallery-viewer img').evaluateAll(elements => elements.map(element => element.getAttribute('src')));
  for (const width of [900, 901, 390, 1366, 900]) {
    await page.setViewportSize({ width, height: 845 });
    await checkProjectLayout(page);
    assert.deepEqual(await page.locator('.gallery-thumbnail[aria-pressed=true]').evaluateAll(
      elements => elements.map(element => element.getAttribute('aria-label'))), selections, 'Resizing preserves both gallery selections');
    assert.deepEqual(await page.locator('.gallery-viewer img').evaluateAll(
      elements => elements.map(element => element.getAttribute('src'))), sources, 'Resizing preserves displayed photos');
    assert.equal(await page.getByRole('button', { name: 'Low', exact: true }).getAttribute('aria-pressed'), 'true', 'Resizing preserves report selection');
    assert((await page.locator('.report-output').getAttribute('aria-label')).startsWith('Low quality'), 'Report output follows retained selection');
  }
  for (const width of [390, 900]) {
    await page.setViewportSize({ width, height: 845 });
    for (const [index, gallery] of galleries.entries()) {
      const opener = gallery.getByRole('button', { name: /Open full-size/ });
      await opener.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await visibleFocus(page, opener);
      await page.keyboard.press('Enter');
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      await visibleFocus(page, opener);
      const slideshow = gallery.getByRole('button', { name: /slideshow/ });
      await page.keyboard.press('Tab');
      await visibleFocus(page, slideshow);
      await page.keyboard.press('Enter');
      assert.equal(await slideshow.textContent(), 'Pause slideshow', 'Keyboard Resume enables progression');
      await page.keyboard.press('Enter');
      assert.equal(await slideshow.textContent(), 'Resume slideshow', 'Keyboard Pause disables progression');
      const previews = gallery.locator('.gallery-thumbnail');
      for (const preview of await previews.all()) {
        await page.keyboard.press('Tab');
        await visibleFocus(page, preview);
      }
      // Let focus-driven browsing reveal the final thumbnail before leaving the strip.
      await page.waitForFunction(name => {
        const gallery = [...document.querySelectorAll('.game-gallery')].find(element => element.getAttribute('aria-label') === name);
        const strip = gallery.querySelector('.gallery-thumbnails');
        const last = strip.lastElementChild.getBoundingClientRect();
        const bounds = strip.getBoundingClientRect();
        return last.left >= bounds.left - 1 && last.right <= bounds.right + 1;
      }, await gallery.getAttribute('aria-label'));
      await page.keyboard.press('Tab');
      assert(!await gallery.evaluate(element => element.contains(document.activeElement)), 'Tab leaves the final preview without replacement focus stops');
      const next = index === 0 ? page.getByRole('link', { name: 'Regulus the Advent on the App Store ↗' }) : index === 1 ?
        galleries[2].getByRole('button', { name: /Open full-size/ }) :
        page.getByRole('link', { name: 'Vecchio Furioso on Steam ↗' });
      await visibleFocus(page, next);
      if (index === 0) {
        await page.keyboard.press('Tab');
        await visibleFocus(page, page.getByRole('link', { name: 'Regulus the Advent on Google Play ↗' }));
        await page.keyboard.press('Tab');
        await visibleFocus(page, page.locator('.regulus-showcase .skill-evidence'));
      }
    }
    const evidenceLink = page.locator('.pc-project').getByRole('link', { name: /Microsoft PIX GPU capture/ });
    await page.keyboard.press('Tab');
    await visibleFocus(page, evidenceLink);
    await page.keyboard.press('Tab');
    await visibleFocus(page, page.locator('.placeholder-project').first().getByRole('button', { name: /Open full-size/ }));
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  console.log('PASS: showcase reading/keyboard order, visible focus, modal restoration and selection continuity across 900px in both directions');
}
