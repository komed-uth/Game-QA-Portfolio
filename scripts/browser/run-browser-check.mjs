import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function runBrowserCheck(browser, url, { name, check }, {
  artifactDirectory = '.scratch/browser-checks', log = console.log,
} = {}) {
  const started = performance.now();
  const elapsed = () => `${((performance.now() - started) / 1000).toFixed(2)}s`;
  log(`START: ${name}`);
  let context;
  let page;
  try {
    context = await browser.newContext();
    await context.tracing.start({ screenshots: true, snapshots: true });
    page = await context.newPage();
    await page.goto(url);
    await check(page);
    await context.tracing.stop();
    log(`PASS: ${name} (${elapsed()})`);
  } catch (error) {
    log(`FAIL: ${name} (${elapsed()})`);
    try {
      await mkdir(artifactDirectory, { recursive: true });
      const directory = await mkdtemp(path.join(artifactDirectory, `${name}-`));
      const diagnostics = { suite: name, message: error.message, stack: error.stack, url: page?.url() };
      try {
        diagnostics.page = await page.evaluate(() => ({
          activeElement: document.activeElement?.outerHTML.slice(0, 2000),
          selectedMedia: [...document.querySelectorAll('.gallery-thumbnail[aria-pressed="true"]')]
            .map(element => element.getAttribute('aria-label')),
        }));
      } catch (diagnosticError) { diagnostics.pageError = diagnosticError.message; }
      await writeFile(path.join(directory, 'failure.json'), JSON.stringify(diagnostics, null, 2) + '\n');
      if (context) await context.tracing.stop({ path: path.join(directory, 'trace.zip') });
      log(`ARTIFACTS: ${path.resolve(directory)}`);
    } catch (artifactError) {
      log(`Could not save failure artifacts: ${artifactError.message}`);
    }
    throw error;
  } finally {
    await context?.close();
  }
}
