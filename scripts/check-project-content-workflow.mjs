import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { startPreview } from "./browser/preview-server.mjs";
import { withBrowserContext } from "./browser/run-browser-check.mjs";
import { loadContentDefinitions, repositoryRoot } from "./content-validation.mjs";

const contentDirectory = path.join(repositoryRoot, "src/content");
const files = { projects: "projects.ts", evidence: "evidence.ts", portfolioPage: "pages/portfolio.ts" };
const types = { projects: "ProjectContent[]", evidence: "EvidenceContent[]", portfolioPage: "PortfolioPageContent" };
const originals = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name, file]) =>
  [name, await readFile(path.join(contentDirectory, file), "utf8")])));

async function writeDefinitions(directory, definitions) {
  for (const [name, file] of Object.entries(files)) {
    const type = types[name];
    const source = `import type { ${type.replace("[]", "")} } from "${name === "portfolioPage" ? "../../" : "../"}content-schema";\n\nexport const ${name}: ${type} = ${JSON.stringify(definitions[name], null, 2)};\n`;
    await writeFile(path.join(directory, file), source);
  }
}

function build() {
  const result = spawnSync("npm", ["run", "build"], { cwd: repositoryRoot, encoding: "utf8", shell: process.platform === "win32", windowsHide: true });
  if (result.error) throw result.error;
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

async function checkInvalidDefinitions(definitions) {
  await mkdir(path.join(repositoryRoot, ".scratch"), { recursive: true });
  const directory = await mkdtemp(path.join(repositoryRoot, ".scratch/project-content-"));
  try {
    await cp(contentDirectory, directory, { recursive: true });
    const variants = [
      ["unknown project", value => { value.portfolioPage.sections[0].projectId = "missing"; }, /portfolio\.ts.*projectId: unknown project/],
      ["unknown evidence", value => { value.projects[0].reportEvidenceId = "missing"; }, /projects\.ts.*reportEvidenceId: unknown evidence/],
      ["missing copy", value => { value.projects[0].details[0].value = ""; }, /projects\.ts.*details.*value: required/],
      ["invalid media", value => { value.projects[0].media[0].videoId = "bad"; }, /projects\.ts.*videoId: expected/],
      ["media kind", value => { value.projects[0].media[1].type = "audio"; }, /projects\.ts.*type: unsupported media/],
      ["multiple videos", value => { value.projects[0].media.push({ ...value.projects[0].media[0], id: "second-video" }); }, /projects\.ts.*at most one video/],
      ["missing asset", value => { value.projects[0].media[1].path = "images/missing.png"; }, /projects\.ts.*path: local media file does not exist/],
      ["traversal", value => { value.projects[0].media[1].path = "../public/favicon.svg"; }, /projects\.ts.*path: must stay within/],
      ["store destination", value => { value.projects[0].stores[0].destination = "javascript:alert(1)"; }, /projects\.ts.*destination: malformed/],
      ["report default", value => { value.evidence[0].defaultReportId = "Ultra"; }, /evidence\.ts.*defaultReportId: invalid report default/],
      ["report asset", value => { value.evidence[0].reports[0].path = "missing.html"; }, /evidence\.ts.*reports.*path: local media file does not exist/],
      ["duplicate evidence", value => { value.evidence.push(structuredClone(value.evidence[0])); }, /evidence\.ts.*id: duplicate record identity/],
      ["duplicate report", value => { value.evidence[0].reports[1].id = value.evidence[0].reports[0].id; }, /evidence\.ts.*reports.*id: duplicate record identity/],
      ["duplicate anchor", value => { value.projects[0].headingId = "pc-project-title"; }, /projects\.ts.*headingId: duplicate rendered anchor/],
      ["unresolved capture", value => { value.evidence[1].anchor = "missing"; value.evidence[1].destination = "/?evidence=missing"; }, /evidence\.ts.*anchor: unresolved unmigrated/],
      ["malformed internal link", value => { value.evidence[0].destination = "/?evidence=missing"; }, /evidence\.ts.*destination: malformed or unresolved/],
      ["hidden live evidence", value => { value.portfolioPage.sections[0].visible = false; }, /evidence\.ts.*destination: live reference targets hidden/],
      ["unsupported preset", value => { value.portfolioPage.sections[0].preset = "unknown"; }, /portfolio\.ts.*preset: unsupported project/],
    ];
    for (const [name, edit, diagnostic] of variants) {
      const invalid = structuredClone(definitions);
      edit(invalid);
      await writeDefinitions(directory, invalid);
      const result = spawnSync(process.execPath, ["scripts/validate-content.mjs", "--definitions", directory], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true });
      assert.equal(result.status, 1, `${name} should fail the normal validation command`);
      assert.match(result.stderr, diagnostic, name);
    }
    console.log(`PASS: ${variants.length} invalid project/evidence/Portfolio edits fail command validation with field context.`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function checkRenderedEdits() {
  const preview = await startPreview();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    await withBrowserContext(browser, { viewport: { width: 1366, height: 900 } }, async context => {
      const page = await context.newPage();
      await page.goto(preview.url);
      const project = page.locator(".regulus-showcase");
      await project.getByRole("heading", { name: "Regulus edited title", exact: true }).waitFor();
      assert.equal(await project.getByText("A project overview edited in the shared definition.", { exact: true }).count(), 1);
      assert.equal(await project.getByRole("link", { name: "Edited store destination (opens in a new tab)" }).getAttribute("href"), "https://store.example.test/regulus");
      const previews = project.locator(".gallery-thumbnail");
      assert.match(await previews.nth(1).getAttribute("aria-label"), /edited boss photo/);
      assert.equal(await previews.nth(1).locator("img").getAttribute("src"), "./images/regulus/shop.jpg");
      await previews.nth(1).click();
      await project.locator('.gallery-photo img[alt="An edited gameplay alternative"]').waitFor();
      assert.equal(await project.getByRole("button", { name: "Ultra", exact: true }).getAttribute("aria-pressed"), "true");
      assert.deepEqual(await project.locator(".report-selector button").allTextContents(), ["Ultra", "High", "Medium", "Low", "Very Low", "Overall"]);
      for (const opener of [project.locator(".report-preview"), project.locator(".report-controls .evidence-open")]) {
        await opener.click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        assert.match(await dialog.locator("h2").textContent(), /^Ultra quality/);
        assert((await dialog.getByRole("link", { name: "Open original in new tab" }).getAttribute("href")).endsWith("S10_Very_High_Fixed.html"));
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "detached" });
        assert(await opener.evaluate(element => element === document.activeElement));
      }
      await page.setViewportSize({ width: 900, height: 1000 });
      assert.equal(await project.getByRole("button", { name: "Ultra", exact: true }).getAttribute("aria-pressed"), "true");
      const order = await project.evaluate(section => {
        const top = selector => section.querySelector(selector).getBoundingClientRect().top;
        return { title: top(".project-heading"), media: top(".game-gallery"), details: top(".project-info"), output: top(".report-output"), controls: top(".report-controls") };
      });
      assert(order.title < order.media && order.media < order.details && order.output < order.controls);
      await page.goto(new URL("#/skills", preview.url).href);
      const androidLink = page.getByRole("link", { name: "Regulus the Advent · Android performance reports →", exact: true }).first();
      await androidLink.click();
      await page.locator("#android-reports").waitFor();
      assert.equal(await page.locator("#android-reports").evaluate(element => element === document.activeElement), true);
      await page.goto(new URL("#/skills", preview.url).href);
      await page.getByRole("link", { name: "Vecchio Furioso · Microsoft PIX GPU capture →", exact: true }).first().click();
      await page.locator("#pix-capture").waitFor();
      assert.equal(await page.locator("#pix-capture").evaluate(element => element === document.activeElement), true);
      assert.equal(await page.locator(".placeholder-project").count(), 3);
    });
  } finally {
    try {
      await browser?.close();
    } finally {
      if (preview.exitCode === null) {
        preview.kill();
        await new Promise(resolve => preview.once("exit", resolve));
      }
    }
  }
}

let failure;
try {
  const definitions = await loadContentDefinitions();
  await checkInvalidDefinitions(definitions);
  const edited = structuredClone(definitions);
  edited.projects[0].name = "Regulus edited title";
  edited.projects[0].details[0].value = "A project overview edited in the shared definition.";
  edited.projects[0].stores[0].destination = "https://store.example.test/regulus";
  edited.projects[0].stores[0].accessibleLabel = "Edited store destination";
  const media = edited.projects[0].media;
  [media[1], media[2]] = [media[2], media[1]];
  Object.assign(media[1], { path: "images/regulus/shop.jpg", label: "Edited boss photo", alt: "An edited gameplay alternative" });
  edited.evidence[0].reports[0].label = "Ultra";
  await writeDefinitions(contentDirectory, edited);
  const editedBuild = build();
  assert.equal(editedBuild.status, 0, editedBuild.output);
  await checkRenderedEdits();
} catch (error) {
  failure = error;
} finally {
  for (const [name, file] of Object.entries(files)) await writeFile(path.join(contentDirectory, file), originals[name]);
  const restored = build();
  if (restored.status !== 0) failure = new AggregateError([failure, new Error(restored.output)].filter(Boolean), "Canonical production build could not be restored.");
}
if (failure) throw failure;
console.log("PASS: shared project copy/media/order/store edits, report-label rename/default/both openers, responsive order, and Android/PIX evidence destinations.");
