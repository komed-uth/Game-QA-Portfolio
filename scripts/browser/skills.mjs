import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// Ticket #75: inspect the rendered visitor experience, including existing evidence.
export default async function check(page) {
  const base = new URL(page.url());
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  const skills = nav.getByRole('link', { name: 'Skills', exact: true });
  const portfolio = nav.getByRole('link', { name: 'Portfolio', exact: true });
  async function visit(hash) {
    const destination = new URL(base);
    destination.hash = hash;
    await page.goto(destination.href);
  }
  async function checkSkills() {
    await page.getByRole('heading', { name: 'Skills', exact: true }).waitFor();
    await page.waitForFunction(() => document.title === "Skills · Komed's Portfolio");
    assert.equal(new URL(page.url()).hash, '#/skills');
    assert.equal(await skills.getAttribute('aria-current'), 'page');
    assert.equal(await nav.getByRole('link', { name: 'QA approach', exact: true }).count(), 0);
    assert.deepEqual(await page.getByRole('main').getByRole('heading', { level: 2 }).allTextContents(),
      ['QA capabilities', 'Tools & technologies', 'QA workflow', 'Planned gameplay coverage']);
    const workflow = page.getByRole('region', { name: 'QA workflow' });
    assert.deepEqual(await workflow.getByRole('heading', { level: 3 }).allTextContents(),
      ['Requirements', 'Test design', 'Execution', 'Investigation', 'Bug reports', 'Regression', 'Test summary']);
    assert.deepEqual(await workflow.locator('li > span').allTextContents(), ['01', '02', '03', '04', '05', '06', '07']);
    const coverage = page.getByRole('region', { name: 'Planned gameplay coverage' });
    assert.deepEqual(await coverage.getByRole('listitem').allTextContents(), ['Player movement', 'Combat', 'Checkpoints',
      'Death & respawn', 'Save/load', 'UI navigation', 'Inventory', 'Game state transitions', 'Visual graphics']);
    assert(await coverage.getByText('Work in progress', { exact: true }).isVisible());
    assert(await coverage.getByText(/Project association awaits owner confirmation/).isVisible());
    assert(await page.getByText(/Development draft — personal skill/).isVisible());
    for (const name of ['Unity', 'Git', 'GitHub', 'SourceTree', 'Jira', 'C#', 'Codex']) {
      const item = page.getByRole('region', { name: 'Tools & technologies' }).getByRole('listitem')
        .filter({ has: page.getByRole('heading', { name, exact: true }) });
      assert(await item.getByText(/description of actual use/).isVisible());
      assert(await item.getByText('Development draft · awaiting confirmation', { exact: true }).isVisible());
    }
    assert.equal(await page.getByRole('progressbar').count(), 0);
  }
  await visit('/skills');
  await checkSkills();
  await page.reload();
  await checkSkills();
  await visit('/about');
  await checkSkills();
  await page.reload();
  await checkSkills();
  await portfolio.click();
  await page.getByRole('heading', { name: 'Regulus the Advent', exact: true }).waitFor();
  await page.evaluate(() => scrollTo(0, 700));
  await skills.click();
  await checkSkills();
  await page.waitForFunction(() => scrollY === 0);
  await page.goBack();
  await page.getByRole('heading', { name: 'Regulus the Advent', exact: true }).waitFor();
  assert.equal(await portfolio.getAttribute('aria-current'), 'page');
  await page.goForward();
  await checkSkills();
  // The replaced legacy entry returns to Portfolio rather than trapping Back.
  await visit('/');
  await page.evaluate(() => { location.hash = '/about'; });
  await checkSkills();
  await page.goBack();
  await page.getByRole('heading', { name: 'Regulus the Advent', exact: true }).waitFor();
  await skills.click();

  for (const region of ['QA capabilities', 'Tools & technologies']) {
    const descriptions = page.getByRole('region', { name: region });
    for (const [name, evidence, opener, title] of [
      ['Regulus the Advent · Android performance reports', 'android-reports',
        'Open Very High quality — Samsung Galaxy S10 Performance Advisor report',
        'Very High quality — Samsung Galaxy S10 Performance Advisor report'],
      ['Vecchio Furioso · Microsoft PIX GPU capture', 'pix-capture',
        'Open full-size Microsoft PIX capture for Vecchio Furioso', 'Vecchio Furioso · Microsoft PIX capture'],
    ]) {
      await descriptions.getByRole('link', { name: name + ' →', exact: true }).click();
      assert.equal(new URL(page.url()).hash, '#/?evidence=' + evidence);
      await page.waitForFunction(id => document.activeElement?.id === id, evidence);
      const target = page.locator('#' + evidence);
      const box = await target.boundingBox();
      assert(box.y >= -1 && box.y < page.viewportSize().height, 'Link reveals its relevant evidence');
      await page.reload();
      await page.waitForFunction(id => document.activeElement?.id === id, evidence);
      await target.getByRole('button', { name: opener, exact: true }).first().click();
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      await dialog.waitFor();
      if (evidence === 'android-reports') {
        const frame = await (await dialog.locator('iframe').elementHandle()).contentFrame();
        await frame.waitForLoadState();
        assert((await frame.locator('svg').count()) > 0, 'Android link reaches the supplied report charts');
      } else {
        await dialog.locator('img').evaluate(image => image.decode());
        assert.match(await dialog.locator('img').getAttribute('src'), /vecchio-furioso-pix\.png$/);
      }
      await dialog.getByRole('button', { name: 'Close evidence', exact: true }).click();
      await dialog.waitFor({ state: 'detached' });
      await skills.click();
      await checkSkills();
    }
  }

  await mkdir('.scratch/issue75-visuals', { recursive: true });
  for (const [width, height] of [[1920,1080], [1366,768], [390,845], [845,390], [360,840],
    [840,360], [1200,800], [800,1200], [899,700], [901,700], [320,700]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await checkSkills();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Skills has no horizontal overflow');
    for (const link of await nav.getByRole('link').all()) {
      const box = await link.boundingBox();
      assert(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width,
        'Visible navigation fits and retains 44px targets');
    }
    const linkedIn = page.getByRole('link', { name: 'Komed Uthisanont on LinkedIn (opens in a new tab)', exact: true });
    assert.match(await linkedIn.getAttribute('href'), /^https:\/\/www\.linkedin\.com\/in\//);
    await portfolio.focus();
    await page.keyboard.press('Tab');
    assert(await skills.evaluate(element => element === document.activeElement && element.matches(':focus-visible') &&
      getComputedStyle(element).outlineStyle !== 'none' && parseFloat(getComputedStyle(element).outlineWidth) > 0));
    await page.keyboard.press('Tab');
    assert(await linkedIn.evaluate(element => element === document.activeElement), 'LinkedIn remains after page links');
    await portfolio.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: 'Regulus the Advent', exact: true }).waitFor();
    await skills.focus();
    await page.keyboard.press('Enter');
    await checkSkills();
    const skip = page.getByRole('link', { name: 'Skip to content', exact: true });
    await skip.focus();
    assert((await skip.boundingBox()).y >= 0, 'Focused skip link is visible');
    await page.keyboard.press('Enter');
    assert(await page.getByRole('main').evaluate(element => element === document.activeElement));
    if (width === 1366 || width === 360) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `.scratch/issue75-visuals/skills-${width}.png`, fullPage: true });
    }
  }
  console.log('PASS: Skills section order, seven numbered steps, nine planned systems, draft distinctions, legacy redirect, reload/history, four evidence links and inspection, keyboard/skip/scroll, eleven layouts and narrow/wide captures');
}
