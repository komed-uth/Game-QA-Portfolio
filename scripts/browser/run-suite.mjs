import { startPreview } from './preview-server.mjs';
import { selectSuite } from './check-suites.mjs';
import { withStableInputs } from './stable-inputs.mjs';
import { runBrowserCheck } from './run-browser-check.mjs';
import { dependencyReadinessMessage, findMissingProjectDependencies } from '../project-dependencies.mjs';

const suite = selectSuite(process.argv.slice(2));
let server;
let browser;
let interrupted = false;
const report = message => new Promise((resolve, reject) => {
  if (!process.connected) return resolve();
  process.send(message, error => error ? reject(error) : resolve());
});
const interrupt = () => {
  interrupted = true;
  server?.kill();
  void browser?.close().catch(() => {});
};
process.on('message', message => { if (message.type === 'interrupt') interrupt(); });
process.on('disconnect', interrupt);
try {
  const projectRoot = process.cwd();
  const missing = await findMissingProjectDependencies(projectRoot);
  if (missing.length) throw new Error(dependencyReadinessMessage(projectRoot, missing));

  await withStableInputs(async (validateInputs, { fingerprint }) => {
    await report({ type: 'inputs', fingerprint });
    // Load checks after the input snapshot so edits cannot validate stale imports.
    const { chromium } = await import('playwright');
    let url = process.env.PORTFOLIO_URL;
    if (suite.reports) {
      const { checkOverlayReadiness } = await import('./report-overlay-data.mjs');
      await checkOverlayReadiness();
    }
    console.log(`CHECKS: ${suite.label}`);
    if (!url) {
      server = await startPreview();
      url = server.url;
      console.log(`PREVIEW: ${url}`);
    }
    if (interrupted) throw new Error('Browser validation interrupted');
    browser = await chromium.launch({ headless: true, ignoreDefaultArgs: ['--hide-scrollbars'],
      ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
    });
    if (interrupted) throw new Error('Browser validation interrupted');
    for (const { name, module } of suite.checks) {
      const { default: check } = await import(new URL(module, import.meta.url));
      await report({ type: 'check-start', name });
      await runBrowserCheck(browser, url, { name, check }, { validateInputs,
        onResult: result => report({ type: 'check-result', ...result }) });
    }
  });
  if (interrupted) throw new Error('Browser validation interrupted');
  console.log(`PASS: rendered ${suite.result} browser checks`);
  await report({ type: 'complete', status: 'passed' });
} catch (error) {
  console.error(error);
  await report({ type: 'complete', status: error.name === 'ObsoleteInputError' ? 'obsolete' : 'failed', error: error.message });
  process.exitCode = interrupted ? 130 : 1;
} finally {
  try { await browser?.close(); } finally { server?.kill(); }
  process.removeListener('disconnect', interrupt);
  if (process.connected) process.disconnect();
}
