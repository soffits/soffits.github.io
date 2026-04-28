import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://soffits.github.io",
  output: "static",
  integrations: [mdx()]
});
