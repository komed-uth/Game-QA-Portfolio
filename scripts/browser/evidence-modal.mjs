import assert from 'node:assert/strict';
import { checkHomepageFooter } from './homepage-footer.mjs';
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
    const capture = p.locator('.capture-media');
    const captureOpener = capture.getByRole('button', {
        name: 'Open full-size Microsoft PIX capture for Vecchio Furioso', exact: true,
    });
    const captureAlt = 'Microsoft PIX GPU capture of Vecchio Furioso showing rendering events, a gameplay preview, and the GPU timing timeline';
    async function checkCaptureLayout() {
        await captureOpener.scrollIntoViewIfNeeded();
        await capture.locator('img').evaluate(img => img.decode());
        assert.equal((await capture.innerText()).trim(), '', 'PIX capture has no caption, action text or inspection note');
        assert.equal(await capture.locator('figcaption, .evidence-open, .report-note').count(), 0);
        assert.equal(await capture.getByRole('button').count(), 1, 'Main capture is the only inspection action');
        assert.equal(await capture.locator('img').getAttribute('alt'), captureAlt);
        const figureBox = await capture.boundingBox();
        const openerBox = await captureOpener.boundingBox();
        const imageBox = await capture.locator('img').boundingBox();
        assert(openerBox.width >= 44 && openerBox.height >= 44, 'Main capture retains a usable touch target');
        assert(Math.abs(figureBox.height - openerBox.height) < 1, 'Removed rows leave no reserved spacing');
        assert(Math.abs(imageBox.height - openerBox.height) < 1 && Math.abs(imageBox.width - openerBox.width) < 1,
            'Capture fills its opener without clipping');
        const ratio = await capture.locator('img').evaluate(img => img.naturalWidth / img.naturalHeight);
        assert(Math.abs(imageBox.width / imageBox.height - ratio) < .01, 'Complete capture keeps its original aspect ratio');
        const detailsBox = await p.locator('.pc-project .project-info').boundingBox();
        if (p.viewportSize().width <= 900) {
            assert(figureBox.y >= detailsBox.y + detailsBox.height, 'Narrow-screen capture follows project details');
        } else {
            assert(figureBox.x >= detailsBox.x + detailsBox.width && Math.abs(figureBox.y - detailsBox.y) < 1,
                'Desktop capture stays beside project details');
        }
        assert(await p.locator('.pc-project').getByRole('link', { name: 'Vecchio Furioso on Steam (opens in a new tab)' }).isVisible());
        assert.equal(await p.locator('.pc-project .game-gallery, .pc-project .gallery-thumbnail').count(), 0);
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Capture creates no page overflow');
    }
    async function checkCaptureContent() {
        assert.equal(await d.getAttribute('aria-labelledby') !== null, true);
        assert(await p.getByRole('dialog', { name: 'Vecchio Furioso · Microsoft PIX capture', exact: true }).isVisible());
        assert.equal(await d.locator('img').getAttribute('src'), await capture.locator('img').getAttribute('src'));
        assert.equal(await d.locator('img').getAttribute('alt'), captureAlt);
        assert.equal(await d.locator('a').getAttribute('href'), await capture.locator('img').getAttribute('src'));
        assert.equal(await d.getByRole('button', { name: /screenshot/ }).count(), 0);
        assert.equal(await p.evaluate(() => document.documentElement.style.overflow), 'hidden');
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
            await galleryReady(g);
            assert(await trigger.evaluate(e => e === document.activeElement));
        }
        const action = g.locator('.evidence-image-button');
        assert((await action.boundingBox()).height >= 44, 'Main photo remains a usable inspection target');
        await action.focus();
        await p.keyboard.press('Enter');
        await close();
        await galleryReady(g);
        assert(await action.evaluate(element => element === document.activeElement));
        await g.locator('.gallery-thumbnail').first().click();
        assert.equal(await g.locator('.gallery-viewer iframe').count(), 1);
    }
    await checkCaptureLayout();
    await captureOpener.click();
    await checkCaptureContent();
    assert.equal(await d.getByRole('button', { name: 'Next screenshot' }).count(), 0);
    await close();
    assert(await captureOpener.evaluate(element => element === document.activeElement));
    await p.locator('.capture-media .evidence-image-button').click();
    await p.waitForTimeout(250);
    const exitAnimation = await d.evaluate(async (element) => {
        element.querySelector('button').click();
        await new Promise(resolve => requestAnimationFrame(resolve));
        return getComputedStyle(element).animationName;
    });
    assert.equal(exitAnimation, 'evidence-exit', 'Closing must start a distinct exit animation');
    await d.waitFor({ state: 'detached' });
    await captureOpener.focus();
    await p.keyboard.press('Space');
    await checkCaptureContent();
    await close('escape');
    assert(await captureOpener.evaluate(element => element === document.activeElement));
    assert.notEqual(await p.evaluate(() => document.documentElement.style.overflow), 'hidden');
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
            await g.locator('.evidence-image-button').click();
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
        await checkCaptureLayout();
        await captureOpener.focus();
        // Tab away and back makes keyboard focus visible after pointer inspection.
        await p.keyboard.press('Tab');
        await p.keyboard.press('Shift+Tab');
        assert(await captureOpener.evaluate(element => element === document.activeElement &&
            element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none' &&
            parseFloat(getComputedStyle(element).outlineWidth) > 0), 'Main capture has visible keyboard focus');
        await p.keyboard.press('Enter');
        await checkCaptureContent();
        await checkImageFit();
        assert.equal(await d.getByRole('button', { name: /screenshot/ }).count(), 0);
        await close('backdrop');
        assert(await captureOpener.evaluate(element => element === document.activeElement), 'Capture restores focus after resizing');
        await p.locator('.report-preview').click();
        const box = await d.boundingBox();
        assert(box.x >= 8 && box.y >= 8 && box.x + box.width <= width - 8 && box.y + box.height <= height - 8);
        assert(await d.getByRole('button', { name: 'Close evidence' }).isVisible());
        await close();
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await checkHomepageFooter(p);
    }
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.locator('.capture-media .evidence-image-button').click();
    assert.equal(await d.evaluate(e => getComputedStyle(e).animationName), 'none');
    await close();
    console.log('PASS: reload reset, ten responsive viewports, outside margins, no page overflow and reduced motion');
    console.log('PASS: homepage teaser removal, compact shared footer, About/fallback routes, pointer/keyboard navigation and store destinations at ten viewports');
}
