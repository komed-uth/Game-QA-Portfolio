import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";
import { loadContentDefinitions, repositoryRoot } from "./content-validation.mjs";
import { startPreview } from "./browser/preview-server.mjs";
import { withBrowserContext } from "./browser/run-browser-check.mjs";
import { waitForPhoto } from "./browser/gallery-photo-ready.mjs";

import { createContentEditor } from "./content-editing-fixture.mjs";
const contentEditor = await createContentEditor();
const writeDefinition = (name, value) => contentEditor.write(name, value);

function command(script, args = []) {
  const result = spawnSync("npm", ["run", script, ...(args.length ? ["--", ...args] : [])],
    { cwd: repositoryRoot, shell: process.platform === "win32", encoding: "utf8", windowsHide: true });
  assert.ifError(result.error);
  return { status: result.status, output: result.stdout + result.stderr };
}
function passed(script, args = []) {
  const result = command(script, args);
  assert.equal(result.status, 0, result.output);
}
const text = { id: "editor-note", type: "text", visible: true, preset: "media-left", title: "Edited media note",
  description: "An independently asserted editing example.", media: { path: "favicon.svg", alt: "Edited portfolio mark" } };
const cards = { id: "editor-cards", type: "cards", visible: true, preset: "standard", title: "Added evidence cards",
  cards: [{ id: "evidence-example", title: "Shared evidence example", description: "Reused report destination",
    evidence: [{ projectId: "regulus", evidenceId: "android-reports", label: "Inspect shared report" }] }] };

async function order(before, after) {
  const handle = await after.elementHandle();
  assert(await before.evaluate((node, target) => !!(node.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING), handle));
}
async function layouts(page, side) {
  const widths = [1366, 1280, 1024, 901, 900, 899, 820, 768, 640, 430, 390, 360, 320, 1366];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const project of await page.locator(".project-grid").all()) {
      const heading = project.locator(".project-title");
      const media = project.locator(".game-gallery");
      const details = project.locator(".project-details");
      await order(heading, media); await order(media, details);
      const h = await heading.boundingBox(), m = await media.boundingBox(), d = await details.boundingBox();
      if (width <= 900) {
        assert(m.y >= h.y + h.height && d.y >= m.y + m.height, `${width}: title/media/details`);
      } else if (side === "media-left") assert(m.x + m.width <= d.x + 1, `${width}: media left`);
      else assert(d.x + d.width <= m.x + 1, `${width}: media right`);
      const capture = project.locator(".capture-media");
      if (await capture.count()) {
        const c = await capture.boundingBox();
        assert(c.y >= (width <= 900 ? d.y + d.height : m.y + m.height), `${width}: distinct secondary evidence`);
        assert(Math.abs(c.x - m.x) < 1, `${width}: capture shares media column`);
      }
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: no horizontal overflow`);
  }
}
async function addedSections(page, base) {
  for (const route of ["/", "/skills", "/about-me"]) {
    await page.goto(new URL(`#${route}`, base).href);
    const main = page.getByRole("main");
    await main.getByRole("heading", { name: "Edited media note", exact: true }).waitFor();
    assert.equal(await page.locator('meta[name="description"]').getAttribute("content"), 'Edited metadata < & " example');
    assert((await page.locator('link[rel="icon"]').getAttribute("href")).endsWith("images/linkedin-in-white.png"));
    assert.equal(await main.getByText("An independently asserted editing example.", { exact: true }).count(), 1);
    assert.equal(await main.getByText("Hidden editor text", { exact: true }).count(), 0);
    const image = main.getByRole("img", { name: "Edited portfolio mark", exact: true });
    assert((await image.getAttribute("src")).endsWith("favicon.svg"));
    await order(main.getByRole("heading", { name: "Edited media note", exact: true }), image);
    await order(image, main.getByText("An independently asserted editing example.", { exact: true }));
    await order(image, main.getByRole("heading", { name: "Added evidence cards", exact: true }));
    const link = main.getByRole("link", { name: /Inspect shared report/ });
    assert.equal(await link.getAttribute("href"), "#/skills?evidence=android-reports");
    for (const width of [1366, 901, 900, 899, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const img = await image.boundingBox();
      const p = await main.getByText("An independently asserted editing example.", { exact: true }).boundingBox();
      if (width > 900) assert(img.x + img.width <= p.x + 1, "Text media-left preset");
      else assert(img.y + img.height <= p.y + 1, "Text stacked order");
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await link.focus(); assert(await link.evaluate(node => node === document.activeElement));
    }
    await link.click();
    await page.waitForFunction(() => document.activeElement?.id === "android-reports");
  }
}
let failure;
let browser, preview, development;
try {
  const definitions = structuredClone(await loadContentDefinitions());
  definitions.siteContent.identity.description = 'Edited metadata < & " example';
  definitions.siteContent.identity.icon = "images/linkedin-in-white.png";
  definitions.siteContent.interface.closeEvidence = "Close edited evidence";
  for (const page of [definitions.portfolioPage, definitions.skillsPage, definitions.aboutMePage]) {
    page.sections.unshift(structuredClone(text), structuredClone(cards),
      { ...text, id: "hidden-editor", visible: false, description: "Hidden editor text" });
  }
  for (const section of definitions.portfolioPage.sections) if (section.type === "project") section.preset = "media-left";
  for (const name of ["portfolioPage", "skillsPage", "aboutMePage", "siteContent", "projects", "evidence"])
    await writeDefinition(name, definitions[name]);
  const invalid = structuredClone(definitions.skillsPage);
  invalid.sections.find(s => s.type === "evidence").visible = false;
  await writeDefinition("skillsPage", invalid);
  for (const script of ["build", "dev"]) {
    const result = command(script, script === "dev" ? ["--help"] : []);
    assert.notEqual(result.status, 0, result.output);
    assert.match(result.output, /evidenceId: live reference targets hidden.*android-reports.*data\.ts/);
  }
  await writeDefinition("skillsPage", definitions.skillsPage);
  passed("build");
  preview = await startPreview();
  browser = await chromium.launch({ headless: true });
  await withBrowserContext(browser, { viewport: { width: 1366, height: 900 }, reducedMotion: "reduce" }, async context => {
    const page = await context.newPage();
    await addedSections(page, preview.url);
    await page.goto(preview.url);
    await layouts(page, "media-left");
  });
  preview.kill(); await new Promise(resolve => preview.once("exit", resolve)); preview = undefined;
  // The real development workflow retains surviving selections and inspection while editing presentation.
  development = await createServer({ root: repositoryRoot, server: { host: "127.0.0.1", port: 0 } });
  await development.listen();
  await withBrowserContext(browser, { viewport: { width: 1366, height: 900 }, reducedMotion: "reduce" }, async context => {
    const page = await context.newPage();
    await page.goto(development.resolvedUrls.local[0]);
    const gallery = page.locator(".placeholder-project").first().locator(".game-gallery");
    await gallery.locator(".gallery-thumbnail").nth(2).click();
    await waitForPhoto(gallery);
    const source = await gallery.locator('.gallery-thumbnail[aria-pressed="true"] img').getAttribute("src");
    await gallery.locator(".gallery-photo").click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(await dialog.getByRole("button", { name: "Close edited evidence", exact: true }).count(), 1);
    for (const section of definitions.portfolioPage.sections) if (section.type === "project") section.preset = "media-right";
    await writeDefinition("portfolioPage", definitions.portfolioPage);
    await page.locator(".project-preset--media-right").first().waitFor();
    assert(await dialog.isVisible(), "Preset edit keeps image inspection open");
    assert.equal(await dialog.locator("img").getAttribute("src"), source);
    await page.keyboard.press("Escape"); await dialog.waitFor({ state: "detached" });
    assert(await gallery.locator(".gallery-photo").evaluate(node => node === document.activeElement));
    const reordered = definitions.projects.find(project => project.id === "invictus-lost-soul");
    reordered.media.reverse();
    reordered.media.find(item => item.id === "mock-3").label = "Edited surviving image";
    await writeDefinition("projects", definitions.projects);
    await gallery.getByRole("button", { name: "Show edited surviving image", exact: true }).waitFor();
    assert.equal(await gallery.locator('.gallery-thumbnail[aria-pressed="true"] img').getAttribute("src"), source);
    await layouts(page, "media-right");
    assert.equal(await gallery.locator('.gallery-thumbnail[aria-pressed="true"] img').getAttribute("src"), source);
    await page.getByRole('navigation').getByRole('link', { name: 'Skills', exact: true }).click();
    const reportAction = page.locator('#android-reports .evidence-open');
    await reportAction.click(); await dialog.waitFor();
    const reportBody = dialog.frameLocator("iframe").locator("body");
    await reportBody.waitFor();
    await reportBody.evaluate(() => window.scrollTo(0, 400));
    await page.waitForFunction(() => document.querySelector("dialog iframe")?.contentWindow?.scrollY >= 390);
    definitions.skillsPage.sections.reverse();
    definitions.skillsPage.sections.find(s => s.type === 'evidence').evidence.reverse();
    await writeDefinition("skillsPage", definitions.skillsPage);
    await page.waitForFunction(() => document.querySelector('.performance-evidence')?.id === 'pix-capture');
    assert(await dialog.isVisible(), 'Reordering Skills sections and evidence rows retains report inspection');
    await page.setViewportSize({ width: 900, height: 900 });
    assert(await reportBody.evaluate(() => window.scrollY >= 390));
    await page.keyboard.press("Escape"); await dialog.waitFor({ state: "detached" });
    assert(await reportAction.evaluate(node => node === document.activeElement));
    await reportAction.click(); await dialog.waitFor();
    await page.waitForFunction(() => document.querySelector("dialog iframe")?.contentWindow?.scrollY >= 390);
    await page.keyboard.press("Escape"); await dialog.waitFor({ state: "detached" });
    await page.getByRole('navigation').getByRole('link', { name: 'Portfolio', exact: true }).click();
    for (const section of definitions.portfolioPage.sections) if (section.type === 'project') section.preset = 'media-left';
    definitions.portfolioPage.sections.find(section => section.projectId === "regulus").preset = "standard";
    await writeDefinition("portfolioPage", definitions.portfolioPage);
    definitions.projects.find(project => project.id === "regulus").media = [];
    await writeDefinition("projects", definitions.projects);
    await page.locator(".regulus-showcase .game-gallery").waitFor({ state: "detached" });
    assert.equal(await page.locator('.regulus-showcase .skill-evidence').count(), 1, 'Omitting gameplay retains the Skills link');
    for (const [name, route] of [["portfolioPage", "/"], ["skillsPage", "/skills"], ["aboutMePage", "/about-me"]]) {
      await page.goto(new URL(`#${route}`, development.resolvedUrls.local[0]).href);
      const section = definitions[name].sections.find(s => s.id === "editor-note");
      section.preset = "media-right";
      await writeDefinition(name, definitions[name]);
      await page.locator(".content-section--media-right").waitFor();
      await page.setViewportSize({ width: 1366, height: 900 });
      const image = page.getByRole("img", { name: "Edited portfolio mark", exact: true });
      const copy = page.getByText("An independently asserted editing example.", { exact: true });
      const i = await image.boundingBox(), p = await copy.boundingBox();
      assert(p.x + p.width <= i.x + 1, "Text media-right preset");
      section.preset = "standard";
      delete section.media;
      await writeDefinition(name, definitions[name]);
      await image.waitFor({ state: "detached" });
      const heading = await page.getByRole("heading", { name: "Edited media note", exact: true }).boundingBox();
      const body = await copy.boundingBox();
      assert(body.y - heading.y - heading.height < 35, "Omitted optional media leaves natural text spacing");
    }
  });
  console.log("PASS: all-page additions/order/visibility/evidence reuse; all showcase presets; 899/900/901px and responsive matrix; live preset/label/media-order edits retain selections and inspection.");
} catch (error) { failure = error; } finally {
  try { await browser?.close(); } finally {
    await development?.close();
    if (preview?.exitCode === null) { preview.kill(); await new Promise(resolve => preview.once("exit", resolve)); }
    await contentEditor.restore();
    const restored = command("build");
    if (restored.status !== 0) failure = new AggregateError([failure, new Error(restored.output)].filter(Boolean), "Canonical build could not be restored.");
  }
}
if (failure) throw failure;
