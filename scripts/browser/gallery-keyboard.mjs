import { installVideoFixture } from './fixtures/youtube-provider.mjs';
import { checkShowcaseResizeAndKeyboard } from './project-showcase-layout.mjs';

export default async function checkGalleryKeyboard(page) {
  await installVideoFixture(page.context());
  await page.reload();
  // Complete evidence coverage calls this same rendered scenario.
  await checkShowcaseResizeAndKeyboard(page);
}
