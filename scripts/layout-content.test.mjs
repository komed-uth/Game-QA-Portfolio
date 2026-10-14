import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadContentDefinitions, repositoryRoot } from "./content-validation.mjs";

import { contentPath, writeContentFixture } from "./content-editing-fixture.mjs";
async function fixture(edit, check) {
  await mkdir(path.join(repositoryRoot, ".scratch"), { recursive: true });
  const directory = await mkdtemp(path.join(repositoryRoot, ".scratch/layout-content-"));
  try {
    await cp(contentPath, path.join(directory, "data.ts"));
    const definitions = structuredClone(await loadContentDefinitions());
    edit(definitions);
    await writeContentFixture(directory, definitions);
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
    [v => { v.aboutMePage.sections[0].preset = "media-left"; }, /data\.ts.*introduction.*preset:.*requires.*media/],
    [v => { v.skillsPage.sections[0].preset = "media-right"; }, /data\.ts.*capabilities.*preset: unsupported/],
    [v => { v.portfolioPage.sections.push({ ...text, id: "regulus" }); }, /data\.ts.*id: duplicate/],
    [v => { v.skillsPage.sections.push({ ...text, id: "capabilities", preset: "standard" }); }, /data\.ts.*id:.*rendered anchor/],
    [v => { v.aboutMePage.sections.push({ ...text, id: "about-me", preset: "standard" }); }, /data\.ts.*id:.*rendered heading/],
    [v => { v.siteContent.navigation.links[1].destination = "/skills?evidence=missing"; }, /data\.ts.*destination:.*unresolved/],
    [v => { v.siteContent.navigation.links[0].destination = "/?evidence=missing"; }, /data\.ts.*destination:.*unresolved/],
    [v => { v.siteContent.navigation.links[0].destination = "/?evidence=android-reports"; v.portfolioPage.sections[0].visible = false; v.skillsPage.sections.forEach(s => { s.visible = false; }); }, /data\.ts.*destination:.*hidden.*android-reports/],
    [v => { v.portfolioPage.sections[0].visible = false; }, /data\.ts.*performance-investigation.*evidence\[0\].*android-reports.*data\.ts.*regulus/],
    [v => { v.portfolioPage.sections[0].visible = false; v.portfolioPage.sections.push({ ...text, projectId: "regulus" }); }, /data\.ts.*evidenceId: live reference targets hidden.*android-reports/],
    [v => { v.portfolioPage.sections[0].preset = "media-left"; v.projects[0].media = []; }, /data\.ts.*regulus.*preset:.*requires.*media/],
    [v => { delete v.skillsPage.sections[0].cards[1].evidence[0].projectId; }, /data\.ts.*projectId: required/],
  ];
  for (const [edit, pattern] of cases) await fixture(edit, (status, output) => {
    assert.equal(status, 1, output); assert.match(output, pattern);
  });
});

test("hiding sections without incoming live references remains valid", async () => {
  await fixture(v => {
    v.portfolioPage.sections[0].visible = false;
    v.skillsPage.sections.forEach(s => { s.visible = false; });
    v.portfolioPage.sections.find(s => s.projectId === "vecchio-furioso").visible = false;
    v.aboutMePage.sections[0].visible = false;
    v.portfolioPage.sections.push({ ...text, visible: false });
  }, (status, output) => assert.equal(status, 0, output));
});


test("Skills capture placement/order and visibility track the actual rendered page", async () => {
  await fixture(v => {
    v.skillsPage.sections.unshift(v.skillsPage.sections.pop());
    v.portfolioPage.sections.find(s => s.projectId === "vecchio-furioso").visible = false;
    v.siteContent.navigation.links[1].destination = "/skills?evidence=pix-capture";
  }, (status, output) => assert.equal(status, 0, output));
  const cases = [
    [v => { v.skillsPage.sections[2].visible = false; }, /hidden.*evidence/],
    [v => { v.skillsPage.sections[2].evidence[0].evidenceId = "missing"; }, /unknown evidence reference/],
    [v => { v.skillsPage.sections[2].evidence.push(v.skillsPage.sections[2].evidence[0]); }, /duplicate.*(anchor|reference)/],
    [v => { v.skillsPage.sections.push({ ...v.skillsPage.sections[2], id: "another-capture" }); }, /duplicate rendered anchor/],
    [v => { v.skillsPage.sections[2].preset = "media-left"; }, /preset: unsupported/],
    [v => { v.skillsPage.sections[2].evidence[0].projectId = "regulus"; }, /does not belong/],
    [v => { v.skillsPage.sections[2].evidence[0] = { evidenceId: "android-reports", projectId: "regulus" }; }, /captures only/],
    [v => { v.skillsPage.sections[2].id = "pix-capture"; v.evidence[1].anchor = "pix-capture-heading"; v.evidence[1].destination = "/skills?evidence=pix-capture-heading"; }, /duplicate.*anchor/],
    [v => { v.siteContent.navigation.links[1].destination = "/?evidence=pix-capture"; }, /unresolved or hidden/],
    [v => { v.aboutMePage.sections.push(v.skillsPage.sections[2]); }, /unsupported section type/],
  ];
  for (const [edit, pattern] of cases) await fixture(edit, (status, output) => {
    assert.equal(status, 1, output); assert.match(output, pattern);
  });
  await fixture(v => {
    v.skillsPage.sections[2].visible = false;
    for (const section of v.skillsPage.sections.filter(s => s.type === "cards"))
      for (const card of section.cards) card.evidence = card.evidence.filter(r => r.evidenceId !== "pix-capture");
    v.portfolioPage.sections.find(s => s.projectId === "vecchio-furioso").visible = false;
  }, (status, output) => assert.equal(status, 0, output));
});
