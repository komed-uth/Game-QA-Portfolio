import path from "node:path";
import { loadContentDefinitions, validateContent } from "./content-validation.mjs";

function definitionsDirectory(args) {
  const index = args.indexOf("--definitions");
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("--definitions requires a directory path.");
  }
  return path.resolve(value);
}

try {
  const definitions = await loadContentDefinitions({ directory: definitionsDirectory(process.argv.slice(2)) });
  const errors = await validateContent(definitions);
  if (errors.length > 0) {
    console.error(`Content validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("Content validation passed.");
  }
} catch (error) {
  console.error(`Content validation failed:\n- ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
