import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectOverlayData } from "./report-overlay-data.mjs";

const report = data => `<script id="meerkatData" type="application/json">${JSON.stringify(data)}</script>`;

test("empty screenshot lists report unavailable real overlay data", () => {
  assert.deepEqual(inspectOverlayData(report([{ screenshotPathList: [] }])), { graphs: 1, paths: 0 });
});

test("readiness counts usable paths in visible graphs and ignores empty placeholders", () => {
  assert.deepEqual(inspectOverlayData(report([
    { screenshotPathList: ["", "  ", "captures/frame.png"] },
    { screenshotPathList: ["captures/hidden.png"], excludeFromHtml: true },
  ])), { graphs: 1, paths: 1 });
});

test("absent or malformed report data fails instead of silently reporting readiness", () => {
  assert.throws(() => inspectOverlayData("<html></html>"), /Missing meerkatData/);
  assert.throws(() => inspectOverlayData('<script id="meerkatData">broken</script>'), SyntaxError);
  assert.throws(() => inspectOverlayData(report({})), /must be an array/);
  assert.throws(() => inspectOverlayData(report([{ screenshotPathList: [null] }])), /array of strings/);
});
