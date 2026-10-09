import { startPreview } from './browser/preview-server.mjs';
import { selectSuite } from './browser/check-suites.mjs';
import { withStableInputs } from './browser/stable-inputs.mjs';
import { runBrowserCheck } from './browser/run-browser-check.mjs';

const suite = selectSuite(process.argv.slice(2));
await withStableInputs(async () => {
  // Load checks after the input snapshot so edits cannot validate stale imported code.
  const { chromium } = await import('playwright');
  const externalUrl = process.env.PORTFOLIO_URL;
  let url = externalUrl;
  let server;
  let browser;
  if (suite.reports) {
    const { checkOverlayReadiness } = await import('./browser/report-overlay-data.mjs');
    await checkOverlayReadiness();
  }
  console.log(`CHECKS: ${suite.label}`);
  try {
    if (!externalUrl) {
      server = await startPreview();
      url = server.url;
      console.log(`PREVIEW: ${url}`);
    }
    browser = await chromium.launch({ headless: true, ignoreDefaultArgs: ['--hide-scrollbars'],
      ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
    });
    for (const { name, module } of suite.checks) {
      const { default: check } = await import(new URL(module, new URL('./browser/', import.meta.url)));
      await runBrowserCheck(browser, url, { name, check });
    }
  } finally {
    try { await browser?.close(); } finally { server?.kill(); }
  }
});
console.log(`PASS: rendered ${suite.result} browser checks`);
