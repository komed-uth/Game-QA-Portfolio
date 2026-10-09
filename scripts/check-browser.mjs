import { startPreview } from "./browser/preview-server.mjs";
import { chromium } from "playwright";
import checkEvidence from "./browser/evidence-modal.mjs";
import checkInteractions from "./browser/evidence-interactions.mjs";
import checkReports from "./browser/report-interactions.mjs";
import checkOverlayFixture from "./browser/report-overlay-fixture.mjs";
import { checkOverlayReadiness } from "./browser/report-overlay-data.mjs";

const args = process.argv.slice(2);
if (args.some(arg => arg !== "--reports-only")) {
  throw new Error("Usage: node scripts/check-browser.mjs [--reports-only]");
}
const reportsOnly = args.includes("--reports-only");
const checks = reportsOnly ? [checkOverlayFixture, checkReports] :
  [checkEvidence, checkInteractions, checkOverlayFixture, checkReports];
const externalUrl = process.env.PORTFOLIO_URL;
let url = externalUrl;
let server;
let browser;

// Inspect capture data before starting a browser or exploring report interactions.
await checkOverlayReadiness();
console.log(`CHECKS: ${reportsOnly ? "reports and overlay fixture" : "complete portfolio suite"}`);
try {
  if (!externalUrl) {
    server = await startPreview();
    url = server.url;
    console.log(`PREVIEW: ${url}`);
  }
  browser = await chromium.launch({
    headless: true,
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
  console.log(`PASS: rendered ${reportsOnly ? "report" : "portfolio"} browser checks`);
} finally {
  await browser?.close();
  server?.kill();
}
