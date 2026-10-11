import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// Captures a union of visible regions anywhere on the page; the caller owns cleanup.
export async function captureRegion(page, { selectors, path: output }) {
  if (!Array.isArray(selectors) || selectors.length === 0) throw new Error('Capture requires at least one selector');
  const clip = await page.evaluate(async selectors => {
    await document.fonts.ready;
    const boxes = selectors.map(selector => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Capture region not found: ${selector}`);
      const box = element.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) throw new Error(`Capture region has no visible area: ${selector}`);
      return box;
    });
    const x = Math.floor(Math.min(...boxes.map(box => box.left)) + scrollX);
    const y = Math.floor(Math.min(...boxes.map(box => box.top)) + scrollY);
    return { x, y, width: Math.ceil(Math.max(...boxes.map(box => box.right)) + scrollX) - x,
      height: Math.ceil(Math.max(...boxes.map(box => box.bottom)) + scrollY) - y };
  }, selectors);
  await mkdir(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, clip, fullPage: true });
  return clip;
}
