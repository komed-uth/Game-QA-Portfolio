import { readFile } from 'node:fs/promises';

// A local, read-only adapter: retain the original JSON file for later lossless edits.
const args = process.argv.slice(2);
try {
  if (args.length !== 4 || args[0] !== '--source' || !['--tools', '--schema', '--issues', '--headings', '--section'].includes(args[2])) {
    throw new Error('Usage: node scripts/bounded-inspection.mjs --source <retained.json> <--tools query|--schema exact-name|--issues query|--headings exact-id|--section id:heading>');
  }
  const source = JSON.parse(await readFile(args[1], 'utf8'));
  if (!Array.isArray(source)) throw new Error('Retained source must be a JSON array.');
  const [mode, selection] = args.slice(2);
  if (mode === '--tools' || mode === '--issues') {
    const matches = source.filter(item => mode === '--tools'
      ? String(item.name).toLowerCase().includes(selection.toLowerCase())
      : `${item.id ?? item.number} ${item.title}`.toLowerCase().includes(selection.toLowerCase()));
    const names = matches.slice(0, 10).map(item => mode === '--tools' ? item.name : `${item.id ?? item.number}: ${item.title}`);
    console.log(names.join('\n') || 'No matches. Narrow or change the query.');
    if (matches.length > 10) console.log('REFINE: more than ten matches; narrow the query.');
  } else if (mode === '--schema') {
    const matches = source.filter(item => item.name === selection);
    if (matches.length !== 1) throw new Error(matches.length ? 'Exact tool selection is ambiguous; refine the inventory.' : 'Exact tool selection is missing; discover names first.');
    console.log(JSON.stringify(matches[0], null, 2));
  } else {
    const separator = selection.indexOf(':');
    const id = mode === '--section' ? selection.slice(0, separator) : selection;
    const matches = source.filter(item => String(item.id ?? item.number) === id);
    if (matches.length !== 1) throw new Error('Select one exact issue identifier from the title inventory.');
    const body = String(matches[0].body ?? matches[0].description ?? '').replaceAll('\r\n', '\n');
    const sections = [...body.matchAll(/^#{1,6} (.+)$/gm)];
    if (mode === '--headings') {
      console.log(sections.slice(0, 10).map(match => match[1]).join('\n') || 'No headings; retained source remains available.');
      if (sections.length > 10) console.log('REFINE: more than ten headings; select an exact section from retained source.');
    } else {
      if (separator < 1) throw new Error('Select a section as exact-id:Exact heading.');
      const heading = selection.slice(separator + 1);
      const selected = sections.filter(match => match[1] === heading);
      if (selected.length !== 1) throw new Error('Section is missing or ambiguous; inspect headings and refine.');
      const start = selected[0].index;
      const depth = selected[0][0].indexOf(' ');
      const end = sections.find(match => match.index > start && match[0].indexOf(' ') <= depth)?.index ?? body.length;
      const excerpt = body.slice(start, end).trim();
      if (excerpt.length > 4000 || excerpt.split('\n').length > 60) throw new Error('REFINE: selected section exceeds 4000 characters or 60 lines; select a smaller subsection in retained source.');
      console.log(excerpt);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
