import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { startPreview } from "./browser/preview-server.mjs";
import { withBrowserContext } from "./browser/run-browser-check.mjs";
import { loadContentDefinitions, repositoryRoot } from "./content-validation.mjs";

import { contentPath, createContentEditor, writeContentFixture } from "./content-editing-fixture.mjs";
const directory = path.dirname(contentPath);
const contentEditor = await createContentEditor();
async function writeDefinitions(target, definitions) {
  if (target !== directory) return writeContentFixture(target, definitions);
  for (const name of ["siteContent", "portfolioPage", "projects", "evidence", "skillsPage", "aboutMePage"])
    await contentEditor.write(name, definitions[name]);
}

function command(script, args = []) {
  if (script === "validate:content") {
    const result = spawnSync(process.execPath, ["scripts/validate-content.mjs", ...args], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true });
    if (result.error) throw result.error;
    return { status: result.status, output: (result.stdout ?? "") + (result.stderr ?? "") };
  }
  const result = spawnSync("npm", ["run", script, ...(args.length ? ["--", ...args] : [])], { cwd: repositoryRoot, encoding: "utf8", shell: process.platform === "win32", windowsHide: true });
  if (result.error) throw result.error;
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}
async function invalidEdits(definitions) {
  await mkdir(path.join(repositoryRoot, ".scratch"), { recursive: true });
  const disposable = await mkdtemp(path.join(repositoryRoot, ".scratch/skills-content-"));
  try {
    await cp(contentPath, path.join(disposable, "data.ts"));
    const variants = [
      [v => { v.skillsPage.sections[0].cards[1].evidence[0].evidenceId = "missing"; }, /data\.ts.*performance-investigation.*evidence\[0\].evidenceId: unknown evidence/],
      [v => { v.skillsPage.sections[0].cards[1].evidence[0].projectId = "missing"; }, /data\.ts.*performance-investigation.*projectId: unknown project/],
      [v => { v.skillsPage.sections[0].cards[1].evidence[1].projectId = "regulus"; }, /data\.ts.*evidenceId: evidence does not belong/],
      [v => { v.skillsPage.sections[1].id = "capabilities"; }, /data\.ts.*id: duplicate record identity/],
      [v => { v.skillsPage.sections[0].cards[1].id = "functional-testing"; }, /data\.ts.*cards.*id: duplicate record identity/],
      [v => { v.skillsPage.sections[0].cards[1].evidence.push(v.skillsPage.sections[0].cards[1].evidence[0]); }, /data\.ts.*evidenceId: duplicate evidence reference/],
      [v => { v.skillsPage.sections[0].preset = "wide"; }, /data\.ts.*capabilities.*preset: unsupported/],
      [v => { v.skillsPage.sections[0].type = "carousel"; }, /data\.ts.*type: unsupported section/],
      [v => { v.skillsPage.sections[0].cards[0].description = ""; }, /data\.ts.*functional-testing.*description: required/],
      [v => { v.skillsPage.sections[0].visible = "yes"; }, /data\.ts.*visible: required boolean/],
      [v => { v.evidence[0].destination = "javascript:alert(1)"; }, /data\.ts.*android-reports.*destination: malformed or unresolved/],
      [v => { v.evidence[1].destination = "/?evidence=missing"; }, /data\.ts.*pix-capture.*destination: malformed or unresolved/],
      [v => { v.evidence[0].destination = "/?evidence=android-reports&evidence=pix-capture"; }, /data\.ts.*destination: malformed or unresolved/],
      [v => { v.portfolioPage.sections[0].visible = false; }, /data\.ts.*evidenceId: live reference targets hidden/],
      [v => { v.portfolioPage.sections.find(section => section.projectId === "vecchio-furioso").visible = false; }, /data\.ts.*evidenceId: live reference targets hidden/],
    ];
    for (const [edit, diagnostic] of variants) {
      const invalid = structuredClone(definitions);
      edit(invalid);
      await writeDefinitions(disposable, invalid);
      const result = command("validate:content", ["--definitions", disposable]);
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, diagnostic);
    }
    const captureAssociation = structuredClone(definitions);
    captureAssociation.skillsPage.sections[0].cards[1].evidence[1].projectId = "vecchio-furioso";
    await writeDefinitions(disposable, captureAssociation);
    const associated = command("validate:content", ["--definitions", disposable]);
    assert.equal(associated.status, 0, associated.output);
    // Removing the incoming live links makes hiding the report showcase valid.
    const hidden = structuredClone(definitions);
    hidden.portfolioPage.sections[0].visible = false;
    hidden.portfolioPage.sections.find(section => section.projectId === "vecchio-furioso").visible = false;
    hidden.skillsPage.sections.forEach(section => { section.visible = false; });
    await writeDefinitions(disposable, hidden);
    const result = command("validate:content", ["--definitions", disposable]);
    assert.equal(result.status, 0, result.output);
    console.log(`PASS: ${variants.length} invalid Skills/shared destination edits fail command validation with file/record/field context; hidden links do not count as live references.`);
  } finally { await rm(disposable, { recursive: true, force: true }); }
}
async function renderedEdits() {
  const preview = await startPreview();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    await withBrowserContext(browser, { viewport: { width: 1366, height: 900 } }, async context => {
      const page = await context.newPage();
      const visit = async route => { await page.goto(new URL(`#${route}`, preview.url).href); };
      await visit("/skills");
      await page.getByRole("heading", { name: "Edited Skills", exact: true }).waitFor();
      await page.waitForFunction(() => document.title === "Edited Skills · Komed's Portfolio");
      assert.equal(await page.getByRole("link", { name: "Skills", exact: true }).getAttribute("aria-current"), "page");
      assert.equal(await page.getByText("A page description edited through the Skills definition.", { exact: true }).count(), 1);
      const main = page.getByRole("main");
      assert.deepEqual(await main.getByRole("heading", { level: 2 }).allTextContents(), ["Edited tools", "Added text", "QA capabilities", "Added cards"]);
      assert.equal(await main.getByText("Hidden copy", { exact: true }).count(), 0);
      assert.equal(await main.getByText("Edited capability description", { exact: true }).count(), 1);
      assert.equal(await main.getByText("Edited tool description", { exact: true }).count(), 1);
      assert.equal(await main.getByText("Added card description", { exact: true }).count(), 1);
      const links = main.getByRole("link");
      assert.deepEqual(await links.allTextContents().then(items => items.map(s => s.trim())), ["Edited Android evidence Inspect", "Vecchio Furioso · Microsoft PIX GPU capture Inspect", "Edited Android evidence Inspect", "Vecchio Furioso · Microsoft PIX GPU capture Inspect", "Added project evidence Inspect"]);
      // DOM and keyboard order follow the edited section list at desktop and mobile widths.
      for (const width of [1366, 900, 390]) {
        await page.setViewportSize({ width, height: 900 });
        const headings = await main.getByRole("heading", { level: 2 }).evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top));
        assert(headings.every((top, index) => index === 0 || top > headings[index - 1]));
        await links.first().focus();
        for (let index = 1; index < await links.count(); index++) {
          await page.keyboard.press("Tab");
          assert(await links.nth(index).evaluate(node => node === document.activeElement));
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      for (const [name, target] of [["Edited Android evidence Inspect", "android-reports"], ["Vecchio Furioso · Microsoft PIX GPU capture Inspect", "pix-capture"]]) {
        await visit("/skills");
        const relevant = main.getByRole("link", { name, exact: true });
        for (const link of await relevant.all()) assert.equal(await link.getAttribute("href"), `#/?context=edited&evidence=${target}`);
        await relevant.first().click();
        await page.waitForFunction(id => document.activeElement?.id === id, target);
        const opener = target === "android-reports" ? page.locator("#android-reports .report-preview") : page.locator("#pix-capture button");
        await opener.click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        const original = await dialog.getByRole("link", { name: "Open original in new tab" }).getAttribute("href");
        assert(original.endsWith(target === "android-reports" ? "S10_High_Fixed.html" : "vecchio-furioso-pix.png"));
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "detached" });
        assert(await opener.evaluate(node => node === document.activeElement));
      }
      // Portfolio uses the same edited report asset as the Skills entry point.
      await visit("/");
      await page.locator("#android-reports .report-preview").click();
      assert((await page.getByRole("dialog").getByRole("link", { name: "Open original in new tab" }).getAttribute("href")).endsWith("S10_High_Fixed.html"));
      await page.keyboard.press("Escape");
      await visit("/about");
      await page.getByRole("heading", { name: "Edited Skills", exact: true }).waitFor();
    });
  } finally {
    try { await browser?.close(); } finally {
      if (preview.exitCode === null) { preview.kill(); await new Promise(resolve => preview.once("exit", resolve)); }
    }
  }
}
let failure;
try {
  const definitions = await loadContentDefinitions();
  await invalidEdits(definitions);
  const edited = structuredClone(definitions);
  const page = edited.skillsPage;
  page.title = "Edited Skills";
  page.description = "A page description edited through the Skills definition.";
  page.evidenceActionSuffix = "Inspect";
  page.sections[0].cards[0].description = "Edited capability description";
  page.sections[1].title = "Edited tools";
  page.sections[1].cards[0].description = "Edited tool description";
  const text = { id: "added-text", type: "text", title: "Added text", description: "A supported text section.", preset: "standard", visible: true };
  page.sections = [page.sections[1], text, page.sections[0], { ...text, id: "hidden-text", title: "Hidden section", description: "Hidden copy", visible: false }, { id: "added-cards", type: "cards", title: "Added cards", preset: "standard", visible: true, cards: [{ id: "added-card", title: "Added card", description: "Added card description", evidence: [{ projectId: "regulus", evidenceId: "android-reports", label: "Added project evidence" }] }] }];
  edited.evidence[0].label = "Edited Android evidence";
  for (const record of edited.evidence) record.destination = `/?context=edited&evidence=${record.anchor}`;
  edited.evidence[0].reports[0].path = "Performance-Testing-Mobile/Full Report/S10_High_Fixed.html";
  await writeDefinitions(directory, edited);
  const invalid = structuredClone(edited);
  invalid.skillsPage.sections[2].cards[1].evidence[0].evidenceId = "missing";
  await writeDefinitions(directory, invalid);
  for (const script of ["build", "dev"]) {
    const rejected = command(script, script === "dev" ? ["--help"] : []);
    assert.notEqual(rejected.status, 0, rejected.output);
    assert.match(rejected.output, /data\.ts.*performance-investigation.*evidenceId: unknown evidence/);
  }
  await writeDefinitions(directory, edited);
  const result = command("build");
  assert.equal(result.status, 0, result.output);
  await renderedEdits();
} catch (error) { failure = error; } finally {
  await contentEditor.restore();
  const restored = command("build");
  if (restored.status !== 0) failure = new AggregateError([failure, new Error(restored.output)].filter(Boolean), "Canonical production build could not be restored.");
}
if (failure) throw failure;
console.log("PASS: Skills copy/actions, shared destinations/report asset, section addition/order/visibility, responsive keyboard order, legacy redirect, and evidence inspection workflow; canonical content/build restored.");
