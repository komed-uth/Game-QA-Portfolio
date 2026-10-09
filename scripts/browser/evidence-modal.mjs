import assert from 'node:assert/strict';
import { waitForPhoto as galleryReady } from "./gallery-photo-ready.mjs";
// Visitor-facing checks against the rendered portfolio, retained from ticket #20.
export default async function check(page) {
    const p = page;
    await p.setViewportSize({ width: 1366, height: 768 });
    const d = p.locator('dialog');
    async function close(method = 'button') {
        if (method === 'escape') await p.keyboard.press('Escape');
        else if (method === 'backdrop') await p.mouse.click(2, 2);
        else await d.getByRole('button', { name: 'Close evidence' }).click();
        await d.waitFor({ state: 'detached' });
    }
    async function checkImageFit() {
        await d.locator('img').evaluate(img => img.decode());
        await d.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
        const { width, height } = p.viewportSize();
        const panel = await d.boundingBox();
        assert(panel.x >= 8 && panel.y >= 8 && panel.x + panel.width <= width - 8 && panel.y + panel.height <= height - 8);
        assert(Math.abs(panel.x + panel.width / 2 - width / 2) < 2, 'Panel is horizontally centered');
        assert(Math.abs(panel.y + panel.height / 2 - height / 2) < 2, 'Panel is vertically centered');
        assert(await d.getAttribute('aria-labelledby'), 'Modal has an accessible title');
        const image = await d.locator('img').boundingBox();
        assert(image.width > 0 && image.height > 0, 'Full screenshot has visible space');
        assert(image.x >= panel.x && image.y >= panel.y && image.x + image.width <= panel.x + panel.width && image.y + image.height <= panel.y + panel.height);
        assert.equal(await d.locator('img').evaluate(element => getComputedStyle(element).objectFit), 'contain');
        for (const control of await d.locator('button, a').all()) {
            const box = await control.boundingBox();
            assert(box.height >= 44 && box.y >= panel.y && box.y + box.height <= panel.y + panel.height,
                'Image modal controls stay inside the panel');
        }
        await d.locator('img').click();
        assert.equal(await d.count(), 1, 'Inside image interaction keeps the modal open');
    }
    for (const g of await p.locator('.game-gallery').all()) {
        for (let i = 1; i < 4; i++) {
            await g.locator('.gallery-thumbnail').nth(i).click();
            assert.equal(await d.count(), 0);
            await galleryReady(g);
            const expected = await g.locator('.gallery-viewer img').getAttribute('src');
            const trigger = g.locator('.evidence-image-button');
            await trigger.click();
            assert.equal(await d.locator('img').getAttribute('src'), expected);
            assert.equal(await d.locator('a').getAttribute('href'), expected);
            await d.getByRole('button', { name: 'Next screenshot' }).click();
            await galleryReady(g);
            assert.equal(await g.locator('.gallery-viewer img').getAttribute('src'), await d.locator('img').getAttribute('src'));
            await p.keyboard.press('ArrowLeft');
            assert.equal(await d.locator('img').getAttribute('src'), expected);
            const openerY = await p.evaluate(() => scrollY);
            await p.mouse.wheel(0, 700);
            assert.equal(await p.evaluate(() => scrollY), openerY);
            for (let j = 0; j < 9; j++) {
                await p.keyboard.press('Tab');
                assert(await p.evaluate(() => document.querySelector('dialog').contains(document.activeElement)));
            }
            await close(i === 1 ? 'button' : i === 2 ? 'backdrop' : 'escape');
            assert(await trigger.evaluate(e => e === document.activeElement));
        }
        const action = g.locator('.evidence-open');
        assert((await action.boundingBox()).height >= 44, 'Gallery Open action must be at least 44px high');
        await action.click();
        await close();
        assert(await action.evaluate(element => element === document.activeElement));
        await g.locator('.gallery-thumbnail').first().click();
        assert.equal(await g.locator('.gallery-viewer iframe').count(), 1);
    }
    await p.locator('.capture-media .evidence-image-button').click();
    assert.equal(await d.getByRole('button', { name: 'Next screenshot' }).count(), 0);
    await close();
    await p.locator('.capture-media .evidence-image-button').click();
    await p.waitForTimeout(250);
    const exitAnimation = await d.evaluate(async (element) => {
        element.querySelector('button').click();
        await new Promise(resolve => requestAnimationFrame(resolve));
        return getComputedStyle(element).animationName;
    });
    assert.equal(exitAnimation, 'evidence-exit', 'Closing must start a distinct exit animation');
    await d.waitFor({ state: 'detached' });
    await p.locator('.capture-media .evidence-open').click();
    await close('escape');
    console.log('PASS: all seven evidence images, actions, originals, navigation/video skip, focus, dismissal and background lock');
    let summaryPosition;
    const labels = ['Very High', 'High', 'Medium', 'Low', 'Very Low', 'Overall'];
    for (let i = 0; i < labels.length; i++) {
        await p.getByRole('button', { name: labels[i], exact: true }).click();
        assert.equal(await d.count(), 0);
        await p.locator('.report-preview').click();
        if (i < 5) {
            const f = await d.locator('iframe').elementHandle();
            const frame = await f.contentFrame();
            await frame.waitForLoadState();
            assert.equal(await frame.evaluate(() => scrollY), 0);
            assert((await frame.locator('svg').count()) > 0);
            await frame.evaluate(y => scrollTo(0, y), 350 + i * 100);
            await p.waitForTimeout(100);
            await d.locator('iframe').focus();
            await close('escape');
        }
        else {
            await d.locator('img').evaluate(img => img.decode());
            await d.locator('.evidence-modal-content').evaluate(e => e.scrollTo(80, 600));
            await p.waitForTimeout(100);
            summaryPosition = await d.locator('.evidence-modal-content').evaluate(e => e.scrollTop);
            await close();
        }
    }
    for (let i = 0; i < labels.length; i++) {
        await p.getByRole('button', { name: labels[i], exact: true }).click();
        await p.locator('.report-controls .evidence-open').click();
        if (i < 5) {
            const frame = await (await d.locator('iframe').elementHandle()).contentFrame();
            await frame.waitForLoadState();
            await p.waitForTimeout(100);
            assert.equal(await frame.evaluate(() => scrollY), 350 + i * 100);
        }
        else {
            await d.locator('img').evaluate(img => img.decode());
            await p.waitForTimeout(100);
            assert.equal(await d.locator('.evidence-modal-content').evaluate(e => e.scrollTop), summaryPosition);
        }
        assert.equal(await d.locator('a').getAttribute('target'), '_blank');
        await close();
    }
    console.log('PASS: six reports, chart rendering, iframe Escape, independent scroll restoration and originals');
    await p.reload();
    await p.locator('.report-preview').click();
    let frame = await (await d.locator('iframe').elementHandle()).contentFrame();
    await frame.waitForLoadState();
    assert.equal(await frame.evaluate(() => scrollY), 0);
    await close();
    for (const [width, height] of [[1920, 1080], [1366, 768], [390, 845], [845, 390], [360, 840], [840, 360], [1200, 800], [800, 1200], [899, 700], [901, 700]]) {
        await p.setViewportSize({ width, height });
        // Image inspection must fit too: screenshot controls wrap on phones.
        for (const g of await p.locator('.game-gallery').all()) {
            await g.locator('.gallery-thumbnail').nth(1).click();
            await galleryReady(g);
            const selections = await p.locator('.gallery-thumbnail[aria-pressed=true]').evaluateAll(
                elements => elements.map(element => element.getAttribute('aria-label')));
            await g.locator('.evidence-open').click();
            await checkImageFit();
            const sources = await g.locator('.gallery-thumbnail img').evaluateAll(
                elements => elements.slice(1).map(element => element.getAttribute('src')));
            for (const expected of [sources[2], sources[1], sources[0]]) {
                await p.keyboard.press('ArrowLeft');
                assert.equal(await d.locator('img').getAttribute('src'), expected, 'Previous wraps and skips video');
            }
            assert.deepEqual(await p.locator('.gallery-thumbnail[aria-pressed=true]').evaluateAll(
                elements => elements.map(element => element.getAttribute('aria-label'))), selections,
                'Screenshot browsing wraps without changing the other project');
            await close();
        }
        await p.locator('.capture-media .evidence-open').click();
        await checkImageFit();
        assert.equal(await d.getByRole('button', { name: /screenshot/ }).count(), 0);
        await close();
        await p.locator('.report-preview').click();
        const box = await d.boundingBox();
        assert(box.x >= 8 && box.y >= 8 && box.x + box.width <= width - 8 && box.y + box.height <= height - 8);
        assert(await d.getByRole('button', { name: 'Close evidence' }).isVisible());
        await close();
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.locator('.capture-media .evidence-image-button').click();
    assert.equal(await d.evaluate(e => getComputedStyle(e).animationName), 'none');
    await close();
    console.log('PASS: reload reset, ten responsive viewports, outside margins, no page overflow and reduced motion');
}
