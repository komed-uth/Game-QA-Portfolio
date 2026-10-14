import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { repositoryRoot } from "./content-validation.mjs";

export const contentPath = path.join(repositoryRoot, "src/data.ts");

// Change a definition through the same file the owner edits, preserving its
// type annotation and every unrelated definition. Queue saves in this process.
export async function createContentEditor(file = contentPath) {
  const original = await readFile(file, "utf8");
  let pending = Promise.resolve();
  return {
    write(name, value) {
      pending = pending.then(async () => {
        const source = await readFile(file, "utf8");
        const module = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
        const declaration = module.statements
          .filter(ts.isVariableStatement)
          .flatMap(statement => [...statement.declarationList.declarations])
          .find(record => record.name.getText(module) === name);
        if (!declaration?.initializer) throw new Error(`Missing content definition: ${name}`);
        const initializer = declaration.initializer;
        await writeFile(file, source.slice(0, initializer.getStart(module)) +
          JSON.stringify(value, null, 2) + source.slice(initializer.end));
      });
      return pending;
    },
    async restore() {
      await pending.catch(() => {});
      await writeFile(file, original);
    },
  };
}

export async function writeContentFixture(directory, definitions) {
  const editor = await createContentEditor(path.join(directory, "data.ts"));
  for (const name of ["siteContent", "portfolioPage", "projects", "evidence", "skillsPage", "aboutMePage"])
    await editor.write(name, definitions[name]);
}
