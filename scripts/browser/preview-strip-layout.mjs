import assert from 'node:assert/strict';

export async function checkPreviewStripLayout(gallery) {
  const previews = gallery.locator('.gallery-thumbnail');
  const group = gallery.getByRole('group', { name: /gameplay previews$/ });
  assert.equal(await gallery.getByRole('button', { name: /scroll previews/, includeHidden: true }).count(), 0,
    'Preview browsing arrows are absent, including hidden controls');
  assert.equal(await group.getByRole('button', { includeHidden: true }).count(), await previews.count(),
    'The preview strip contains only its thumbnail actions');
  const layout = await gallery.evaluate(element => {
    const strip = element.querySelector('.gallery-thumbnails');
    const group = strip.closest('[role="group"]');
    return { stripBottom: strip.getBoundingClientRect().bottom, groupBottom: group.getBoundingClientRect().bottom,
      galleryBottom: element.getBoundingClientRect().bottom,
      thumbColor: getComputedStyle(strip, '::-webkit-scrollbar-thumb').backgroundColor };
  });
  assert(Math.abs(layout.groupBottom - layout.stripBottom) < 1 &&
    Math.abs(layout.galleryBottom - layout.stripBottom) < 1, 'Gallery ends compactly at the scrollbar without a reserved control row');
  assert.equal(layout.thumbColor, 'rgb(161, 231, 125)', 'The green scrollbar thumb is retained');
}
