/**
 * Sakina: shared Open Graph card for `/og.png` and `/blog/<slug>/index.png`.
 * Replaces upstream's two inline satori layouts with one branded layout.
 */
import satori from "satori";
import sharp from "sharp";
import { fontData, experimental_getFontFileURL } from "astro:assets";
import config from "@/config";

const OG_FONT_VARIABLE = "--font-display";
const OG_FONT_NAME = "Space Grotesk";
const OG_COLORS = {
  background: "#121315",
  foreground: "#e8e5de",
  muted: "#9b968c",
  accent: "#ff7148",
  grid: "#202227",
} as const;

type OgImageContent = {
  eyebrow: string;
  title: string;
  footer: string;
};

async function loadFont(weight: number, url: URL): Promise<ArrayBuffer> {
  // The woff2 face is a variable font satori cannot read; use the static TTF.
  const path = fontData[OG_FONT_VARIABLE].filter(
    font => font.weight === String(weight) && font.style === "normal"
  )
    .flatMap(font => font.src)
    .find(file => file.format === "truetype")?.url;
  if (path === undefined) {
    throw new Error(`Cannot find the ${OG_FONT_NAME} ${weight} font file.`);
  }
  const response = await fetch(experimental_getFontFileURL(path, url));
  return response.arrayBuffer();
}

export async function renderOgImage(
  { eyebrow, title, footer }: OgImageContent,
  url: URL
): Promise<Response> {
  const [regular, bold] = await Promise.all([
    loadFont(400, url),
    loadFont(700, url),
  ]);

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: OG_COLORS.background,
          backgroundImage: `linear-gradient(${OG_COLORS.grid} 1px, transparent 1px), linear-gradient(90deg, ${OG_COLORS.grid} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          color: OG_COLORS.foreground,
          fontFamily: OG_FONT_NAME,
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "20px",
                fontSize: 26,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: OG_COLORS.muted,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      width: "48px",
                      height: "4px",
                      background: OG_COLORS.accent,
                    },
                  },
                },
                { type: "span", props: { children: eyebrow } },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: title.length > 60 ? 64 : 76,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                maxHeight: "340px",
                overflow: "hidden",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 28,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", fontWeight: 700 },
                    children: [
                      { type: "span", props: { children: config.site.title } },
                      {
                        type: "span",
                        props: {
                          style: { color: OG_COLORS.accent },
                          children: ".",
                        },
                      },
                    ],
                  },
                },
                {
                  type: "span",
                  props: {
                    style: { color: OG_COLORS.muted },
                    children: footer,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: [
        { name: OG_FONT_NAME, data: regular, weight: 400, style: "normal" },
        { name: OG_FONT_NAME, data: bold, weight: 700, style: "normal" },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
