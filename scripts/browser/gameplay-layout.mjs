import { installVideoFixture } from './fixtures/youtube-provider.mjs';
import { checkProjectLayout } from './project-showcase-layout.mjs';
import { checkGameplayGalleryLayout } from './gameplay-gallery-layout.mjs';

export default async function checkGameplayLayout(page) {
  await installVideoFixture(page.context());
  await page.reload();
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion });
    for (const [width, height] of [[1920,1080],[1366,768],[390,845],[845,390],[360,840],[840,360],[1200,800],[800,1200],[899,700],[900,700],[901,700]]) {
      await page.setViewportSize({ width, height });
      await checkProjectLayout(page);
      for (const gallery of await page.locator('.regulus-showcase .game-gallery, .video-project .game-gallery').all()) {
        await gallery.locator('.gallery-thumbnail').first().click();
        await checkGameplayGalleryLayout(gallery);
      }
    }
  }
  console.log('PASS: focused gameplay layout, compact strips, accessible selection and 44px actions at eleven widths in both motion modes');
}
