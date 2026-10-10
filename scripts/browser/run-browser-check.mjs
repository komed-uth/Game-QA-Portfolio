import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const runs = new AsyncLocalStorage();

async function captureFailure(context, error, run) {
  // Keep evidence from the innermost failing context before its cleanup.
  if (run.failure === error) return;
  const previousDirectory = run.directory;
  run.failure = error;
  run.directory = undefined;
  run.warning = undefined;
  try {
    if (previousDirectory) await rm(previousDirectory, { recursive: true, force: true });
    await mkdir(run.artifactDirectory, { recursive: true });
    run.directory = await mkdtemp(path.join(run.artifactDirectory, `${run.name}-`));
    const page = context.pages().at(-1);
    const diagnostics = { suite: run.name, scenario: { check: run.name, assertion: error.message }, message: error.message, stack: error.stack, url: page?.url() };
    try {
      diagnostics.page = await page.evaluate(() => ({
        viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY },
        visibility: { state: document.visibilityState, hidden: document.hidden, focused: document.hasFocus() },
        modalOpen: !!document.querySelector('dialog[open]'),
        galleries: [...document.querySelectorAll('.game-gallery')].map(gallery => {
          const previews = [...gallery.querySelectorAll('.gallery-thumbnail')];
          const selected = gallery.querySelector('.gallery-thumbnail[aria-pressed="true"]');
          const photo = gallery.querySelector('.gallery-photo');
          const image = photo?.querySelector('img');
          const bounds = gallery.getBoundingClientRect();
          const phase = ['ready', 'loading', 'failed', 'fading-out', 'fading-in'].find(value => photo?.classList.contains(value));
          return {
            name: gallery.getAttribute('aria-label'),
            caption: gallery.querySelector('.gallery-caption')?.textContent.trim(),
            selectedMedia: selected ? { index: previews.indexOf(selected), label: selected.getAttribute('aria-label'),
              source: selected.querySelector('img')?.getAttribute('src') } : null,
            hovered: gallery.matches(':hover'), focusWithin: gallery.contains(document.activeElement),
            bounds: bounds.toJSON(),
            inViewport: bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.right > 0 && bounds.top < innerHeight && bounds.left < innerWidth,
            photo: { phase: phase ?? (gallery.querySelector('[role="alert"]') ? 'failed' :
              gallery.querySelector('[role="status"]') ? 'loading' : null),
              ready: !!photo && !photo.disabled && !!image?.complete && image.naturalWidth > 0,
              source: image?.getAttribute('src'), complete: image?.complete, naturalWidth: image?.naturalWidth },
            videoSelected: !!gallery.querySelector('.gallery-viewer iframe'),
          };
        }),
        activeElement: document.activeElement?.outerHTML.slice(0, 2000),
        selectedMedia: [...document.querySelectorAll('.gallery-thumbnail[aria-pressed="true"]')]
          .map(element => element.getAttribute('aria-label')),
      }));
    } catch (diagnosticError) { diagnostics.pageError = diagnosticError.message; }
    try {
      if (!page) throw new Error('No open page available for screenshot');
      await page.screenshot({ path: path.join(run.directory, 'screenshot.png'), timeout: 5000 });
      diagnostics.screenshot = 'screenshot.png';
    } catch (screenshotError) { diagnostics.screenshotError = screenshotError.message; }
    await writeFile(path.join(run.directory, 'failure.json'), JSON.stringify(diagnostics, null, 2) + '\n');
    await context.tracing.stop({ path: path.join(run.directory, 'trace.zip') });
  } catch (artifactError) {
    run.warning = `Could not save failure artifacts: ${artifactError.message}`;
  }
}

export async function withBrowserContext(browser, options, check) {
  const run = runs.getStore();
  const context = await browser.newContext(options);
  try {
    if (run) await context.tracing.start({ screenshots: true, snapshots: true });
    await check(context);
  } catch (error) {
    if (run) await captureFailure(context, error, run);
    throw error;
  } finally {
    await context.close();
  }
}

export async function runBrowserCheck(browser, url, { name, check }, {
  artifactDirectory = '.scratch/browser-checks', log = console.log,
  validateInputs = async () => {},
} = {}) {
  const started = performance.now();
  const elapsed = () => `${((performance.now() - started) / 1000).toFixed(2)}s`;
  log(`START: ${name}`);
  const run = { name, artifactDirectory };
  let failure;
  let failed = false;
  try {
    await runs.run(run, () => withBrowserContext(browser, {}, async context => {
      const page = await context.newPage();
      await page.goto(url);
      await check(page);
    }));
  } catch (error) { failed = true; failure = error; }
  if (!failed && run.directory) await rm(run.directory, { recursive: true, force: true });
  await validateInputs(failure);
  log(`${failed ? 'FAIL' : 'PASS'}: ${name} (${elapsed()})`);
  if (failed) {
    if (run.warning) log(run.warning);
    else if (run.directory) log(`ARTIFACTS: ${path.resolve(run.directory)}`);
    throw failure;
  }
}
