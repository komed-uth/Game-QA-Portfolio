import assert from 'node:assert/strict';

export async function prepareAfterNativeScroll(page) {
  // Observe a quiet page before ending Chromium's canceled native pan. A tap
  // during momentum stops scrolling rather than activating the next target.
  let lastScroll = await page.evaluate(() => scrollY), quietSince = Date.now();
  const deadline = Date.now() + 5000;
  while (Date.now() - quietSince < 250) {
    assert(Date.now() < deadline, 'Native vertical scrolling settles before inspection');
    await page.waitForTimeout(50);
    const currentScroll = await page.evaluate(() => scrollY);
    if (currentScroll !== lastScroll) quietSince = Date.now();
    lastScroll = currentScroll;
  }
  // Chromium may consume the first touch even after scrollY settles. End that
  // interaction once on a verified noninteractive gutter before activation.
  assert(await page.evaluate(() => {
    const target = document.elementFromPoint(2, 2);
    return !!target && !target.closest('button, a, iframe, input, select, textarea, [role="button"], [contenteditable]');
  }),
    'Native scroll preparation targets a noninteractive gutter');
  await page.touchscreen.tap(2, 2);
  assert.equal(await page.locator('dialog').count(), 0, 'Ending native scroll does not open inspection');
}
