import assert from 'node:assert/strict';
import { checkPreviewStripLayout } from './preview-strip-layout.mjs';
import { checkGalleryControlLayout } from './gallery-control-layout.mjs';

export async function checkGameplayGalleryLayout(gallery) {
  const previews = gallery.locator('.gallery-thumbnail');
  await checkPreviewStripLayout(gallery);
  assert.equal(await previews.count(), 4);
  await checkGalleryControlLayout(gallery);
  assert.equal(await gallery.getByRole('button', { name: /slideshow/i, includeHidden: true }).count(), 0, 'No slideshow action is available');
  assert.equal(await gallery.getByRole('link', { name: /Watch on YouTube/ }).count(), 0);
  assert.equal(await gallery.getByRole('button', { name: 'Open full-size image', exact: true }).count(), 0);
  assert.deepEqual(await previews.allTextContents(), ['▶', '', '', ''], 'Only the video play indicator remains on previews');
  assert(await previews.first().getAttribute('aria-label'), 'Video preview keeps its accessible name');
  const announcement = gallery.locator('[aria-live="polite"]');
  assert.equal(await announcement.getAttribute('aria-atomic'), 'true');
  assert(await announcement.evaluate(e => getComputedStyle(e).clipPath === 'inset(50%)'), 'Selection updates remain nonvisual');
  const layout = await gallery.evaluate(e => {
    const viewer = e.querySelector('.gallery-viewer').getBoundingClientRect();
    const strip = e.querySelector('.gallery-preview-strip').getBoundingClientRect();
    return { gap: strip.top - viewer.bottom, frame: viewer.width / viewer.height };
  });
  assert(Math.abs(layout.gap - 12) < 1, 'Preview strip follows viewer without reserved caption space');
  assert(Math.abs(layout.frame - 16 / 9) < .02, 'Main frame proportions remain intact');
  assert.equal(await gallery.locator('.gallery-dots').count(), 0);
  assert.equal(await gallery.getByRole('button', { name: /previous media|next media/ }).count(), 0);
}
