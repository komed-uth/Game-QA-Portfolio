import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const inputs = ['src', 'scripts', 'public', 'dist', 'Performance-Testing-Mobile', 'index.html',
  'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts'];

async function snapshot(root) {
  const files = new Map();
  async function visit(relative) {
    const absolute = path.join(root, relative);
    try {
      const entries = await readdir(absolute, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() || entry.isFile()) await visit(path.join(relative, entry.name));
      }
    } catch (error) {
      if (error.code === 'ENOENT') return;
      if (error.code !== 'ENOTDIR') throw error;
      try {
        const content = await readFile(absolute);
        files.set(relative.split(path.sep).join('/'), createHash('sha256').update(content).digest('hex'));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  for (const input of inputs) await visit(input);
  return files;
}

export async function withStableInputs(run, root = process.cwd()) {
  const before = await snapshot(root);
  async function validateInputs(failure) {
    const after = await snapshot(root);
    const changed = [...new Set([...before.keys(), ...after.keys()])]
      .filter(file => before.get(file) !== after.get(file)).sort();
    if (changed.length) {
      const error = new Error('OBSOLETE: validation inputs changed during this run. Rebuild and rerun.\nChanged inputs:\n' +
        changed.map(file => `- ${file}`).join('\n'), { cause: failure });
      error.name = 'ObsoleteInputError';
      throw error;
    }
  }
  let failure;
  let failed = false;
  try { await run(validateInputs); } catch (error) { failed = true; failure = error; }
  if (failure?.name === 'ObsoleteInputError') throw failure;
  await validateInputs(failure);
  if (failed) throw failure;
}
