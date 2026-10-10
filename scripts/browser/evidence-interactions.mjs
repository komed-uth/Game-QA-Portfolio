import { withBrowserContext } from './run-browser-check.mjs';
import assert from 'node:assert/strict';
// Visitor-facing checks against the rendered portfolio, retained from ticket #20.
export default async function check(page) {
    const p = page;
    await p.setViewportSize({ width: 390, height: 845 });
    const g = p.locator('.game-gallery').first();
    await g.locator('.gallery-thumbnail').nth(1).click();
    const selectionBeforeSwipe = await g.locator('.gallery-thumbnail[aria-pressed=true]').getAttribute('aria-label');
    const surface = g.locator('.gallery-viewer');
    await surface.scrollIntoViewIfNeeded();
    const box = await surface.boundingBox();
    await p.mouse.move(box.x + box.width * .7, box.y + box.height / 2);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width * .2, box.y + box.height / 2, { steps: 12 });
    await p.mouse.up();
    assert.equal(await p.locator('dialog').count(), 0);
    assert.equal(await g.locator('.gallery-thumbnail[aria-pressed=true]').count(), 1);
    assert.notEqual(await g.locator('.gallery-thumbnail[aria-pressed=true]').getAttribute('aria-label'), selectionBeforeSwipe);
    // A vertical drag scrolls rather than opening the selected screenshot.
    await g.locator('.gallery-thumbnail').nth(1).click();
    await surface.scrollIntoViewIfNeeded();
    const verticalBox = await surface.boundingBox();
    await p.mouse.move(verticalBox.x + verticalBox.width / 2, verticalBox.y + verticalBox.height * .3);
    await p.mouse.down();
    await p.mouse.move(verticalBox.x + verticalBox.width / 2, verticalBox.y + verticalBox.height * .7, { steps: 8 });
    await p.mouse.up();
    assert.equal(await p.locator('dialog').count(), 0, 'Vertical drags must not open evidence');
    assert.equal(await g.locator('.gallery-thumbnail[aria-pressed=true]').getAttribute('aria-label'), selectionBeforeSwipe);
    await g.locator('.evidence-image-button').click();
    const d = p.locator('dialog');
    await d.locator('img').evaluate(img => img.decode());
    assert.equal(await d.locator('img').evaluate(e => getComputedStyle(e).objectFit), 'contain');
    await p.keyboard.press('Escape');
    await d.waitFor({ state: 'detached' });
    await p.setViewportSize({ width: 1366, height: 768 });
    await p.locator('.report-preview').click();
    const f = await (await d.locator('iframe').elementHandle()).contentFrame();
    await f.waitForLoadState();
    await f.locator('.toggleImage').first().click();
    assert.equal(await d.count(), 1);
    await f.locator('a').last().focus();
    await p.keyboard.press('Tab');
    assert(await d.locator('a').evaluate(e => e === document.activeElement));
    await p.keyboard.press('Tab');
    assert(await d.getByRole('button', { name: 'Close evidence' }).evaluate(e => e === document.activeElement));
    await p.keyboard.press('Shift+Tab');
    assert(await d.locator('a').evaluate(e => e === document.activeElement));
    const pop = p.waitForEvent('popup');
    await d.locator('a').click();
    const original = await pop;
    assert(original.url().includes('S10_Very_High_Fixed'));
    await original.close();
    assert.equal(await d.count(), 1);
    await d.getByRole('button', { name: 'Close evidence' }).click();
    await d.waitFor({ state: 'detached' });
    await withBrowserContext(p.context().browser(), {
        viewport: { width: 390, height: 845 }, hasTouch: true, isMobile: true,
    }, async touchContext => {
        const touchPage = await touchContext.newPage();
        await touchPage.goto(p.url());
        const gallery = touchPage.locator('.game-gallery').first();
        await gallery.locator('.gallery-thumbnail').nth(1).click();
        const touchSurface = gallery.locator('.gallery-viewer');
        await touchSurface.scrollIntoViewIfNeeded();
        const touchBox = await touchSurface.boundingBox();
        const session = await touchContext.newCDPSession(touchPage);
        const x = touchBox.x + touchBox.width * .5;
        const y = touchBox.y + touchBox.height * .3;
        const scrollBeforeTouch = await touchPage.evaluate(() => scrollY);
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let i = 1; i <= 6; i++) {
            await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 10 }] });
        }
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await touchPage.waitForTimeout(200);
        assert.equal(await touchPage.locator('dialog').count(), 0);
        assert(await touchPage.evaluate(() => scrollY) > scrollBeforeTouch, 'Vertical touch gestures scroll the page');
        await gallery.locator('.evidence-image-button').focus();
        await touchPage.keyboard.press('Enter');
        assert.equal(await touchPage.locator('dialog').count(), 1, 'Keyboard opening works after canceled touch scrolling');
        await touchPage.keyboard.press('Escape');
        await touchPage.locator('dialog').waitFor({ state: 'detached' });
        await session.detach();
    });
    console.log('PASS: vertical touch scrolling preserves keyboard image opening');
    console.log('PASS: swipe suppresses opening, phone image fit, report toggle, iframe focus boundaries and actual original-file tab');
}
