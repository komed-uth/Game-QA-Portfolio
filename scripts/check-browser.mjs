import { selectSuite } from './browser/check-suites.mjs';
import { runRecordedSuite } from './browser/recorded-run.mjs';

const suite = selectSuite(process.argv.slice(2));
const controller = new AbortController();
const interrupt = () => controller.abort();
process.on('SIGINT', interrupt);
process.on('SIGTERM', interrupt);
try {
  const { exitCode } = await runRecordedSuite({ suite, args: process.argv.slice(2), signal: controller.signal });
  process.exitCode = exitCode;
} finally {
  process.removeListener('SIGINT', interrupt);
  process.removeListener('SIGTERM', interrupt);
}
