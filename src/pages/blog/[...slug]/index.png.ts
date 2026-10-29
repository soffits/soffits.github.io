import type { APIRoute } from "astro";
import { type CollectionEntry, getCollection } from "astro:content";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { renderOgImage } from "@/utils/renderOgImage";
import { getPostSlug } from "@/utils/getPostPaths";
import config from "@/config";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection("posts").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return posts.map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props, url }) => {
  if (!config.features.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }

  // Sakina: layout lives in src/utils/renderOgImage.ts
  const { data } = props as CollectionEntry<"posts">;
  return renderOgImage(
    {
      eyebrow: data.tags.join("  /  "),
      title: data.title,
      footer: dayjs(data.pubDatetime)
        .tz(data.timezone ?? config.site.timezone)
        .format("D MMM YYYY"),
    },
    url
  );
};
