import assert from 'node:assert/strict';

export const reportFiles = {
    'Very High': 'S10_Very_High_Fixed.html',
    High: 'S10_High_Fixed.html',
    Medium: 'S10_Medium_Fixed.html',
    Low: 'S10_Low_Fixed.html',
    'Very Low': 'S10_Very_Low_Fixed.html',
    Overall: 'overall-performance-report.png',
};
export const reportLabels = Object.keys(reportFiles);

export async function selectReport(page, label) {
    const dialog = page.getByRole('dialog');
    const preview = page.locator('.report-preview');
    const action = page.locator('.report-controls .evidence-open');
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
}
