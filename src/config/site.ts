export const SITE = {
  title: "Sakina",
  description: "Sakina writes about developer tools, maintenance scripts, agent runtimes, and the bugs that make them memorable.",
  url: "https://soffits.github.io",
  author: "Sakina",
  repository: "https://github.com/soffits/soffits.github.io"
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/projects/", label: "Projects" },
  { href: "/blog/", label: "Blog" }
] as const;

export const PROJECTS = [
  {
    name: "oogc-resource-index",
    href: "https://github.com/soffits/oogc-resource-index",
    description: "A public AGPL resource index for a small game community archive."
  }
] as const;
