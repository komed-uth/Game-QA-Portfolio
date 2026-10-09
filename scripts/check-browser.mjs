import { startPreview } from "./browser/preview-server.mjs";
import { chromium } from "playwright";
import checkEvidence from "./browser/evidence-modal.mjs";
import checkInteractions from "./browser/evidence-interactions.mjs";
import checkReports from "./browser/report-interactions.mjs";

const externalUrl = process.env.PORTFOLIO_URL;
const url = externalUrl || "http://127.0.0.1:4175";
let server;
let browser;

try {
  if (!externalUrl) {
    server = await startPreview();
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  });
  for (const check of [checkEvidence, checkInteractions, checkReports]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(url);
      await check(page);
    } finally {
      await context.close();
    }
  }
  console.log("PASS: rendered portfolio browser checks");
} finally {
  await browser?.close();
  server?.kill();
}
