import assert from 'node:assert/strict';
import { reportFiles as files, reportLabels as labels, selectReport } from './report-selection.mjs';
import { reportViewports } from './report-viewports.mjs';
import { reportProgress } from './run-browser-check.mjs';

// Exhaustive inspection complements the quick layout check on the rendered portfolio.
export default async function check(page) {
    const dialog = page.getByRole('dialog');
    const preview = page.locator('#android-reports .evidence-open');
    const action = page.locator('#android-reports .evidence-open');
    const closeButton = dialog.getByRole('button', { name: 'Close evidence' });
    const original = dialog.getByRole('link', { name: 'Open original in new tab' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    async function open(label, trigger = preview) {
        reportProgress('Open report', { viewport: page.viewportSize(), report: label, opener: trigger === action ? 'controls' : 'preview' });
        await selectReport(page, label);
        if (trigger === action) {
            await action.focus();
            await page.keyboard.press("Tab");
            await page.keyboard.press("Shift+Tab");
            assert(await action.evaluate(element => element === document.activeElement), 'Tab reaches controls opener');
            assert(await action.evaluate(element => getComputedStyle(element).outlineStyle !== 'none'), 'Keyboard opener has visible focus');
            await page.keyboard.press('Enter');
        } else await trigger.click();
        await dialog.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
        assert((await dialog.getAttribute('aria-labelledby'))?.length, 'Inspection has an accessible title');
        assert((await dialog.locator('h2').textContent()).includes(label));
        assert.equal(await original.getAttribute('target'), '_blank');
        assert((await original.getAttribute('rel')).includes('noopener'));
        assert((await original.getAttribute('href')).endsWith(files[label]));
        if (label === 'Overall') {
            await dialog.locator('img').evaluate(image => image.decode());
            return null;
        }
        const frame = await (await dialog.locator('iframe').elementHandle()).contentFrame();
        await frame.waitForLoadState();
        assert(new URL(frame.url()).pathname.endsWith(files[label]));
        return frame;
    }

    async function close(method = 'button', trigger = preview) {
        if (method === 'escape') await page.keyboard.press('Escape');
        else if (method === 'backdrop') await page.mouse.click(2, 2);
        else await closeButton.click();
        await dialog.waitFor({ state: 'detached' });
        assert(await trigger.evaluate(element => element === document.activeElement), 'Focus returns to report opener');
    }

    await page.setViewportSize({ width: 1366, height: 768 });

    // Both openers target every selected report; the controls action is keyboard-operated.
    for (const label of labels) {
        await open(label, action);
        await close('escape', action);
    }

    // Documentation links open real browser tabs; stub only their remote destination.
    await page.context().route('https://developer.arm.com/**', route => route.fulfill({
        contentType: 'text/html', body: '<h1>Report documentation destination</h1>',
    }));
    for (const label of labels) {
        const frame = await open(label);
        assert(await frame.locator('svg').count() > 0, 'Charts are rendered');
        const toggle = frame.locator('.toggleImage').first();
        const target = (await toggle.getAttribute('onclick')).match(/'([^']+)'/)[1];
        const content = frame.locator('.' + target).first();
        const visible = await content.isVisible();
        await toggle.click();
        await page.waitForTimeout(600); // Reports animate their own toggles.
        assert.notEqual(await content.isVisible(), visible);
        await toggle.click();
        await page.waitForTimeout(600);
        assert.equal(await content.isVisible(), visible);

        const link = frame.locator('a[href^="https://developer.arm.com/"]').first();
        const destination = await link.getAttribute('href');
        const popupPromise = page.waitForEvent('popup');
        await link.click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        assert.equal(popup.url(), destination);
        await popup.close();
        assert.equal(await dialog.count(), 1, 'Report link keeps inspection open');

        // Exercise a chart tooltip by moving the pointer over its plotting surface.
        await frame.locator('.bb-event-rect').first().hover();
        await frame.locator('.bb-tooltip-container').filter({ visible: true }).first().waitFor();
        assert.equal(await dialog.count(), 1, 'Chart interaction keeps inspection open');
        const pagePosition = await page.evaluate(() => scrollY);
        await page.mouse.wheel(0, 300);
        assert.equal(await page.evaluate(() => scrollY), pagePosition, 'Portfolio scrolling stays locked');

        await link.focus();
        await page.keyboard.press('Shift+Tab');
        assert(await closeButton.evaluate(element => element === document.activeElement), 'Reverse Tab leaves first report link');
        await frame.locator('a').last().focus();
        await page.keyboard.press('Tab');
        assert(await original.evaluate(element => element === document.activeElement), 'Tab leaves last report link');
        await page.keyboard.press('Tab');
        assert(await closeButton.evaluate(element => element === document.activeElement), 'Focus wraps inside inspection');
        await link.focus();
        await close('escape');
        assert.equal(await page.evaluate(() => scrollY), pagePosition, 'Close preserves portfolio position');
    }
    console.log('PASS: retained Very High HTML report, toggles, chart tooltips, real documentation tabs, iframe link-focused Escape and focus boundaries');

    const memoryFrame = await open('Very High');
    await memoryFrame.evaluate(() => scrollTo(0, 600));
    await page.waitForFunction(() => document.querySelector('dialog iframe')?.contentWindow?.scrollY === 600);
    await close('escape');
    const restored = await open('Very High');
    await page.waitForFunction(() => document.querySelector('dialog iframe')?.contentWindow?.scrollY === 600);
    assert.equal(await restored.evaluate(() => scrollY), 600, 'Visit-local report position is restored');
    await close();

    for (const [width, height] of reportViewports) {
        await page.setViewportSize({ width, height });
        for (const label of labels) {
            const frame = await open(label);
            const panel = await dialog.boundingBox();
            assert(panel.x >= 8 && panel.y >= 8 && panel.x + panel.width <= width - 8 && panel.y + panel.height <= height - 8);
            const viewport = await dialog.locator('.evidence-modal-content').boundingBox();
            assert(viewport.width > 0 && viewport.height >= 100, 'Report retains internal inspection space');
            for (const control of [closeButton, original]) {
                const box = await control.boundingBox();
                assert(box.height >= 44 && box.y >= panel.y && box.y + box.height <= panel.y + panel.height);
            }
            if (frame) {
                assert.equal(await frame.locator('body').evaluate(element => getComputedStyle(element).fontSize), '16px');
            } else {
                assert(await dialog.locator('img').evaluate(image => image.width >= 900), 'Overall remains readable');
            }
            await close(label === 'Overall' ? 'backdrop' : 'button');
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    console.log('PASS: single report inspection layout across ten viewports plus 900px');

    await page.reload();
    for (const label of labels) {
        const frame = await open(label);
        const reset = frame ? await frame.evaluate(() => ({ left: scrollX, top: scrollY })) :
            await dialog.locator('.evidence-modal-content').evaluate(element => ({ left: element.scrollLeft, top: element.scrollTop }));
        assert.deepEqual(reset, { left: 0, top: 0 }, 'Reload resets each report inspection');
        const popupPromise = page.waitForEvent('popup');
        await original.click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        assert(new URL(popup.url()).pathname.endsWith(files[label]));
        await popup.close();
        await close();
    }
    assert.deepEqual(errors, [], 'Report inspection produces no browser exceptions');
    console.log('PASS: Very High position memory, reload reset and original HTML tab');
}
