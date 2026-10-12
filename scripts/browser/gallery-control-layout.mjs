import assert from 'node:assert/strict';

export async function checkGalleryControlLayout(gallery) {
  assert.equal(await gallery.locator('figcaption, .gallery-caption').count(), 0, 'Caption row is absent');
  assert.equal(await gallery.getByRole('link', {name: /Watch on YouTube/}).count(), 0);
  const control = gallery.getByRole('button', {name: /^(Pause|Resume) slideshow$/});
  assert.equal(await control.count(), 1, 'One named control per multi-item gallery');
  assert(await control.isVisible());
  const layout = await control.evaluate(button => {
    const viewer = button.closest('.gallery-viewer');
    const frame = viewer.getBoundingClientRect();
    const bounds = button.getBoundingClientRect();
    const strip = viewer.closest('.game-gallery').querySelector('.gallery-preview-strip').getBoundingClientRect();
    const style = getComputedStyle(button);
    return { width: bounds.width, height: bounds.height, top: bounds.top - frame.top,
      right: frame.right - bounds.right, fits: bounds.left >= frame.left && bounds.bottom <= frame.bottom,
      gap: strip.top - frame.bottom, background: style.backgroundColor,
      separate: button.parentElement === viewer };
  });
  assert(layout.width >= 44 && layout.height >= 44, 'Control has a 44px target');
  assert(layout.top >= 8 && layout.top <= 10 && layout.right >= 8 && layout.right <= 10 && layout.fits,
    'Control fits at viewer top-right');
  assert(layout.separate, 'Control is separate from photo opener and player');
  assert.equal(layout.background, 'rgb(25, 34, 29)', 'Opaque background keeps control readable over media');
  assert(Math.abs(layout.gap - 12) < 1, 'Only normal preview strip spacing remains');
}
