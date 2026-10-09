import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseReportData } from "./report-overlay-data.mjs";

// Route a synthetic screenshot into the real report generator; capture files stay unchanged.
export default async function checkOverlayFixture(page) {
  const image = await readFile(new URL("./fixtures/report-overlay.svg", import.meta.url));
  const imageUrl = new URL("__checks__/report-overlay.svg", page.url()).href;
  const thumbnail = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Z0kAAAAASUVORK5CYII=";
  await page.route("**/__checks__/report-overlay.svg", route => route.fulfill({
    contentType: "image/svg+xml", body: image,
  }));
  await page.route("**/S10_Very_High_Fixed.html", async route => {
    const response = await route.fetch();
    const html = await response.text();
    const data = parseReportData(html);
    const graph = data.find(element => element.type === "INTERACTIVE" && !element.excludeFromHtml);
    assert(graph, "Fixture requires the report's interactive chart");
    graph.ylabel = "Synthetic overlay FPS";
    const center = Math.floor((graph.xdataLength - 1) / 2);
    // Adjacent samples share the fixture so pointer-to-sample rounding stays within its data.
    graph.screenshotBins = Array.from({ length: 17 }, (_, index) => center - 8 + index);
    graph.screenshotPathList = graph.screenshotBins.map(() => imageUrl);
    graph.screenshots = graph.screenshotBins.map(bin => ({
      timeInMs: graph.xdataStart + graph.xdataStep * bin, base64: thumbnail, height: 45,
    }));
    const fixtureHtml = html.replace(/(<script\b[^>]*\bid=["']meerkatData["'][^>]*>)[\s\S]*?(<\/script>)/i,
      (_, start, end) => start + JSON.stringify(data) + end);
    await route.fulfill({ response, body: fixtureHtml });
  });

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole("button", { name: "Very High", exact: true }).click();
  const opener = page.locator(".report-preview");
  await opener.click();
  const dialog = page.getByRole("dialog");
  const frame = await (await dialog.locator("iframe").elementHandle()).contentFrame();
  await frame.waitForLoadState();
  const chart = frame.locator('[id^="graph"]').filter({ hasText: "Synthetic overlay FPS" });
  const plot = chart.locator(".bb-event-rect");
  const overlay = frame.locator("#overlay");

  async function openOverlay() {
    await plot.scrollIntoViewIfNeeded();
    const bounds = await plot.boundingBox();
    assert(bounds?.width > 0 && bounds?.height > 0, "Interactive plotting surface is visible");
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await frame.locator(".bb-tooltip-container img").waitFor({ state: "visible" });
    // The report documents middle click for the high-resolution overlay.
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, { button: "middle" });
    await overlay.waitFor({ state: "visible" });
    await overlay.locator("img").evaluate(element => element.decode());
    assert.equal(await overlay.locator("img").getAttribute("src"), imageUrl);
    assert.equal(await overlay.locator("img").evaluate(element => element.naturalWidth), 960);
  }

  await openOverlay();
  await overlay.locator("img").click();
  assert(await overlay.isVisible(), "Image interaction preserves the report overlay");
  assert.equal(await dialog.count(), 1, "Report-owned overlay keeps the portfolio modal open");
  await frame.locator("#overlay-close").click();
  await overlay.waitFor({ state: "hidden" });
  assert.equal(await dialog.count(), 1, "Report overlay close only dismisses its own layer");

  await openOverlay();
  // Inspect the image before dismissal, also leaving native middle-button autoscroll mode.
  await overlay.locator("img").click();
  const backdrop = await overlay.boundingBox();
  await page.mouse.click(backdrop.x + 5, backdrop.y + backdrop.height - 5);
  await overlay.waitFor({ state: "hidden" });
  assert.equal(await dialog.count(), 1, "Report overlay backdrop preserves portfolio inspection");

  await openOverlay();
  await overlay.locator("img").click();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  assert(await opener.evaluate(element => element === document.activeElement));
  console.log("PASS: synthetic report chart-to-image overlay, loaded image, inner close/backdrop, portfolio modal retention and iframe Escape (fixture coverage only)");
}
