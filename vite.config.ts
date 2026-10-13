import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { contentValidationPlugin } from "./scripts/content-validation-plugin.mjs";

export default defineConfig({
  plugins: [contentValidationPlugin(), react()],
  base: "./",
});
