import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://soffits.github.io/",
    title: "Sakina",
    description:
      "Sakina's blog: developer tools, bugs, and notes from building things.",
    author: "Sakina",
    profile: "https://github.com/soffits",
    lang: "en",
    timezone: "UTC",
    dir: "ltr",
  },
  posts: {
    perPage: 10,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/soffits/soffits.github.io/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/soffits",
      linkTitle: "Sakina on GitHub",
    },
    { name: "rss", url: "/rss.xml", linkTitle: "RSS feed" },
  ],
  shareLinks: [],
});
