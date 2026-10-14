import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { contentValidationPlugin } from "./scripts/content-validation-plugin.mjs";

export default defineConfig({
  plugins: [contentValidationPlugin(), react()],
  server: {
    watch: {
      // Emit completed saves outside the watcher's 50ms same-file event throttle.
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 10 },
    },
  },
  base: "./",
});
