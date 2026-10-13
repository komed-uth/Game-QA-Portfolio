import path from "node:path";
import { loadContentDefinitions, repositoryRoot, validateContent } from "./content-validation.mjs";

const contentFiles = new Set([
  path.join(repositoryRoot, "src", "content", "projects.ts"),
  path.join(repositoryRoot, "src", "content", "evidence.ts"),
  path.join(repositoryRoot, "src", "content", "pages", "portfolio.ts"),
  path.join(repositoryRoot, "src", "content", "site.ts"),
  path.join(repositoryRoot, "src", "content", "pages", "aboutMe.ts"),
]);

export function contentValidationPlugin() {
  return {
    name: "portfolio-content-validation",
    async handleHotUpdate({ file, modules, server }) {
      if (!contentFiles.has(path.resolve(file))) return;

      let errors;
      try {
        errors = await validateContent(await loadContentDefinitions());
      } catch (error) {
        errors = [error instanceof Error ? error.message : String(error)];
      }

      if (errors.length === 0) return modules;

      const message = `Content validation failed:\n${errors.join("\n")}`;
      server.config.logger.error(message);
      server.ws.send({
        type: "error",
        err: { message, stack: "", plugin: "portfolio-content-validation" },
      });
      return [];
    },
  };
}
