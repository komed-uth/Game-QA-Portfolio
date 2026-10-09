import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

for (const [name, args] of [
  ["unknown focus selector", ["--unknown"]],
  ["conflicting focus selectors", ["--reports-only", "--gameplay-only"]],
  ["repeated focus selector", ["--gameplay-only", "--gameplay-only"]],
]) {
  test(`${name} fails before readiness or browser startup`, () => {
    const result = spawnSync(process.execPath, ["scripts/check-browser.mjs", ...args], { encoding: "utf8" });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Usage: node scripts\/check-browser.mjs/);
    assert.equal(result.stdout, "", "Invalid arguments must not start checks or a preview");
  });
}
