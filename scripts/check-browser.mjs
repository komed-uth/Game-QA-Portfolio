import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import checkEvidence from "./browser/evidence-modal.mjs";
import checkInteractions from "./browser/evidence-interactions.mjs";
import checkReports from "./browser/report-interactions.mjs";

const externalUrl = process.env.PORTFOLIO_URL;
const url = externalUrl || "http://127.0.0.1:4175";
let server;
let browser;
let serverOutput = "";

try {
  if (!externalUrl) {
    server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview",
      "--host", "127.0.0.1", "--port", "4175", "--strictPort"], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    for (const stream of [server.stdout, server.stderr]) {
      stream.on("data", (chunk) => { serverOutput = (serverOutput + chunk).slice(-4000); });
    }
    server.on("error", (error) => { serverOutput += error.message; });
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      await delay(100);
      if (server.exitCode !== null) throw new Error(`Preview stopped: ${serverOutput}`);
      try {
        const response = await fetch(url);
        if (response.ok) { ready = true; break; }
      } catch { /* Preview may still be starting. */ }
    }
    if (!ready) throw new Error(`Preview did not become ready: ${serverOutput}`);
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
