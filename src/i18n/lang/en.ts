import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Home",
    posts: "Blog",
    tags: "Tags",
    about: "About",
    projects: "Projects",
    archives: "Archives",
    search: "Search",
  },
  post: {
    publishedAt: "Published at",
    updatedAt: "Updated",
    sharePostIntro: "Share this post:",
    sharePostOn: "Share this post on {{platform}}",
    sharePostViaEmail: "Share this post via email",
    tagLabel: "Tags",
    backToTop: "Back to top",
    goBack: "Go back",
    editPage: "Edit page",
    previousPost: "Older post",
    nextPost: "Newer post",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    page: "Page",
  },
  home: {
    socialLinks: "Social Links",
    featured: "Featured",
    recentPosts: "Latest posts",
    allPosts: "All posts",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "Source on GitHub (AGPL-3.0-only)",
  },
  pages: {
    tagTitle: "Tag",
    tagDesc: "Posts tagged",

    tagsTitle: "Tags",
    tagsDesc: "Every topic I have written about.",

    postsTitle: "Debugging notes and write-ups",
    postsDesc:
      "What broke, how I tracked it down, and what changed in the code.",

    archivesTitle: "Archives",
    archivesDesc: "Every post, grouped by year and month.",

    searchTitle: "Search",
    searchDesc: "Search every post on this site.",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
    searchPlaceholder: "Search posts...",
    noResults: "No results found",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
  },
  notFound: {
    title: "404 Not Found",
    message: "Page Not Found",
    goHome: "Go back home",
  },
} satisfies UIStrings;
