import assert from 'node:assert/strict';
import { reportViewports } from './report-viewports.mjs';
import { reportProgress } from './run-browser-check.mjs';

export default async function check(page) {
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Portfolio', exact: true }).click();
  assert.equal(await page.locator('.capture-media, .report-block, #android-reports, #pix-capture').count(), 0, 'Performance displays have left Portfolio');
  for (const [project, id] of [['.regulus-showcase', 'android-reports'], ['.pc-project', 'pix-capture']]) {
    const link = page.locator(project + ' .skill-evidence');
    assert.equal(await link.getAttribute('href'), '#/skills?evidence=' + id);
    await link.click();
    await page.waitForFunction(id => document.activeElement?.id === id, id);
    await nav.getByRole('link', { name: 'Portfolio', exact: true }).click();
  }
  await nav.getByRole('link', { name: 'Skills', exact: true }).click();
  assert.deepEqual(await page.locator('.performance-evidence h3').allTextContents(), ['Regulus the Advent', 'Vecchio Furioso']);
  assert.equal(await page.getByRole('heading', { name: 'Performance testing', exact: true }).count(), 1);
  assert.equal(await page.locator('.report-selector, .report-preview, .performance-evidence .gallery-thumbnails').count(), 0);
  for (const label of ['Very High', 'High', 'Medium', 'Low', 'Very Low', 'Overall'])
    assert.equal(await page.getByRole('button', { name: label, exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: /^View full report/ }).count(), 1);
  for (const [width, height] of reportViewports) {
    reportProgress('Evidence layout', { viewport: { width, height }, report: 'Very High' });
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    for (const [id, file] of [['android-reports', 'regulus-s10-very-high.png'], ['pix-capture', 'vecchio-furioso-pix.png']]) {
      const row = page.locator('#' + id);
      assert.equal(await row.count(), 1, 'Stable unique evidence target');
      const image = row.locator('.capture-media img');
      await image.evaluate(img => img.decode());
      assert((await image.getAttribute('src')).endsWith(file));
      const details = await row.locator('.performance-evidence-details').boundingBox();
      const bounds = await image.boundingBox();
      const natural = await image.evaluate(img => ({ width: img.naturalWidth, height: img.naturalHeight }));
      if (id === 'android-reports') assert.deepEqual(natural, { width: 1196, height: 735 }, 'Exact supplied screenshot dimensions');
      assert(Math.abs(bounds.width / bounds.height - natural.width / natural.height) < .01, 'Complete image framing');
      if (width <= 900) assert(bounds.y >= details.y + details.height, 'Mobile details above image');
      else assert(bounds.x >= details.x + details.width, 'Desktop details beside image');
      const opener = row.locator('.evidence-image-button');
      const button = await opener.boundingBox();
      assert(button.width >= 44 && button.height >= 44);
      await opener.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      await dialog.locator('img').evaluate(img => img.decode());
      assert.equal(await dialog.locator('a').getAttribute('href'), await image.getAttribute('src'));
      assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      assert(await opener.evaluate(e => e === document.activeElement));
    }
    const action = page.locator('#android-reports .evidence-open');
    const box = await action.boundingBox();
    assert(box.height >= 44 && box.width >= 44 && box.x + box.width <= width, 'Full report action fits');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  console.log('PASS: two ordered Skills evidence rows, exact screenshot, single report action, Portfolio links, image inspection and eleven responsive layouts');
}
