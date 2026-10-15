import assert from 'node:assert/strict';

export async function checkGalleryControlLayout(gallery) {
  assert.equal(await gallery.locator('figcaption, .gallery-caption').count(), 0, 'Caption row is absent');
  assert.equal(await gallery.getByRole('link', {name: /Watch on YouTube/}).count(), 0);
  assert.equal(await gallery.getByRole('button', {name: /slideshow/i, includeHidden: true}).count(), 0,
    'Slideshow actions are absent, including hidden controls');
  const gap = await gallery.locator('.gallery-viewer').evaluate(viewer => {
    const frame = viewer.getBoundingClientRect();
    const strip = viewer.closest('.game-gallery').querySelector('.gallery-preview-strip').getBoundingClientRect();
    return strip.top - frame.bottom;
  });
  assert(Math.abs(gap - 12) < 1, 'Only normal preview strip spacing remains');
}
