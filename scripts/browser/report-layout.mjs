import assert from 'node:assert/strict';
import { reportFiles, reportLabels as labels, selectReport } from './report-selection.mjs';
import { reportViewports } from './report-viewports.mjs';
import { reportProgress } from './run-browser-check.mjs';

// Fast feedback on the same rendered portfolio; exhaustive HTML inspection stays separate.
export default async function check(page) {
    const preview = page.locator('.report-preview');
    const action = page.locator('.report-controls .evidence-open');
    const dialog = page.getByRole('dialog');
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    async function close(trigger = preview) {
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'detached' });
        assert(await trigger.evaluate(element => element === document.activeElement), 'Focus returns to the actual report opener');
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

    for (const label of labels) await selectReport(page, label);

    for (const [width, height] of reportViewports) {
        reportProgress('Report layout', { viewport: { width, height }, report: 'Overall' });
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
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Report layout creates no page overflow');
    }

    // Keyboard traversal follows the visible preview-first mobile sequence.
    await preview.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert(await preview.evaluate(element => element === document.activeElement && element.matches(':focus-visible') &&
        getComputedStyle(element).outlineStyle !== 'none' && parseFloat(getComputedStyle(element).outlineWidth) > 0),
        'Preview has visible keyboard focus before the quality choices');
    await page.keyboard.press('Enter');
    await close();
    for (const label of labels) {
        await page.keyboard.press('Tab');
        assert(await page.getByRole('button', { name: label, exact: true }).evaluate(element => element === document.activeElement),
            'Tab follows the quality choices in their visible order');
    }
    await page.keyboard.press('Tab');
    assert(await action.evaluate(element => element === document.activeElement), 'Controls opener follows the quality choices');
    await page.keyboard.press('Enter');
    await dialog.waitFor();
    assert((await dialog.getByRole('link', { name: 'Open original in new tab' }).getAttribute('href')).endsWith(reportFiles.Overall));
    await close(action);
    assert.deepEqual(errors, [], 'Quick report layout and keyboard inspection produce no browser exceptions');
    console.log('PASS: report presentation, all six selection contexts, eleven responsive viewports, 900px boundaries, resize continuity, wrapping, reading/keyboard order and both opener restoration');
}
