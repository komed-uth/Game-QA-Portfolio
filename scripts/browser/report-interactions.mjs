import assert from 'node:assert/strict';

const files = {
    'Very High': 'S10_Very_High_Fixed.html',
    High: 'S10_High_Fixed.html',
    Medium: 'S10_Medium_Fixed.html',
    Low: 'S10_Low_Fixed.html',
    'Very Low': 'S10_Very_Low_Fixed.html',
    Overall: 'overall-performance-report.png',
};
const labels = Object.keys(files);

// Report inspection, text cleanup and responsive ordering use the rendered portfolio surface.
export default async function check(page) {
    const dialog = page.getByRole('dialog');
    const preview = page.locator('.report-preview');
    const action = page.locator('.report-controls .evidence-open');
    const closeButton = dialog.getByRole('button', { name: 'Close evidence' });
    const original = dialog.getByRole('link', { name: 'Open original in new tab' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    async function open(label, trigger = preview) {
        await page.getByRole('button', { name: label, exact: true }).click();
        assert.equal(await dialog.count(), 0, 'Quality selection keeps inspection closed');
        assert.deepEqual(await page.locator('.report-selector button[aria-pressed="true"]').allTextContents(), [label]);
        const title = label + (label === 'Overall' ? ' performance summary' : ' quality — Samsung Galaxy S10 Performance Advisor report');
        assert.equal(await page.getByRole('region', { name: title, exact: true }).count(), 1, 'Report output has selection context independent of removed metadata');
        assert.equal(await page.locator('.report-output').getByRole('status').textContent(), 'Selected report: ' + title);
        assert.equal(await preview.textContent().then(text => text.trim()), 'Open report', 'Preview has only its action text');
        for (const opener of [preview, action]) {
            assert.equal(await opener.getAttribute('aria-label'), 'Open ' + title, 'Both openers name the selected evidence');
        }
        if (trigger === action) {
            await page.getByRole('button', { name: 'Overall', exact: true }).focus();
            await page.keyboard.press('Tab');
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
    assert.equal(await page.getByRole('button', { name: 'Very High', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.report-output iframe').count(), 0, 'Preview does not embed an interactive report');
    assert.equal(await page.locator('.report-selector button').count(), 6);
    assert.deepEqual(await page.locator('.report-selector button').allTextContents(), labels, 'All quality choices retain their order');
    assert.equal(await page.getByRole('heading', { name: 'Performance reports', exact: true }).count(), 1);
    assert.equal(await page.getByRole('region', { name: 'Performance reports', exact: true }).count(), 1,
        'The complete report block retains its heading context');
    assert.equal(await page.getByRole('group', { name: 'Graphics quality setting', exact: true }).count(), 1);
    assert.equal(await page.locator('.report-controls .section-description, .report-output .report-status, .report-output .report-note').count(), 0,
        'Introductory paragraph, visible Viewing status and inspection note are removed');
    assert.equal((await page.locator('.report-controls').innerText()).trim(), [...labels, 'Open report'].join('\n'),
        'Controls retain quality choices and Open report without restoring removed text');

    // Both openers target every selected report; the controls action is keyboard-operated.
    for (const label of labels) {
        await open(label, action);
        await close('escape', action);
    }

    // Documentation links open real browser tabs; stub only their remote destination.
    await page.context().route('https://developer.arm.com/**', route => route.fulfill({
        contentType: 'text/html', body: '<h1>Report documentation destination</h1>',
    }));
    for (const label of labels.slice(0, 5)) {
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
    console.log('PASS: five HTML reports, toggles, chart tooltips, real documentation tabs, iframe link-focused Escape and focus boundaries');

    // Save both axes in the narrow Overall viewport, including an immediate close.
    await page.setViewportSize({ width: 390, height: 845 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open('Overall', action);
    const position = await dialog.evaluate(element => {
        const viewport = element.querySelector('.evidence-modal-content');
        viewport.scrollTo(120, 725);
        const saved = { left: viewport.scrollLeft, top: viewport.scrollTop };
        element.querySelector('button').click();
        return saved;
    });
    assert(position.left > 0 && position.top > 0, 'Overall is readable through two-axis internal scrolling');
    await dialog.waitFor({ state: 'detached' });
    assert(await action.evaluate(element => element === document.activeElement));
    await open('Very High');
    await close();
    await open('Overall');
    assert.deepEqual(await dialog.locator('.evidence-modal-content').evaluate(element => ({
        left: element.scrollLeft, top: element.scrollTop,
    })), position, 'Immediate close retains Overall position independently');
    await close();
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Keyboard traversal follows the visible preview-first mobile sequence.
    await preview.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert(await preview.evaluate(element => element === document.activeElement && element.matches(':focus-visible') &&
        getComputedStyle(element).outlineStyle !== 'none' && parseFloat(getComputedStyle(element).outlineWidth) > 0),
        'Preview has visible keyboard focus before the quality choices');
    await page.keyboard.press('Enter');
    await close('escape');
    for (const label of labels) {
        await page.keyboard.press('Tab');
        assert(await page.getByRole('button', { name: label, exact: true }).evaluate(element => element === document.activeElement),
            'Tab follows the quality choices in their visible order');
    }
    await page.keyboard.press('Tab');
    assert(await action.evaluate(element => element === document.activeElement), 'Controls opener follows the quality choices');
    // Exercise the second entry point for every report on mobile as well as desktop.
    for (const label of labels) {
        await open(label, action);
        await close('escape', action);
    }
    await page.getByRole('button', { name: 'Overall', exact: true }).click();

    for (const [width, height] of [[1920, 1080], [1366, 768], [390, 845], [845, 390], [360, 840],
        [840, 360], [1200, 800], [800, 1200], [899, 700], [901, 700], [900, 700]]) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.getByRole('button', { name: 'Overall', exact: true }).getAttribute('aria-pressed'), 'true',
            'Resizing preserves selected report');
        // Measure both regions in one frame; resize can move the page's scroll anchor.
        const { controls, output, previewBox, heading, selector, storeLinks, details, gallery, block, readingOrder } = await page.locator('.regulus-showcase').evaluate(section => ({
            controls: section.querySelector('.report-controls').getBoundingClientRect().toJSON(),
            output: section.querySelector('.report-output').getBoundingClientRect().toJSON(),
            previewBox: section.querySelector('.report-preview').getBoundingClientRect().toJSON(),
            heading: section.querySelector('#report-heading').getBoundingClientRect().toJSON(),
            selector: section.querySelector('.report-selector').getBoundingClientRect().toJSON(),
            storeLinks: section.querySelector('.store-links').getBoundingClientRect().toJSON(),
            details: section.querySelector('.project-details').getBoundingClientRect().toJSON(),
            gallery: section.querySelector('.game-gallery').getBoundingClientRect().toJSON(),
            block: section.querySelector('.report-block').getBoundingClientRect().toJSON(),
            readingOrder: ['#report-heading', '.report-preview', '.report-selector', '.report-controls .evidence-open']
                .map(selector => section.querySelector(selector)).every((element, index, elements) => index === 0 ||
                    Boolean(elements[index - 1].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)),
        }));
        assert(readingOrder, 'Reading order follows heading, preview, quality choices and controls opener');
        if (width > 900) {
            assert(controls.x + controls.width <= output.x + 1 && Math.abs(controls.x - heading.x) <= 1,
                'Desktop heading and controls remain left of report output');
            assert(Math.abs(output.y - heading.y) <= 1, 'Desktop output aligns with heading context');
            assert(selector.y >= heading.bottom && selector.y - heading.bottom <= 24,
                'Desktop choices follow the heading without an obsolete description gap');
        } else {
            assert(previewBox.y >= heading.bottom && previewBox.y - heading.bottom <= 24,
                'Narrow report heading immediately precedes the preview');
            assert(selector.y >= previewBox.bottom && selector.y - previewBox.bottom <= 24,
                'Narrow quality choices follow the preview with natural spacing');
            assert(controls.y >= output.bottom && Math.abs(controls.y - selector.y) <= 1,
                'Narrow controls sit below the complete report output without obsolete spacing');
        }
        assert(Math.abs(output.y - previewBox.y) <= 1 && Math.abs(output.height - previewBox.height) <= 1,
            'Preview has no reserved status or inspection-note space');
        assert(storeLinks.y >= details.bottom, 'Store links remain after project details');
        assert(block.y >= storeLinks.bottom && block.y >= gallery.bottom,
            'Complete reports remain after project details, store links and gameplay');
        assert(previewBox.height >= 180, 'Existing preview frame size survives cleanup');
        assert(Math.abs(previewBox.width - output.width) <= 1 && Math.abs(previewBox.height - 180) <= 1,
            'The existing preview fills its available width and retains its frame height');
        for (const control of [...await page.locator('.report-selector button').all(), action, preview]) {
            const box = await control.boundingBox();
            assert(box.height >= 44 && box.x >= 0 && box.x + box.width <= width, 'Report controls wrap within page and retain touch targets');
        }
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
    console.log('PASS: preview-first mobile reading/keyboard order, desktop controls beside output, both 900px boundaries, resize selection, all six reports across ten viewports plus 900px, cleanup spacing and 44px controls');

    await page.reload();
    assert.equal(await page.getByRole('button', { name: 'Very High', exact: true }).getAttribute('aria-pressed'), 'true');
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
    console.log('PASS: Overall immediate-close memory, reload resets, Very High default and original tabs for all six reports');
}
