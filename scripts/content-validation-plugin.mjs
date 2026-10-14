import path from "node:path";
import { loadContentDefinitions, repositoryRoot, validateContent } from "./content-validation.mjs";

const contentFiles = new Set([path.join(repositoryRoot, "src", "data.ts")]);

export function contentValidationPlugin() {
  return {
    name: "portfolio-content-validation",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        const { siteContent } = await loadContentDefinitions();
        const escape = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        return html.replaceAll("__SITE_TITLE__", escape(siteContent.identity.name))
          .replaceAll("__SITE_DESCRIPTION__", escape(siteContent.identity.description))
          .replaceAll("__SITE_ICON__", escape(siteContent.identity.icon));
      },
    },
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
