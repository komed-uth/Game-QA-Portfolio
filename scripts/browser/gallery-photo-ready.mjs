export async function waitForPhoto(gallery, source) {
  source ??= await gallery.locator('.gallery-thumbnail[aria-pressed="true"] img').getAttribute('src');
  await gallery.page().waitForFunction(({ name, source }) => {
    const gallery = [...document.querySelectorAll('.game-gallery')].find(e => e.getAttribute('aria-label') === name);
    const button = gallery?.querySelector('.gallery-viewer .evidence-image-button');
    return button && !button.disabled && button.querySelector('img').getAttribute('src') === source;
  }, { name: await gallery.getAttribute('aria-label'), source });
}
