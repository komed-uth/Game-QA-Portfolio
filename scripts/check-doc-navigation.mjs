import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
if (!files.length) files.push('AGENTS.md', ...['validation', 'workstation', 'history', 'testing', 'publishing', 'inspection'].map(name => `docs/development/${name}.md`));
const markdown = file => readFileSync(file, 'utf8').replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, '');
const anchors = content => {
  const used = new Map();
  return [...content.matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) => {
    const slug = heading.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-');
    const count = used.get(slug) ?? 0;
    used.set(slug, count + 1);
    return count ? `${slug}-${count}` : slug;
  });
};
try {
  for (const file of files) {
    const content = markdown(file);
    for (const [, link] of content.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(link)) continue;
      const [relative, anchor] = decodeURIComponent(link).split('#');
      const target = relative ? path.resolve(path.dirname(file), relative) : path.resolve(file);
      if (!existsSync(target)) throw new Error(`${file}: missing local target ${link}; fix the path or restore a compatibility pointer.`);
      if (anchor && !anchors(markdown(target)).includes(anchor)) throw new Error(`${file}: missing section ${link}; fix the anchor or restore a compatibility heading.`);
    }
  }
  console.log(`PASS: local links and anchors in ${files.length} navigation documents.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
