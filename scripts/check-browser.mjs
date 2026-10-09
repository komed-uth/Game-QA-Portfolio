import { startPreview } from "./browser/preview-server.mjs";
import { chromium } from "playwright";
import checkPreviewFixtures from "./browser/gameplay-preview-fixtures.mjs";
import checkGameplay from "./browser/gameplay-previews.mjs";
import checkPhotoChanges from "./browser/gameplay-photos.mjs";
import checkEvidence from "./browser/evidence-modal.mjs";
import checkInteractions from "./browser/evidence-interactions.mjs";
import checkReports from "./browser/report-interactions.mjs";
import checkOverlayFixture from "./browser/report-overlay-fixture.mjs";
import { checkOverlayReadiness } from "./browser/report-overlay-data.mjs";

const suites = new Map([
  [undefined, { label: "complete portfolio suite", result: "portfolio", reports: true,
    checks: [checkPhotoChanges, checkGameplay, checkPreviewFixtures, checkEvidence, checkInteractions, checkOverlayFixture, checkReports] }],
  ["--reports-only", { label: "reports and overlay fixture", result: "report", reports: true,
    checks: [checkOverlayFixture, checkReports] }],
  ["--gameplay-only", { label: "gameplay", result: "gameplay", reports: false,
    checks: [checkPhotoChanges, checkGameplay, checkPreviewFixtures] }],
]);
const args = process.argv.slice(2);
const suite = suites.get(args[0]);
if (args.length > 1 || !suite) {
  throw new Error("Usage: node scripts/check-browser.mjs [--reports-only | --gameplay-only]");
}
const externalUrl = process.env.PORTFOLIO_URL;
let url = externalUrl;
let server;
let browser;

// Inspect capture data before report exploration; gameplay has no report dependency.
if (suite.reports) await checkOverlayReadiness();
console.log(`CHECKS: ${suite.label}`);
try {
  if (!externalUrl) {
    server = await startPreview();
    url = server.url;
    console.log(`PREVIEW: ${url}`);
  }
  browser = await chromium.launch({
    headless: true,
    ignoreDefaultArgs: ["--hide-scrollbars"],
    ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  });
  for (const check of suite.checks) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(url);
      await check(page);
    } finally {
      await context.close();
    }
  }
  console.log(`PASS: rendered ${suite.result} browser checks`);
} finally {
  await browser?.close();
  server?.kill();
}
