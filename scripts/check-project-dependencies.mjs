import path from 'node:path';
import { dependencyReadinessMessage, findMissingProjectDependencies } from './project-dependencies.mjs';

const projectRoot = process.cwd();
const missing = await findMissingProjectDependencies(projectRoot);

if (missing.length) {
  console.error(`FAIL: ${dependencyReadinessMessage(projectRoot, missing)}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: build and preview dependencies resolve inside ${path.join(projectRoot, 'node_modules')}`);
}
