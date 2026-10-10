import assert from 'node:assert/strict';

async function checkFooter(page) {
  const footer = page.getByRole('contentinfo');
  assert.equal((await footer.innerText()).trim(), "Komed's Portfolio",
    'Shared footer retains only the portfolio name');
  const layout = await footer.evaluate(element => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const name = document.createRange();
    name.selectNodeContents(element);
    const text = name.getBoundingClientRect();
    return {
      border: parseFloat(style.borderTopWidth), borderStyle: style.borderTopStyle,
      borderColor: style.borderTopColor,
      height: bounds.height, padding: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
      textHeight: text.height, textLeft: text.left, textRight: text.right,
      left: bounds.left, right: bounds.right,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  assert(layout.border > 0 && layout.borderStyle === 'solid' && layout.borderColor !== 'rgba(0, 0, 0, 0)',
    'The footer divider remains visible');
  assert(layout.height <= layout.padding + layout.textHeight + layout.border + 4,
    'Footer has no reserved text rows');
  assert(layout.textLeft >= layout.left && layout.textRight <= layout.right,
    'Portfolio name fits inside the footer');
  assert.equal(layout.overflow, false, 'Route has no horizontal page overflow');
}

async function checkHomepage(page) {
  const main = page.getByRole('main');
  const text = await main.innerText();
  for (const removed of ['Next in the portfolio', 'Manual gameplay testing', 'Work in progress',
    'Test cases, defect reports, and coverage documentation are being', 'Explore the QA approach']) {
    assert(!text.includes(removed), `Homepage removes ${removed}`);
  }
  assert.equal(await main.getByRole('link', { name: /Explore the QA approach/ }).count(), 0);
  assert.deepEqual(await main.locator('.project-title').allTextContents(),
    ['Regulus the Advent', 'Father, Son & Holy Guns', 'Vecchio Furioso'], 'Project showcase order remains intact');
  assert.deepEqual(await main.locator('.store-links a').evaluateAll(links => links.map(link => link.href)), [
    'https://apps.apple.com/th/app/regulus-the-advent/id6739992769',
    'https://play.google.com/store/apps/details?id=com.jj.regulus.android&hl=en',
    'https://store.steampowered.com/app/4524580/Vecchio_Furioso/',
  ], 'Project store destinations remain intact');
  const last = await main.locator('article').last().boundingBox();
  const footer = await page.getByRole('contentinfo').boundingBox();
  const gap = footer.y - last.y - last.height;
  assert(gap >= 0 && gap <= 80, 'Project showcases lead into the footer without a reserved teaser gap');
  await checkFooter(page);
}

// Called by the existing evidence check's ten-viewport loop.
export async function checkHomepageFooter(page) {
  const homeUrl = page.url();
  await checkHomepage(page);
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('link', { name: 'QA approach', exact: true }).click();
  await page.getByRole('heading', { name: 'Planned gameplay coverage' }).waitFor();
  const coverage = page.getByRole('region', { name: 'Planned gameplay coverage' });
  assert(await coverage.getByText('Work in progress', { exact: true }).isVisible());
  await checkFooter(page);
  await nav.getByRole('link', { name: 'Portfolio', exact: true }).click();
  await page.getByRole('heading', { name: 'Regulus the Advent', exact: true }).waitFor();
  const approach = nav.getByRole('link', { name: 'QA approach', exact: true });
  await nav.getByRole('link', { name: 'Portfolio', exact: true }).focus();
  await page.keyboard.press('Tab');
  assert(await approach.evaluate(element => element === document.activeElement &&
    element.matches(':focus-visible') && parseFloat(getComputedStyle(element).outlineWidth) > 0 &&
    getComputedStyle(element).outlineStyle !== 'none'), 'QA approach has visible keyboard focus');
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'Planned gameplay coverage' }).waitFor();
  await checkFooter(page);
  await page.goto(new URL('./unknown-portfolio-route', homeUrl).href);
  await checkHomepage(page);
  await page.goto(homeUrl);
}
