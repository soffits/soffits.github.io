import type { APIRoute } from "astro";
import { renderOgImage } from "@/utils/renderOgImage";
import config from "@/config";

// Sakina: layout lives in src/utils/renderOgImage.ts
export const GET: APIRoute = async ({ url }) =>
  renderOgImage(
    {
      eyebrow: "Software engineer",
      title: config.site.description,
      footer: new URL(config.site.url).hostname,
    },
    url
  );
