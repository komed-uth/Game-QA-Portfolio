import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { startPreview } from "./browser/preview-server.mjs";
import { withBrowserContext } from "./browser/run-browser-check.mjs";
import {
  loadContentDefinitions,
  repositoryRoot,
} from "./content-validation.mjs";

const sitePath = path.join(repositoryRoot, "src", "content", "site.ts");
const aboutMePath = path.join(repositoryRoot, "src", "content", "pages", "aboutMe.ts");

function runNpmScript(name, args = []) {
  const commandArgs = ["run", name, ...(args.length > 0 ? ["--", ...args] : [])];
  const result = spawnSync("npm", commandArgs, {
    cwd: repositoryRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function assertCommandPassed(name, result) {
  assert.equal(result.status, 0, `${name} failed:\n${result.output}`);
}

function contentModuleSource(typeImport, exportName, value) {
  return `import type { ${typeImport} } from "${typeImport === "SiteContent" ? "./types" : "../types"}";\n\nexport const ${exportName}: ${typeImport} = ${JSON.stringify(value, null, 2)};\n`;
}

async function stopProcess(process) {
  if (!process || process.exitCode !== null) return;
  process.kill();
  await new Promise((resolve) => process.once("exit", resolve));
}

function startDevelopmentServer() {
  const process = spawn(
    processExecPath,
    [path.join(repositoryRoot, "node_modules", "vite", "bin", "vite.js"), "--host", "127.0.0.1", "--port", "0"],
    { cwd: repositoryRoot, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  let output = "";
  process.stdout.setEncoding("utf8").on("data", (chunk) => (output += chunk));
  process.stderr.setEncoding("utf8").on("data", (chunk) => (output += chunk));
  return { process, get output() { return output; } };
}

const processExecPath = process.execPath;

async function waitForDevelopmentOutput(server, fragment, startAt = 0) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const recentOutput = server.output.slice(startAt);
    if (recentOutput.includes(fragment)) return recentOutput;
    if (server.process.exitCode !== null) {
      throw new Error(`Development server exited before reporting ${JSON.stringify(fragment)}:\n${server.output}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Development server did not report ${JSON.stringify(fragment)}:\n${server.output}`);
}

async function waitForDevelopmentUrl(server) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const match = server.output.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+\/)/);
    if (match) return match[1];
    if (server.process.exitCode !== null) {
      throw new Error(`Development server exited before becoming ready:\n${server.output}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Development server did not become ready:\n${server.output}`);
}

async function checkRenderedVariant(siteContent, aboutMePage) {
  const preview = await startPreview();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    await withBrowserContext(browser, { viewport: { width: 1366, height: 900 } }, async (context) => {
      const page = await context.newPage();
      const url = new URL("#/about-me", preview.url);
      await page.goto(url.href);
      const main = page.getByRole("main");
      await page.getByRole("heading", { name: aboutMePage.title, exact: true }).waitFor();

      assert.deepEqual(
        await main.getByRole("heading", { level: 2 }).allTextContents(),
        ["Background", "Professional introduction", "Why game QA", "Testing approach", "Contact"],
      );
      assert.equal(
        await main.getByText("A content edit made in the About me definition.", { exact: true }).count(),
        1,
      );
      assert.equal(await main.getByRole("heading", { name: "Career direction", exact: true }).count(), 0);
      assert.equal(
        await main.getByText("A supported text section added without changing a component.", { exact: true }).count(),
        1,
      );

      const aboutContact = main.getByRole("link", { name: "Contact me on LinkedIn (opens in a new tab)" });
      const shellContact = page.getByRole("link", { name: "Komed Uthisanont on LinkedIn (opens in a new tab)" });
      assert.equal(await aboutContact.getAttribute("href"), siteContent.contact.destination);
      assert.equal(await shellContact.getAttribute("href"), siteContent.contact.destination);

      const media = main.locator("img.biography-media");
      assert.equal(await media.count(), 1);
      assert.equal(await media.getAttribute("src"), "./favicon.svg");
      assert.equal(await media.getAttribute("alt"), "Portfolio mark");
      assert.equal(await media.evaluate((image) => image.complete && image.naturalWidth > 0), true);
      assert.equal(await main.locator(".approach-section:not(:has(img))").count(), 4);
      const linkOrder = await page.locator("header nav a, header .linkedin-link, main a").evaluateAll((links) =>
        links.map((link) => link.getAttribute("aria-label") || link.innerText.replace(/\s+/g, " ").trim()),
      );
      assert.deepEqual(linkOrder, [
        "Portfolio",
        "Skills",
        "About me",
        "Komed Uthisanont on LinkedIn (opens in a new tab)",
        "Contact me on LinkedIn (opens in a new tab)",
      ]);
    });
  } finally {
    try {
      await browser?.close();
    } finally {
      await stopProcess(preview);
    }
  }
}

const [originalSiteSource, originalAboutMeSource] = await Promise.all([
  readFile(sitePath, "utf8"),
  readFile(aboutMePath, "utf8"),
]);
let failure;

try {
  const definitions = await loadContentDefinitions();
  const editedSite = structuredClone(definitions.siteContent);
  const editedAboutMe = structuredClone(definitions.aboutMePage);
  editedSite.contact.destination = "https://contact.example.test/profile";

  const introduction = editedAboutMe.sections.find((section) => section.id === "introduction");
  const background = editedAboutMe.sections.find((section) => section.id === "background");
  const careerDirection = editedAboutMe.sections.find((section) => section.id === "direction");
  const contactSection = editedAboutMe.sections.find((section) => section.id === "contact");
  assert(introduction?.type === "text" && background?.type === "text" && careerDirection && contactSection);
  introduction.description = "A content edit made in the About me definition.";
  introduction.media = { path: "favicon.svg", alt: "Portfolio mark" };
  careerDirection.visible = false;
  const addedSection = {
    id: "testing-approach",
    type: "text",
    visible: true,
    preset: "standard",
    title: "Testing approach",
    description: "A supported text section added without changing a component.",
  };
  editedAboutMe.sections = [
    background,
    introduction,
    ...editedAboutMe.sections.filter((section) => !["background", "introduction", "contact"].includes(section.id)),
    addedSection,
    contactSection,
  ];

  await writeFile(sitePath, contentModuleSource("SiteContent", "siteContent", editedSite), "utf8");
  await writeFile(
    aboutMePath,
    contentModuleSource("AboutMePageContent", "aboutMePage", editedAboutMe),
    "utf8",
  );

  assertCommandPassed("npm run validate:content", runNpmScript("validate:content"));
  assertCommandPassed("valid edited content build", runNpmScript("build"));

  const invalidAboutMe = structuredClone(editedAboutMe);
  const invalidIntroduction = invalidAboutMe.sections.find((section) => section.id === "introduction");
  assert(invalidIntroduction?.type === "text");
  invalidIntroduction.preset = "unsupported";
  await writeFile(
    aboutMePath,
    contentModuleSource("AboutMePageContent", "aboutMePage", invalidAboutMe),
    "utf8",
  );

  for (const [name, result] of [
    ["development startup validation", runNpmScript("dev", ["--help"])],
    ["production build validation", runNpmScript("build")],
  ]) {
    assert.notEqual(result.status, 0, `${name} unexpectedly accepted an unsupported preset.`);
    assert.match(
      result.output,
      /aboutMe\.ts: aboutMePage\.sections\["introduction"\]\.preset: unsupported text preset "unsupported"/,
    );
  }

  await writeFile(
    aboutMePath,
    contentModuleSource("AboutMePageContent", "aboutMePage", editedAboutMe),
    "utf8",
  );
  assertCommandPassed("edited content build", runNpmScript("build"));

  const developmentServer = startDevelopmentServer();
  let developmentBrowser;
  try {
    const developmentUrl = await waitForDevelopmentUrl(developmentServer);
    developmentBrowser = await chromium.launch({ headless: true });
    await withBrowserContext(developmentBrowser, { viewport: { width: 1366, height: 900 } }, async (context) => {
      const page = await context.newPage();
      await page.goto(new URL("#/about-me", developmentUrl).href);
      await page.getByText("A content edit made in the About me definition.", { exact: true }).waitFor();

      const invalidVariants = [];
      const missingDescription = structuredClone(editedAboutMe);
      missingDescription.sections.find((section) => section.id === "introduction").description = "";
      invalidVariants.push({
        source: "aboutMe",
        value: missingDescription,
        diagnostic: "description: required non-empty string is missing",
      });

      const unsupportedPreset = structuredClone(editedAboutMe);
      const unsupportedIntroduction = unsupportedPreset.sections.find((section) => section.id === "introduction");
      unsupportedIntroduction.preset = "unsupported";
      unsupportedIntroduction.description = "This invalid edit must be withheld.";
      invalidVariants.push({
        source: "aboutMe",
        value: unsupportedPreset,
        diagnostic: "preset: unsupported text preset \"unsupported\"",
      });

      const duplicateSection = structuredClone(editedAboutMe);
      duplicateSection.sections[1].id = duplicateSection.sections[0].id;
      duplicateSection.sections[0].description = "This invalid edit must be withheld.";
      invalidVariants.push({
        source: "aboutMe",
        value: duplicateSection,
        diagnostic: "duplicate section identity",
      });

      const malformedContact = structuredClone(editedSite);
      malformedContact.contact.destination = "/\\\\other.example";
      invalidVariants.push({
        source: "site",
        value: malformedContact,
        diagnostic: "siteContent.contact.destination: malformed destination",
      });

      const localContactRoute = structuredClone(editedSite);
      localContactRoute.contact.destination = "/skills";
      invalidVariants.push({
        source: "site",
        value: localContactRoute,
        diagnostic: "siteContent.contact.destination: malformed destination",
      });

      const unresolvedNavigation = structuredClone(editedSite);
      unresolvedNavigation.navigation.links[1].destination = "/typo";
      invalidVariants.push({
        source: "site",
        value: unresolvedNavigation,
        diagnostic: "navigation.links[1].destination: malformed destination or unresolved route",
      });

      for (const variant of invalidVariants) {
        const file = variant.source === "aboutMe" ? aboutMePath : sitePath;
        const typeName = variant.source === "aboutMe" ? "AboutMePageContent" : "SiteContent";
        const exportName = variant.source === "aboutMe" ? "aboutMePage" : "siteContent";
        const startAt = developmentServer.output.length;
        await writeFile(file, contentModuleSource(typeName, exportName, variant.value), "utf8");
        await waitForDevelopmentOutput(developmentServer, variant.diagnostic, startAt);
        if (variant.source === "aboutMe") {
          assert.equal(
            await page.getByText("A content edit made in the About me definition.", { exact: true }).count(),
            1,
          );
        } else {
          assert.equal(
            await page.locator("header .linkedin-link").getAttribute("href"),
            editedSite.contact.destination,
          );
        }
      }

      const correctedAboutMe = structuredClone(editedAboutMe);
      correctedAboutMe.sections.find((section) => section.id === "introduction").description =
        "A valid development edit after correction.";
      await Promise.all([
        writeFile(sitePath, contentModuleSource("SiteContent", "siteContent", editedSite), "utf8"),
        writeFile(
          aboutMePath,
          contentModuleSource("AboutMePageContent", "aboutMePage", correctedAboutMe),
          "utf8",
        ),
      ]);
      await page.getByText("A valid development edit after correction.", { exact: true }).waitFor();
    });
  } finally {
    try {
      await developmentBrowser?.close();
    } finally {
      await stopProcess(developmentServer.process);
    }
  }

  await checkRenderedVariant(editedSite, editedAboutMe);
} catch (error) {
  failure = error;
} finally {
  await Promise.all([
    writeFile(sitePath, originalSiteSource, "utf8"),
    writeFile(aboutMePath, originalAboutMeSource, "utf8"),
  ]);
  const restoredBuild = runNpmScript("build");
  if (restoredBuild.status !== 0) {
    const restoreError = new Error(`Could not restore the canonical production build:\n${restoredBuild.output}`);
    if (failure) failure = new AggregateError([failure, restoreError], "Content workflow check failed and the final build did not restore.");
    else failure = restoreError;
  }
}

if (failure) throw failure;
console.log("PASS: About me copy, shared contact, section addition/order/visibility, media, validation, live development updates, build, and browser workflow.");
