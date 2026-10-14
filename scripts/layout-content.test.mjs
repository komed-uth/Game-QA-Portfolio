import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadContentDefinitions, repositoryRoot } from "./content-validation.mjs";

const files = { siteContent: "site.ts", projects: "projects.ts", evidence: "evidence.ts",
  portfolioPage: "pages/portfolio.ts", skillsPage: "pages/skills.ts", aboutMePage: "pages/aboutMe.ts" };
async function fixture(edit, check) {
  await mkdir(path.join(repositoryRoot, ".scratch"), { recursive: true });
  const directory = await mkdtemp(path.join(repositoryRoot, ".scratch/layout-content-"));
  try {
    await cp(path.join(repositoryRoot, "src/content"), directory, { recursive: true });
    const definitions = structuredClone(await loadContentDefinitions());
    edit(definitions);
    for (const [name, file] of Object.entries(files))
      await writeFile(path.join(directory, file), `export const ${name} = ${JSON.stringify(definitions[name])};\n`);
    const result = spawnSync(process.execPath, ["scripts/validate-content.mjs", "--definitions", directory],
      { cwd: repositoryRoot, encoding: "utf8", windowsHide: true });
    assert.ifError(result.error);
    check(result.status, result.stdout + result.stderr);
  } finally { await rm(directory, { recursive: true, force: true }); }
}
const text = { id: "extra-note", type: "text", title: "Extra note", description: "Edited copy",
  visible: true, preset: "media-left", media: { path: "favicon.svg", alt: "Mark" } };

test("all page editing files accept supported additions and media presets through command validation", async () => {
  await fixture(v => {
    v.portfolioPage.sections[0].preset = "media-left";
    v.portfolioPage.sections[1].preset = "media-right";
    for (const page of [v.portfolioPage, v.skillsPage, v.aboutMePage]) page.sections.push(structuredClone(text));
    v.aboutMePage.sections.push({ ...structuredClone(v.skillsPage.sections[0]), id: "extra-cards" });
  }, (status, output) => assert.equal(status, 0, output));
});

test("isolated invalid presets, rendered anchors and destinations identify their editing file and field", async () => {
  const cases = [
    [v => { v.aboutMePage.sections[0].preset = "media-left"; }, /aboutMe\.ts.*introduction.*preset:.*requires.*media/],
    [v => { v.skillsPage.sections[0].preset = "media-right"; }, /skills\.ts.*capabilities.*preset: unsupported/],
    [v => { v.portfolioPage.sections.push({ ...text, id: "regulus" }); }, /portfolio\.ts.*id: duplicate/],
    [v => { v.skillsPage.sections.push({ ...text, id: "capabilities", preset: "standard" }); }, /skills\.ts.*id:.*rendered anchor/],
    [v => { v.aboutMePage.sections.push({ ...text, id: "about-me", preset: "standard" }); }, /aboutMe\.ts.*id:.*rendered heading/],
    [v => { v.siteContent.navigation.links[1].destination = "/skills?evidence=missing"; }, /site\.ts.*destination:.*unresolved/],
    [v => { v.siteContent.navigation.links[0].destination = "/?evidence=missing"; }, /site\.ts.*destination:.*unresolved/],
    [v => { v.siteContent.navigation.links[0].destination = "/?evidence=android-reports"; v.portfolioPage.sections[0].visible = false; v.skillsPage.sections.forEach(s => { s.visible = false; }); }, /site\.ts.*destination:.*hidden.*android-reports/],
    [v => { v.portfolioPage.sections[0].visible = false; }, /skills\.ts.*performance-investigation.*evidence\[0\].*android-reports.*portfolio\.ts.*regulus/],
    [v => { delete v.skillsPage.sections[0].cards[1].evidence[0].projectId; }, /skills\.ts.*projectId: required/],
  ];
  for (const [edit, pattern] of cases) await fixture(edit, (status, output) => {
    assert.equal(status, 1, output); assert.match(output, pattern);
  });
});

test("hiding sections without incoming live references remains valid", async () => {
  await fixture(v => {
    v.portfolioPage.sections[0].visible = false;
    v.skillsPage.sections.forEach(s => { s.visible = false; });
    v.aboutMePage.sections[0].visible = false;
    v.portfolioPage.sections.push({ ...text, visible: false });
  }, (status, output) => assert.equal(status, 0, output));
});
