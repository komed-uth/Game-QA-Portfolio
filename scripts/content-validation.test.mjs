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

test("diagnostics identify missing fields, unsupported presets, duplicate identity, and bad destinations", async () => {
  const definitions = await loadContentDefinitions();
  const invalid = structuredClone(definitions);
  invalid.siteContent.contact.destination = "https://bad destination";
  invalid.siteContent.navigation.links[0].destination = "//malformed.example";
  invalid.aboutMePage.sections[0].description = "";
  invalid.aboutMePage.sections[0].preset = "unsupported";
  invalid.aboutMePage.sections[1].id = invalid.aboutMePage.sections[0].id;

  const errors = await validateContent(invalid, { publicDirectory });
  const output = errors.join("\n");
  assert.match(output, /src\/content\/site\.ts: siteContent\.contact\.destination: malformed destination/);
  assert.match(output, /siteContent\.navigation\.links\[0\]\.destination: malformed destination/);
  assert.match(output, /src\/content\/pages\/aboutMe\.ts: aboutMePage\.sections\["introduction"\]\.description: required non-empty string is missing/);
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
    /aboutMe\.ts: aboutMePage\.sections\["introduction"\]\.media\.path: local media file does not exist/,
  );
});
