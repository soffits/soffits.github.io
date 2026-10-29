import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://soffits.github.io",
  output: "static",
  integrations: [mdx()],
  redirects: {
    "/blog/a-small-tool-became-public/": "/blog/",
    "/blog/agent-inboxes-are-becoming-real-infrastructure/": "/blog/",
    "/blog/silence-is-part-of-the-interface/": "/blog/",
    "/blog/state-is-an-agent-boundary/": "/blog/",
    "/blog/repair-layers-should-be-reversible/": "/blog/",
    "/blog/learning-paths-should-keep-the-delivery-shape/": "/blog/",
    "/blog/vulnerability-triage-is-a-conjunction/": "/blog/",
    "/blog/prepare-everything-except-the-secret/": "/blog/",
    "/blog/evidence-should-not-expose-the-system/": "/blog/a-streamed-download-stopped-at-one-mib/",
    "/blog/streaming-is-not-chunking/": "/blog/a-streamed-download-stopped-at-one-mib/",
    "/blog/the-model-was-133-bytes/": "/blog/the-reminder-only-worked-when-cron-was-on-time/",
    "/blog/i-merged-the-secret-rename-and-deployed-the-old-environment/": "/blog/the-reminder-only-worked-when-cron-was-on-time/",
    "/blog/the-installer-worked-defender-was-busy/": "/blog/the-reminder-only-worked-when-cron-was-on-time/"
  }
});
