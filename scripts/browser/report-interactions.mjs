import assert from 'node:assert/strict';
// Visitor-facing checks against the rendered portfolio, retained from ticket #20.
export default async function check(page) {
    const p = page;
    await p.setViewportSize({ width: 1366, height: 768 });
    for (const label of ['Very High', 'High', 'Medium', 'Low', 'Very Low']) {
        await p.getByRole('button', { name: label, exact: true }).click();
        await p.locator('.report-preview').click();
        const d = p.locator('dialog');
        const f = await (await d.locator('iframe').elementHandle()).contentFrame();
        await f.waitForLoadState();
        const toggle = f.locator('.toggleImage').first();
        const target = await toggle.getAttribute('onclick');
        const id = target.match(/'([^']+)'/)[1];
        const before = await f.locator('.' + id).first().isVisible();
        await toggle.click();
        await p.waitForTimeout(600);
        assert.notEqual(await f.locator('.' + id).first().isVisible(), before);
        await toggle.click();
        await p.waitForTimeout(600);
        assert.equal(await f.locator('.' + id).first().isVisible(), before);
        assert.equal(await d.count(), 1);
        assert(await f.locator('a[href]').first().getAttribute('href'));
        await f.locator('body').click({ position: { x: 20, y: 20 } });
        await p.mouse.wheel(0, 300);
        assert.equal(await d.count(), 1);
        await d.getByRole('button', { name: 'Close evidence' }).click();
        await d.waitFor({ state: 'detached' });
    }
    console.log('PASS: toggles, report links and inside interaction/scrolling across five HTML reports');
}
