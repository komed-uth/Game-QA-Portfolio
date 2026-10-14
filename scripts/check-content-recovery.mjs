import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createLogger, createServer } from "vite";
import { chromium } from "playwright";
import { loadContentDefinitions, repositoryRoot } from "./content-validation.mjs";
import { withBrowserContext } from "./browser/run-browser-check.mjs";
import path from "node:path";

const definitions = await loadContentDefinitions();
import { contentPath, createContentEditor } from "./content-editing-fixture.mjs";
const contentEditor = await createContentEditor();
const originalSource = await readFile(contentPath, "utf8");
let correction;
let invalidMessage;
const logger = createLogger("silent");
logger.error = message => {
  if (correction && message.includes("Content validation failed")) {
    invalidMessage = message;
    // Match the CI failure: save the correction as soon as validation reports it,
    // while the filesystem watcher may still be throttling this file's events.
    correction.saved = writeFile(contentPath, originalSource);
  }
};
const server = await createServer({ root: repositoryRoot, customLogger: logger, server: { host: "127.0.0.1", port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  await withBrowserContext(browser, {}, async context => {
    const page = await context.newPage();
    const messages = [];
    page.on("websocket", socket => socket.on("framereceived", ({ payload }) => {
      try { messages.push(JSON.parse(payload)); } catch { /* Ignore non-JSON transport frames. */ }
    }));
    await page.goto(server.resolvedUrls.local[0]);
    await page.getByRole("heading", { name: "Regulus the Advent", exact: true }).waitFor();
    for (const [name, edit, diagnostic] of [
      ["projects", value => { value[0].media[1].path = "images/missing.png"; }, /media.*path: local media file does not exist/],
      ["evidence", value => { value[0].defaultReportId = "missing"; }, /defaultReportId: invalid report default/],
      ["portfolioPage", value => { value.sections[0].projectId = "missing"; }, /projectId: unknown project/],
      ["skillsPage", value => { value.sections[0].cards[1].evidence[0].evidenceId = "missing"; }, /evidenceId: unknown evidence reference/],
    ]) {
      correction = { name };
      invalidMessage = undefined;
      const start = messages.length;
      const invalid = structuredClone(definitions[name]);
      edit(invalid);
      await contentEditor.write(name, invalid);
      const waitForMessage = async predicate => {
        const deadline = Date.now() + 5000;
        while (!messages.slice(start).some(predicate)) {
          assert(Date.now() < deadline, name + ": expected development-server message was not received");
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      };
      await waitForMessage(message => message.type === "error");
      assert.match(invalidMessage, diagnostic);
      await correction.saved;
      await waitForMessage(message => message.type === "update" || message.type === "full-reload");
      await page.locator("vite-error-overlay").waitFor({ state: "detached", timeout: 5000 });
      await page.getByRole("heading", { name: "Regulus the Advent", exact: true }).waitFor();
      correction = undefined;
      console.log(`PASS: ${name} rapid correction reaches the browser without a stuck overlay.`);
    }
  });
} finally {
  try { await browser?.close(); } finally {
    await server.close();
    await contentEditor.restore();
  }
}
console.log("PASS: rapid corrective saves for project, evidence, Portfolio, and Skills reach the browser and dismiss validation overlays.");
