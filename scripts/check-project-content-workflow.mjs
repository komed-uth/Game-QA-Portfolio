import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { startPreview } from "./browser/preview-server.mjs";
import { withBrowserContext } from "./browser/run-browser-check.mjs";
import { loadContentDefinitions, repositoryRoot } from "./content-validation.mjs";
import { installVideoFixture } from "./browser/fixtures/youtube-provider.mjs";
import { waitForPhoto } from "./browser/gallery-photo-ready.mjs";

import { contentPath, createContentEditor, writeContentFixture } from "./content-editing-fixture.mjs";
const contentDirectory = path.dirname(contentPath);
const contentEditor = await createContentEditor();
async function writeDefinitions(target, definitions) {
  if (target !== contentDirectory) return writeContentFixture(target, definitions);
  for (const name of ["siteContent", "portfolioPage", "projects", "evidence", "skillsPage", "aboutMePage"])
    await contentEditor.write(name, definitions[name]);
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
    await cp(contentPath, path.join(directory, "data.ts"));
    const variants = [
      ["unknown project", value => { value.portfolioPage.sections[0].projectId = "missing"; }, /data\.ts.*projectId: unknown project/],
      ["unknown evidence", value => { value.projects[0].reportEvidenceId = "missing"; }, /data\.ts.*reportEvidenceId: unknown evidence/],
      ["missing copy", value => { value.projects[0].details[0].value = ""; }, /data\.ts.*details.*value: required/],
      ["invalid media", value => { value.projects[0].media[0].videoId = "bad"; }, /data\.ts.*videoId: expected/],
      ["media kind", value => { value.projects[0].media[1].type = "audio"; }, /data\.ts.*type: unsupported media/],
      ["multiple videos", value => { value.projects[0].media.push({ ...value.projects[0].media[0], id: "second-video" }); }, /data\.ts.*at most one video/],
      ["missing asset", value => { value.projects[0].media[1].path = "images/missing.png"; }, /data\.ts.*path: local media file does not exist/],
      ["traversal", value => { value.projects[0].media[1].path = "../public/favicon.svg"; }, /data\.ts.*path: must stay within/],
      ["store destination", value => { value.projects[0].stores[0].destination = "javascript:alert(1)"; }, /data\.ts.*destination: malformed/],
      ["report default", value => { value.evidence[0].defaultReportId = "Ultra"; }, /data\.ts.*defaultReportId: invalid report default/],
      ["report asset", value => { value.evidence[0].reports[0].path = "missing.html"; }, /data\.ts.*reports.*path: local media file does not exist/],
      ["duplicate evidence", value => { value.evidence.push(structuredClone(value.evidence[0])); }, /data\.ts.*id: duplicate record identity/],
      ["duplicate report", value => { value.evidence[0].reports[1].id = value.evidence[0].reports[0].id; }, /data\.ts.*reports.*id: duplicate record identity/],
      ["duplicate anchor", value => { value.projects[0].headingId = "pc-project-title"; }, /data\.ts.*headingId: duplicate rendered anchor/],
      ["unresolved capture", value => { value.evidence[1].anchor = "missing"; value.evidence[1].destination = "/?evidence=missing"; }, /data\.ts.*anchor: preserve the established/],
      ["malformed internal link", value => { value.evidence[0].destination = "/?evidence=missing"; }, /data\.ts.*destination: malformed or unresolved/],
      ["hidden live evidence", value => { value.portfolioPage.sections[0].visible = false; }, /data\.ts.*evidenceId: live reference targets hidden/],
      ["duplicate project", value => { value.projects.push(structuredClone(value.projects[1])); }, /data\.ts.*id: duplicate record identity/],
      ["missing Father media", value => { value.projects[1].media[1].path = "images/missing.png"; }, /data\.ts.*father-son.*path: local media file does not exist/],
      ["missing placeholder media", value => { value.projects[3].media[0].path = "images/missing.svg"; }, /data\.ts.*invictus-lost-soul.*path: local media file does not exist/],
      ["capture asset", value => { value.evidence[1].path = "images/missing.png"; }, /data\.ts.*pix-capture.*path: local media file does not exist/],
      ["capture destination", value => { value.evidence[1].destination = "javascript:bad"; }, /data\.ts.*pix-capture.*destination: malformed/],
      ["hidden capture", value => { value.skillsPage.sections.find(s => s.type === "evidence").visible = false; }, /data\.ts.*evidenceId: live reference targets hidden/],
      ["wrong capture kind", value => { value.projects[2].captureEvidenceId = "android-reports"; }, /data\.ts.*captureEvidenceId: unknown evidence/],
      ["external media destination", value => { value.projects[1].media[1] = { ...value.projects[1].media[1], path: undefined, url: "javascript:bad" }; }, /data\.ts.*url: malformed/],
      ["ambiguous image source", value => { value.projects[1].media[1].url = "https://media.example.test/image.png"; }, /data\.ts.*path: choose either/],
      ["duplicate selected project", value => { value.portfolioPage.sections.push({ ...value.portfolioPage.sections[1], id: "second-father" }); }, /data\.ts.*headingId: duplicate rendered anchor/],
      ["unsupported preset", value => { value.portfolioPage.sections[0].preset = "unknown"; }, /data\.ts.*preset: unsupported project/],
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
      await installVideoFixture(context);
      await context.route("https://media.example.test/panel.svg", route => route.fulfill({
        contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><text y="50">Placeholder project content</text></svg>',
      }));
      const page = await context.newPage();
      await page.goto(preview.url);
      const project = page.locator(".regulus-showcase");
      await project.getByRole("heading", { name: "Regulus edited title", exact: true }).waitFor();
      assert.equal(await project.getByText("A project overview edited in the shared definition.", { exact: true }).count(), 1);
      assert.equal(await project.getByRole("link", { name: "Edited store destination ↗" }).getAttribute("href"), "https://store.example.test/regulus");
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
      await page.getByRole("navigation").getByRole("link", { name: "Portfolio", exact: true }).click();
      assert.equal(await page.locator(".placeholder-project").count(), 3);
      await checkRemainingEdits(page, preview.url);
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

async function checkRemainingEdits(page, previewUrl) {
  // Serve the built app under a subfolder without rewriting its relative references.
  await page.context().route("**/portfolio-fixture/**", async route => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace(/^\/portfolio-fixture\//, "/");
    const response = await route.fetch({ url: url.href });
    await route.fulfill({ response });
  });
  for (const prefix of ["", "portfolio-fixture/"]) {
    await page.goto(new URL(prefix, previewUrl).href);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const showcases = page.locator("main .project-grid");
    const expected = ["Edited placeholder title", "Father edited title", "Regulus edited title", "MeowMoney", "Vecchio Furioso", "The Collectors"];
    assert.deepEqual(await showcases.locator(".project-title").allTextContents(), expected, "Definition order is rendered reading order");
    const father = page.locator(".video-project");
    assert.equal(await father.getByText("Real project overview edited through the shared definition.", { exact: true }).count(), 1);
    assert.match(await father.locator("iframe").getAttribute("src"), /abcdefghijk/);
    await father.locator(".gallery-thumbnail").nth(1).click();
    await waitForPhoto(father.locator(".game-gallery"));
    assert.equal(await father.locator(".gallery-photo img").getAttribute("alt"), "Edited Father alternative");
    assert((await father.locator(".gallery-photo img").getAttribute("src")).endsWith("images/father-son-holy-guns/combat-effects.png"));
    const placeholder = showcases.first();
    await waitForPhoto(placeholder.locator(".game-gallery"));
    assert.equal(await placeholder.locator(".gallery-photo img").getAttribute("src"), "https://media.example.test/panel.svg");
    assert.equal(await placeholder.locator(".gallery-photo img").getAttribute("alt"), "Edited placeholder alternative");
    assert.equal(await placeholder.getByText("Placeholder project content. Edited designed panels remain unverified.", { exact: true }).count(), 1);
    assert.deepEqual(await placeholder.locator(".project-detail-label").allTextContents(), ["Project overview", "My role", "Responsibilities", "Platforms"]);
    await placeholder.locator(".gallery-thumbnail").nth(1).click();
    await waitForPhoto(placeholder.locator(".game-gallery"));
    assert.equal(await father.locator('.gallery-thumbnail[aria-pressed="true"]').getAttribute("aria-label"), await father.locator(".gallery-thumbnail").nth(1).getAttribute("aria-label"), "Gallery selection stays independent after reordering");
    const pc = page.locator(".pc-project");
    assert.equal(await pc.locator(".game-gallery").count(), 0);
    assert.equal(await pc.getByRole("link", { name: "Vecchio Furioso on Steam ↗", exact: true }).getAttribute("href"), "https://store.example.test/vecchio");
    await pc.getByRole("link", { name: /Microsoft PIX GPU capture/ }).click();
    const capture = page.getByRole("button", { name: "Inspect edited PIX", exact: true });
    assert.equal(await capture.locator("img").getAttribute("alt"), "Edited PIX alternative");
    await capture.click();
    const dialog = page.getByRole("dialog", { name: "Edited PIX inspection" });
    await dialog.waitFor();
    const source = await dialog.locator("img").getAttribute("src");
    assert(source.endsWith("images/regulus/shop.jpg"));
    assert((await page.request.get(new URL(source, page.url()).href)).ok(), "Edited local original resolves under hosting base");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert(await capture.evaluate(e => e === document.activeElement), "PIX restores its independent opener");
    await page.getByRole("navigation").getByRole("link", { name: "Portfolio", exact: true }).click();
    await father.locator(".gallery-thumbnail").nth(1).click();
    await waitForPhoto(father.locator(".game-gallery"));
    for (const width of [360, 390, 845, 840, 800, 1200, 899, 900, 901, 1366, 1920, 390, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(await showcases.locator(".project-title").allTextContents(), expected);
      assert.equal(await father.locator(".gallery-photo img").getAttribute("alt"), "Edited Father alternative", "Resize keeps selection");
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No page overflow");
      const meow = page.locator('[aria-labelledby="meowmoney-title"]');
      assert.equal(await meow.locator(".game-gallery").count(), 0, "Optional media leaves no gallery frame");
      const spacing = await meow.evaluate(e => {
        const heading = e.querySelector("header").getBoundingClientRect();
        const details = e.querySelector(".project-details").getBoundingClientRect();
        return details.top - heading.bottom;
      });
      assert(Math.abs(spacing - (width <= 900 ? 24 : 20)) < 1, "Omitted placeholder media leaves natural spacing");
      if (width <= 900) {
        for (const section of [father, placeholder]) {
          const order = await section.evaluate(e => [e.querySelector("header"), e.querySelector(".game-gallery"), e.querySelector(".project-details")].map(el => el.getBoundingClientRect().top));
          assert(order[0] < order[1] && order[1] < order[2], "Narrow title/media/details order survives a page reorder");
        }
      }
    }
    // Crossing each section boundary with Tab follows the configured showcase order.
    const interactiveSections = [0, 1, 2, 4, 5]; // Text-only MeowMoney has no tab stop.
    for (let index = 0; index < interactiveSections.length - 1; index++) {
      await showcases.nth(interactiveSections[index]).evaluate(e => {
        const focusable = [...e.querySelectorAll('a[href],button:not([disabled]),iframe')].filter(el => el.getClientRects().length);
        focusable.at(-1).focus();
      });
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement.closest(".project-grid")?.querySelector(".project-title").textContent), expected[interactiveSections[index + 1]], "Keyboard traversal follows configured order");
    }
    await page.goto(new URL(prefix + "#/skills", previewUrl).href);
    await page.getByRole("link", { name: "Vecchio Furioso · Microsoft PIX GPU capture →", exact: true }).first().click();
    await page.locator("#pix-capture").waitFor();
    assert(await page.locator("#pix-capture").evaluate(e => e === document.activeElement), "Skills still resolves PIX after reordering");
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
  const father = edited.projects.find(p => p.id === "father-son");
  father.name = "Father edited title";
  father.details[0].value = "Real project overview edited through the shared definition.";
  father.media[0].videoId = "abcdefghijk";
  [father.media[1], father.media[2]] = [father.media[2], father.media[1]];
  Object.assign(father.media[1], { path: "images/father-son-holy-guns/combat-effects.png", label: "Edited Father photo", alt: "Edited Father alternative" });
  const pc = edited.projects.find(p => p.id === "vecchio-furioso");
  pc.media = [];
  pc.stores[0].destination = "https://store.example.test/vecchio";
  Object.assign(edited.evidence[1], { path: "images/regulus/shop.jpg", alt: "Edited PIX alternative", title: "Edited PIX inspection", openLabel: "Inspect edited PIX" });
  const placeholder = edited.projects.find(p => p.id === "invictus-lost-soul");
  placeholder.name = "Edited placeholder title";
  placeholder.details[0].value = "Placeholder project content. Edited designed panels remain unverified.";
  placeholder.media = [{ id: "external-panel", type: "image", url: "https://media.example.test/panel.svg", label: "Edited external panel", alt: "Edited placeholder alternative" }, placeholder.media[1]];
  edited.projects.find(p => p.id === "meowmoney").media = [];
  const sections = edited.portfolioPage.sections;
  edited.portfolioPage.sections = [sections[3], sections[1], sections[0], sections[5], sections[2], sections[4]];
  await writeDefinitions(contentDirectory, edited);
  const editedBuild = build();
  assert.equal(editedBuild.status, 0, editedBuild.output);
  await checkRenderedEdits();
} catch (error) {
  failure = error;
} finally {
  await contentEditor.restore();
  const restored = build();
  if (restored.status !== 0) failure = new AggregateError([failure, new Error(restored.output)].filter(Boolean), "Canonical production build could not be restored.");
}
if (failure) throw failure;
console.log("PASS: all six showcases, real/placeholder edits, Portfolio reordering, optional/external media, PIX inspection, hosting base, and shared project copy/media/order/store edits, report-label rename/default/both openers, responsive order, and Android/PIX evidence destinations.");
