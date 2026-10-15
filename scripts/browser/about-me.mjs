import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { captureRegion } from './capture-region.mjs';

const copy = [
  ['Professional introduction', 'I’m Komed Uthisanot, a Game QA Engineer with experience testing games across iOS, Android, Windows PC, and WebGL.'],
  ['Background', 'My game QA experience began in 2019 at Jumbojumps (True Axion Interactive), where my responsibilities as a Junior QA Engineer included functional, compatibility, performance, and regression testing. On Project Regulus, I coordinated QA planning, requirements analysis, and task allocation for 3–4 QA colleagues. I also collaborated with developers, technical artists, and designers on defect investigation, performance bottlenecks, and gameplay balance.'],
];
const headings = [...copy.map(([title]) => title), 'Contact'];
const profile = 'https://www.linkedin.com/in/komed-uthisanont-592388187/';

async function about(page) {
  await page.getByRole('heading', { name: 'About me', exact: true }).waitFor();
  await page.waitForFunction(() => document.title === "About me · Komed's Portfolio");
  const main = page.getByRole('main');
  assert.deepEqual(await main.getByRole('heading', { level: 2 }).allTextContents(), headings);
  assert.deepEqual(await main.locator('.approach-section h2').evaluateAll(nodes => nodes.map(node => node.id)), [
    'introduction-heading', 'background-heading', 'contact-heading',
  ]);
  for (const [name, description] of copy) {
    assert.equal(await main.getByRole('region', { name, exact: true }).locator('p').innerText(), description);
  }
  assert.doesNotMatch(await main.innerText(), /Development draft|awaiting confirmation|Personal gaming detail|\bFPS\b|\bpresent\b|\bcurrently employed\b/i);
  assert.equal(await main.locator('img, iframe, form, input, a[download]').count(), 0);
  assert.equal(await main.getByRole('link').count(), 3);
  const contactRegion = main.getByRole('region', { name: 'Contact', exact: true });
  assert.deepEqual(await contactRegion.getByRole('term').allTextContents(), ['Email', 'Phone', 'LinkedIn']);
  assert.deepEqual(await contactRegion.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href'))), [
    'mailto:komed.uth@gmail.com', 'tel:+66999674270', profile,
  ]);
  for (const name of ['komed.uth@gmail.com', '+66 99 967 4270']) {
    const link = contactRegion.getByRole('link', { name, exact: true });
    assert.equal(await link.innerText(), name);
    assert.equal(await link.getAttribute('target'), null);
    assert(await link.evaluate(element => {
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      const selected = selection.toString() === element.textContent && getComputedStyle(element).userSelect !== 'none';
      selection.removeAllRanges();
      return selected;
    }), 'Contact text is selectable');
  }
  const contact = main.getByRole('link', { name: 'Contact me on LinkedIn ↗' });
  assert.equal(await contact.getAttribute('href'), profile);
  assert.equal(await contact.getAttribute('target'), '_blank');
  assert.match(await contact.getAttribute('rel'), /noopener/);
  assert.match(await contact.getAttribute('rel'), /noreferrer/);
  assert.equal(await page.getByRole('link', { name: 'Komed Uthisanont on LinkedIn ↗' }).getAttribute('href'), profile);
  assert.equal(await page.locator('footer').getAttribute('aria-label'), 'Portfolio footer');
  assert.equal(await page.locator('footer').innerText(), "Komed's Portfolio");
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  assert.deepEqual(await nav.getByRole('link').allTextContents(), ['Portfolio', 'Skills', 'About me']);
  assert.equal(await nav.getByRole('link', { name: 'About me', exact: true }).getAttribute('aria-current'), 'page');
  assert.equal(await nav.locator('[aria-current="page"]').count(), 1);
}

async function focusVisible(link) {
  assert(await link.evaluate(element => element === document.activeElement && element.matches(':focus-visible') &&
    parseFloat(getComputedStyle(element).outlineWidth) >= 2 && getComputedStyle(element).outlineStyle !== 'none'));
}

export default async function check(page) {
  const home = page.url();
  const direct = new URL(home);
  direct.hash = '/about-me';
  await page.goto(direct.href);
  await about(page);
  await page.reload();
  await about(page);
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('link', { name: 'Portfolio', exact: true }).click();
  await page.getByRole('heading', { name: 'Regulus the Advent', exact: true }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForFunction(() => scrollY > 0);
  await nav.getByRole('link', { name: 'Skills', exact: true }).focus();
  await page.keyboard.press('Tab');
  await focusVisible(nav.getByRole('link', { name: 'About me', exact: true }));
  await page.keyboard.press('Enter');
  await about(page);
  await page.waitForFunction(() => scrollY === 0);
  await page.goBack();
  await page.getByRole('heading', { name: 'Regulus the Advent', exact: true }).waitFor();
  await page.goForward();
  await about(page);
  await page.reload();
  await about(page);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await focusVisible(skip);
  await page.keyboard.press('Enter');
  assert(await page.getByRole('main').evaluate(element => document.activeElement === element));
  // Observe native application requests without launching email or calling software.
  await page.evaluate(() => {
    window.contactRequests = [];
    document.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (link && /^(mailto:|tel:)/.test(link.href)) {
        event.preventDefault();
        window.contactRequests.push(link.href);
      }
    });
  });
  await page.getByRole('main').focus();
  for (const [name, destination] of [
    ['komed.uth@gmail.com', 'mailto:komed.uth@gmail.com'],
    ['+66 99 967 4270', 'tel:+66999674270'],
  ]) {
    await page.keyboard.press('Tab');
    const link = page.getByRole('link', { name, exact: true });
    await focusVisible(link);
    await page.evaluate(() => { window.contactRequests = []; });
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(() => window.contactRequests), [destination]);
    await link.click();
    assert.deepEqual(await page.evaluate(() => window.contactRequests), [destination, destination]);
    await link.focus();
  }
  await page.keyboard.press('Tab');
  const contact = page.getByRole('link', { name: /Contact me on LinkedIn/ });
  await focusVisible(contact);
  // Verify activation and destination without depending on LinkedIn availability.
  await page.context().route('https://www.linkedin.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>LinkedIn contact boundary</h1>' }));
  const popupPromise = page.waitForEvent('popup');
  await page.keyboard.press('Enter');
  const popup = await popupPromise;
  await popup.waitForLoadState();
  assert.equal(popup.url(), profile);
  await popup.close();
  const headerContact = page.getByRole('link', { name: 'Komed Uthisanont on LinkedIn ↗' });
  await headerContact.focus();
  await focusVisible(headerContact);
  const headerPopupPromise = page.waitForEvent('popup');
  await page.keyboard.press('Enter');
  const headerPopup = await headerPopupPromise;
  await headerPopup.waitForLoadState();
  assert.equal(headerPopup.url(), profile);
  await headerPopup.close();
  for (const name of ['Portfolio', 'Skills', 'About me']) {
    await nav.getByRole('link', { name, exact: true }).click();
    assert.equal(await headerContact.getAttribute('href'), profile);
    assert.equal(await headerContact.getAttribute('target'), '_blank');
    if (name !== 'About me') assert.equal(await page.getByRole('link', { name: 'komed.uth@gmail.com', exact: true }).count(), 0);
  }
  const legacy = new URL(home);
  legacy.hash = '/about';
  await page.goto(legacy.href);
  await page.getByRole('heading', { name: 'QA capabilities', exact: true }).waitFor();
  await page.waitForFunction(() => document.title === "Skills · Komed's Portfolio");
  assert.equal(await nav.getByRole('link', { name: 'Skills', exact: true }).getAttribute('aria-current'), 'page');
  assert.equal(new URL(page.url()).hash, '#/skills');
  assert.equal(await page.getByRole('heading', { name: 'About me', exact: true }).count(), 0);

  for (const width of [320, 360, 390, 640, 768, 900, 960, 961, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(direct.href);
    await about(page);
    await page.evaluate(() => document.fonts.ready);
    const links = page.locator('header nav a, header .linkedin-link, main a');
    for (const link of await links.all()) {
      assert(await link.isVisible());
      const box = await link.boundingBox();
      assert(box.width >= 44 && box.height >= 44, `Touch target at ${width}px`);
      assert(box.x >= 0 && box.x + box.width <= width, `Link fits at ${width}px`);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}px`);
    assert(await page.getByRole('main').evaluate(element => [...element.querySelectorAll('h1, h2, p, a')].every(node => node.scrollWidth <= node.clientWidth)), `Readable text at ${width}px`);
    if ([390, 1366].includes(width)) {
      await mkdir('.scratch/issue77-visuals', { recursive: true });
      await captureRegion(page, { selectors: ['html'], path: `.scratch/issue77-visuals/about-me-${width}.png` });
    }
  }
}
