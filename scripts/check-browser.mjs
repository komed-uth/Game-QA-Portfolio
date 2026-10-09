import { startPreview } from "./browser/preview-server.mjs";
import { chromium } from "playwright";
import checkPreviewFixtures from "./browser/gameplay-preview-fixtures.mjs";
import checkGameplay from "./browser/gameplay-previews.mjs";
import checkEvidence from "./browser/evidence-modal.mjs";
import checkInteractions from "./browser/evidence-interactions.mjs";
import checkReports from "./browser/report-interactions.mjs";
import checkOverlayFixture from "./browser/report-overlay-fixture.mjs";
import { checkOverlayReadiness } from "./browser/report-overlay-data.mjs";

const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => !["--reports-only", "--gameplay-only"].includes(arg))) {
  throw new Error("Usage: node scripts/check-browser.mjs [--reports-only | --gameplay-only]");
}
const reportsOnly = args.includes("--reports-only");
const gameplayOnly = args.includes("--gameplay-only");
const scope = reportsOnly ? "reports and overlay fixture" : gameplayOnly ? "gameplay" : "complete portfolio suite";
const checks = gameplayOnly ? [checkGameplay, checkPreviewFixtures] : reportsOnly ? [checkOverlayFixture, checkReports] :
  [checkGameplay, checkPreviewFixtures, checkEvidence, checkInteractions, checkOverlayFixture, checkReports];
const externalUrl = process.env.PORTFOLIO_URL;
let url = externalUrl;
let server;
let browser;

// Inspect capture data before report exploration; gameplay has no report dependency.
if (!gameplayOnly) await checkOverlayReadiness();
console.log(`CHECKS: ${scope}`);
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
  for (const check of checks) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(url);
      await check(page);
    } finally {
      await context.close();
    }
  }
  console.log(`PASS: rendered ${gameplayOnly ? "gameplay" : reportsOnly ? "report" : "portfolio"} browser checks`);
} finally {
  await browser?.close();
  server?.kill();
}
