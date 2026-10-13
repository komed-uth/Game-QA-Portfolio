import { access, realpath } from 'node:fs/promises';
import path from 'node:path';

const commandSuffix = process.platform === 'win32' ? '.cmd' : '';
const requiredProjectFiles = [
  { name: 'Vite build and preview', files: ['vite/bin/vite.js', `.bin/vite${commandSuffix}`] },
  { name: 'TypeScript compiler', files: ['typescript/bin/tsc', `.bin/tsc${commandSuffix}`] },
  { name: 'Playwright browser checks', files: ['playwright/package.json'] },
];

function isWithin(directory, file) {
  const relative = path.relative(directory, file);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export async function findMissingProjectDependencies(projectRoot) {
  const root = path.resolve(projectRoot);
  const localModules = path.join(root, 'node_modules');
  const missing = [];

  for (const required of requiredProjectFiles) {
    const expectedPaths = required.files.map(file => path.join(localModules, file));
    let ready = true;
    for (const expectedPath of expectedPaths) {
      try {
        const resolvedPath = await realpath(expectedPath);
        await access(resolvedPath);
        if (!isWithin(localModules, resolvedPath)) ready = false;
      } catch {
        ready = false;
      }
    }
    if (!ready) missing.push({ name: required.name, expectedPaths });
  }

  return missing;
}

export function dependencyReadinessMessage(projectRoot, missing) {
  const root = path.resolve(projectRoot);
  const details = missing.map(({ name, expectedPaths }) => `- ${name}: ${expectedPaths.join(' and ')}`).join('\n');
  return `Project dependencies are missing or incomplete in ${root}.\n${details}\nRun npm ci from ${root} to install the locked dependencies, then retry.`;
}
