import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  loadContentDefinitions,
  repositoryRoot,
  validateContent,
} from "./content-validation.mjs";

const publicDirectory = path.join(repositoryRoot, "public");

test("About me native contact destinations require a single email recipient or an international phone", async () => {
  const definitions = await loadContentDefinitions();
  for (const [kind, destinations] of [
    ["email", ["https://example.com", "mailto:invalid", "mailto:qa@example.com?subject=hello", "mailto:qa@example.com#fragment", "mailto:qa#tag@example.com", "mailto:qa%ZZ@example.com", "mailto:qa@example.com,other@example.com", "mailto:qa@-example.com"]],
    ["phone", ["https://example.com", "tel:0999674270", "tel:+66 99 967 4270", "tel:+66999674270?x=1", "tel:+012345", "tel:+1234567890123456"]],
  ]) {
    for (const destination of destinations) {
      const invalid = structuredClone(definitions);
      invalid.aboutMePage.sections.find(section => section.type === "contact")[kind].destination = destination;
      assert.match((await validateContent(invalid, { publicDirectory })).join("\n"), new RegExp(`${kind}\\.destination: malformed destination`), destination);
    }
  }
  const edited = structuredClone(definitions);
  const contact = edited.aboutMePage.sections.find(section => section.type === "contact");
  contact.email.destination = "mailto:qa+portfolio@example.com";
  contact.phone.destination = "tel:+66812345678";
  assert.deepEqual(await validateContent(edited, { publicDirectory }), []);
  contact.email.label = "";
  contact.phone.value = "";
  const errors = (await validateContent(edited, { publicDirectory })).join("\n");
  assert.match(errors, /email\.label: required non-empty string/);
  assert.match(errors, /phone\.value: required non-empty string/);
});

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
