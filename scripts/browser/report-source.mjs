import assert from 'node:assert/strict';
export const reportFiles = { 'Very High': 'S10_Very_High_Fixed.html' };
export const reportLabels = Object.keys(reportFiles);
export async function prepareReportInspection(page) {
  await page.getByRole('navigation').getByRole('link', { name: 'Skills', exact: true }).click();
  assert.equal(await page.locator('.report-selector').count(), 0);
  assert.equal(await page.locator('#android-reports .evidence-open').count(), 1);
}
