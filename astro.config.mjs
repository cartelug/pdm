import { defineConfig } from "astro/config";

// Author in Astro; publish generated static documents at the existing cPanel paths.
export default defineConfig({
  site: "https://pamodzici.com",
  output: "static",
  outDir: "./build-v3",
  publicDir: "./public-v3",
  trailingSlash: "always",
  build: { format: "directory", assets: "_astro" },
});
