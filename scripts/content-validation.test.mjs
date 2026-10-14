import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  loadContentDefinitions,
  repositoryRoot,
  validateContent,
} from "./content-validation.mjs";

const publicDirectory = path.join(repositoryRoot, "public");

test("the checked-in definitions validate, including a supplied local asset", async () => {
  const definitions = await loadContentDefinitions();
  assert.deepEqual(await validateContent(definitions, { publicDirectory }), []);

  const withOptionalMedia = structuredClone(definitions);
  withOptionalMedia.aboutMePage.sections[0].media = {
    path: "favicon.svg",
    alt: "Portfolio mark",
  };
  assert.deepEqual(await validateContent(withOptionalMedia, { publicDirectory }), []);
});

test("shared contact destinations accept absolute web and mailto URLs but reject local app routes", async () => {
  const definitions = await loadContentDefinitions();
  const mailto = structuredClone(definitions);
  mailto.siteContent.contact.destination = "mailto:qa@example.com";
  assert.deepEqual(await validateContent(mailto, { publicDirectory }), []);

  const localRoute = structuredClone(definitions);
  localRoute.siteContent.contact.destination = "/skills";
  assert.match(
    (await validateContent(localRoute, { publicDirectory })).join("\n"),
    /siteContent\.contact\.destination: malformed destination; use an absolute HTTP\(S\) or mailto URL/,
  );
});

test("diagnostics identify missing fields, unsupported presets, duplicate identity, and bad destinations", async () => {
  const definitions = await loadContentDefinitions();
  const invalid = structuredClone(definitions);
  invalid.siteContent.contact.destination = "/\\other.example";
  invalid.siteContent.navigation.links[0].destination = "//malformed.example";
  invalid.siteContent.navigation.links[1].destination = "/typo";
  invalid.aboutMePage.sections[0].description = "";
  invalid.aboutMePage.sections[0].preset = "unsupported";
  invalid.aboutMePage.sections[1].id = invalid.aboutMePage.sections[0].id;

  const errors = await validateContent(invalid, { publicDirectory });
  const output = errors.join("\n");
  assert.match(output, /src\/data\.ts: siteContent\.contact\.destination: malformed destination/);
  assert.match(output, /siteContent\.navigation\.links\[0\]\.destination: malformed destination/);
  assert.match(output, /siteContent\.navigation\.links\[1\]\.destination: malformed destination or unresolved route/);
  assert.match(output, /src\/data\.ts: aboutMePage\.sections\["introduction"\]\.description: required non-empty string is missing/);
  assert.match(output, /sections\["introduction"\]\.preset: unsupported text preset/);
  assert.match(output, /sections\["introduction"\]\.id: duplicate section identity/);
});

test("optional media is omitted cleanly while a missing supplied file fails with its field context", async () => {
  const definitions = await loadContentDefinitions();
  const invalid = structuredClone(definitions);
  invalid.aboutMePage.sections[0].media = {
    path: "images/not-present.png",
    alt: "Missing image",
  };

  const errors = await validateContent(invalid, { publicDirectory });
  assert.match(
    errors.join("\n"),
    /data\.ts: aboutMePage\.sections\["introduction"\]\.media\.path: local media file does not exist/,
  );
});

test("media paths cannot escape the deployed public base even when filesystem normalization finds a file", async () => {
  const definitions = await loadContentDefinitions();
  const invalid = structuredClone(definitions);
  invalid.aboutMePage.sections[0].media = {
    path: "../public/favicon.svg",
    alt: "Portfolio mark",
  };

  const errors = await validateContent(invalid, { publicDirectory });
  assert.match(
    errors.join("\n"),
    /data\.ts: aboutMePage\.sections\["introduction"\]\.media\.path: must stay within public\/ and cannot contain parent-directory segments/,
  );
});
