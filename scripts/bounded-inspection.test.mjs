import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function fixture(t, value) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'bounded-inspection-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const source = path.join(directory, 'retained source.json');
  writeFileSync(source, JSON.stringify(value));
  return source;
}
function inspect(source, ...args) {
  return spawnSync(process.execPath, ['scripts/bounded-inspection.mjs', '--source', source, ...args], { encoding: 'utf8' });
}

test('tool discovery prints at most ten names, signals refinement and expands only an exact unique schema', t => {
  const tools = Array.from({ length: 12 }, (_, index) => ({ name: `tool_${index}`, description: 'UNRELATED DESCRIPTION', inputSchema: { type: 'object', properties: { query: { type: 'string' } } } }));
  const source = fixture(t, tools);
  const broad = inspect(source, '--tools', 'tool_');
  assert.equal(broad.status, 0, broad.stderr);
  assert.equal(broad.stdout.split('\n').filter(line => /^tool_/.test(line)).length, 10);
  assert.match(broad.stdout, /REFINE/);
  assert.doesNotMatch(broad.stdout, /UNRELATED DESCRIPTION|inputSchema/);
  assert.deepEqual(JSON.parse(inspect(source, '--schema', 'tool_11').stdout), tools[11]);
  assert.notEqual(inspect(source, '--schema', 'tool_').status, 0);
  assert.match(inspect(fixture(t, [tools[0], tools[0]]), '--schema', 'tool_0').stderr, /ambiguous/i);
  assert.match(inspect(fixture(t, []), '--tools', 'anything').stdout, /No matches/);
  assert.equal(inspect(fixture(t, [tools[0]]), '--tools', 'tool_').stdout.trim(), 'tool_0');
});

test('issue inspection retains complete source and displays only exact selected sections with bounded output', t => {
  const issues = [
    { id: 'P-15', title: 'Publication gate', body: `## Acceptance\nKeep complete validation.\n### Windows\nPreserve named arguments.\n## History\n${'OLD HISTORY '.repeat(2000)}` },
    { id: 'P-16', title: 'Separate issue', body: '## Acceptance\r\nUNRELATED BODY\r\n## Windows\r\nPreserve CRLF source.\r\n' },
  ];
  const source = fixture(t, issues);
  const before = readFileSync(source, 'utf8');
  assert.equal(inspect(source, '--issues', 'publication').stdout.trim(), 'P-15: Publication gate');
  assert.equal(inspect(source, '--headings', 'P-15').stdout.trim(), 'Acceptance\nWindows\nHistory');
  assert.equal(inspect(source, '--section', 'P-15:Windows').stdout.trim(), '### Windows\nPreserve named arguments.');
  assert.equal(inspect(source, '--section', 'P-16:Windows').stdout.trim(), '## Windows\nPreserve CRLF source.');
  assert.doesNotMatch(inspect(source, '--section', 'P-15:Acceptance').stdout, /OLD HISTORY|UNRELATED BODY/);
  const oversized = inspect(source, '--section', 'P-15:History');
  assert.notEqual(oversized.status, 0);
  assert.match(oversized.stderr, /REFINE/);
  assert.equal(oversized.stdout, '');
  assert.notEqual(inspect(source, '--section', 'P-15:Missing').status, 0);
  assert.notEqual(inspect(source, '--headings', 'P-1').status, 0);
  assert.equal(readFileSync(source, 'utf8'), before);
});
