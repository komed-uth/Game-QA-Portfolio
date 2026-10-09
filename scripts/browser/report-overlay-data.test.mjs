import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectOverlayData, parseReportData, replaceReportData } from "./report-overlay-data.mjs";

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

test("replacement shares script matching and preserves surrounding report content", () => {
  const start = '<SCRIPT type="application/json" id=\'meerkatData\' data-source="capture">';
  const end = '</SCRIPT>';
  const prefix = '<html><script id="other">untouched()</script>';
  const suffix = '<script>originalChart()</script></html>';
  const data = [{ screenshotPathList: ["fixture.svg"], label: "$& synthetic fixture" }];
  const html = prefix + start + "[]" + end + suffix;
  const replacement = replaceReportData(html, data);
  assert.equal(replacement, prefix + start + JSON.stringify(data) + end + suffix);
  assert.deepEqual(parseReportData(replacement), data);
});

test("replacement rejects missing and malformed original report data", () => {
  assert.throws(() => replaceReportData("<html></html>", []), /Missing meerkatData/);
  assert.throws(() => replaceReportData('<script id="meerkatData">broken</script>', []), SyntaxError);
  assert.throws(() => replaceReportData(report({}), []), /must be an array/);
});
