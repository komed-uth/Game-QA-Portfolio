import assert from 'node:assert/strict';
import { checkCoverageRemoval, checkRegulusTransition } from './homepage-footer.mjs';
import { captureRegion } from './capture-region.mjs';

// Ticket #77: compare rendered copy with the owner-approved issue text.
const capabilities = [
  ['Functional, compatibility, and regression testing', 'Experience testing games across mobile, Windows PC, and WebGL.'],
  ['Performance investigation', 'Collaborated with technical artists to identify bottlenecks on low-end devices. Portfolio examples include Android profiling with ARM Streamline and PC GPU analysis with Microsoft PIX.'],
  ['Defect investigation and reporting', 'Documented bugs in detail and worked with developers to investigate them.'],
  ['Gameplay balance testing', 'Worked with designers to test character builds and boss encounters.'],
  ['QA coordination', 'Coordinated planning, requirements analysis, and task allocation for 3–4 QA colleagues on Project Regulus.'],
  ['Internal tooling', 'Used basic JavaScript in Google Apps Script to build a Google Sheets tool for managing Jira ticket data.'],
];
const tools = [
  ['Jira', 'Working with QA ticket information.'],
  ['Google Sheets and Google Apps Script', 'Managing ticket data and building internal workflow tools.'],
  ['Jenkins', 'Verifying frontend and backend build results, adjusting settings, and downloading builds for testing.'],
  ['ARM Streamline', 'Android performance profiling.'],
  ['Microsoft PIX', 'PC GPU capture and rendering analysis.'],
  ['Unity', 'Engine experience, including programming a university mixed-reality VR karaoke project.'],
  ['Codex', 'Creating custom skills to support internal work.'],
];

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
    assert.deepEqual(await nav.getByRole('link').allTextContents(), ['Portfolio', 'Skills', 'About me']);
    const main = page.getByRole('main');
    await checkCoverageRemoval(page);
    assert.deepEqual(await main.getByRole('heading', { level: 2 }).allTextContents(),
      ['QA capabilities', 'Tools']);
    for (const [region, copy] of [['QA capabilities', capabilities], ['Tools', tools]]) {
      const group = main.getByRole('region', { name: region, exact: true });
      assert.deepEqual(await group.getByRole('heading', { level: 3 }).allTextContents(), copy.map(([title]) => title));
      assert.deepEqual(await group.locator('li > p').allTextContents(), copy.map(([, description]) => description));
    }
    assert.doesNotMatch(await main.innerText(), /Interests and development|Player psychology|neuroscience|Unreal Engine|automated testing in games/i);
    assert.doesNotMatch(await main.innerText(), /Development draft|awaiting confirmation|QA approach|QA workflow|Planned gameplay coverage|Work in progress|\bFPS\b|\bexpert\b|\d+%/i);
    assert.equal(await main.getByRole('list').count(), 2, 'No numbered workflow');
    assert.equal(await main.getByRole('link').count(), 4, 'Only the four available performance evidence links');
    assert.equal(await page.getByRole('progressbar').count(), 0);
  }

  for (const [route, heading] of [['/about-me', 'About me'], ['/unknown-portfolio-route', 'Regulus the Advent']]) {
    await visit(route);
    await page.getByRole('heading', { name: heading, exact: true }).waitFor();
    await checkCoverageRemoval(page);
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
  await checkRegulusTransition(page);
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

  for (const region of ['QA capabilities', 'Tools']) {
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

  for (const [width, height] of [[1920,1080], [1366,768], [390,845], [845,390], [360,840],
    [840,360], [1200,800], [800,1200], [899,700], [901,700], [320,700]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await checkSkills();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Skills has no horizontal overflow');
    assert(await page.getByRole('main').evaluate(element => [...element.querySelectorAll('h1, h2, h3, p, a')]
      .every(node => node.scrollWidth <= node.clientWidth)), 'Approved Skills copy wraps without clipping');
    for (const link of await page.getByRole('main').getByRole('link').all()) {
      const box = await link.boundingBox();
      assert(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width,
        'Evidence links fit and retain 44px targets');
    }
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
    const aboutMe = nav.getByRole('link', { name: 'About me', exact: true });
    assert(await aboutMe.evaluate(element => element === document.activeElement), 'About me remains after Skills');
    await page.keyboard.press('Tab');
    assert(await linkedIn.evaluate(element => element === document.activeElement), 'LinkedIn remains after page links');
    await portfolio.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: 'Regulus the Advent', exact: true }).waitFor();
    await checkRegulusTransition(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Portfolio has no horizontal overflow');
    if (width === 1366 || width === 360) {
      await captureRegion(page, { selectors: ['#android-reports', '#father-son-showcase-title'], path: `.scratch/issue88-visuals/transition-${width}.png` });
    }
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
      await captureRegion(page, { selectors: ['html'], path: `.scratch/issue77-visuals/skills-${width}.png` });
    }
  }
  console.log('PASS: approved Skills copy/order, planned coverage absent and normal Regulus transition, legacy redirect, reload/history, four evidence links and inspection, keyboard/skip/scroll, eleven layouts and narrow/wide captures');
}
