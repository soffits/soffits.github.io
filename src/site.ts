/**
 * Sakina: site-specific content that AstroPaper's config has no slot for.
 * Theme settings live in `astro-paper.config.ts`.
 */

export const SOURCE_REPOSITORY = "https://github.com/soffits/soffits.github.io";

export const GITHUB_PROFILE = "https://github.com/soffits";

export type Project = {
  name: string;
  href: string;
  description: string;
};

export const PROJECTS: readonly Project[] = [
  {
    name: "ikea-cli",
    href: "https://github.com/soffits/ikea-cli",
    description:
      "Unofficial command-line tool and Python library for IKEA in 50+ countries: search, stock, cart, favourites, orders.",
  },
  {
    name: "bookfetch-cli",
    href: "https://github.com/soffits/bookfetch-cli",
    description:
      "Command-line search and download for books and papers: Anna's Archive, Z-Library, Project Gutenberg, Standard Ebooks, Open Library / Internet Archive and arXiv. Python stdlib only.",
  },
  {
    name: "seafile-vault-cli",
    href: "https://github.com/soffits/seafile-vault-cli",
    description:
      "A secure, repo-token-scoped Seafile CLI and MCP server for agent workflows.",
  },
  {
    name: "canvas-student-cli",
    href: "https://github.com/soffits/canvas-student-cli",
    description: "Secure, student-only read CLI for Canvas LMS.",
  },
  {
    name: "jobloom",
    href: "https://github.com/soffits/jobloom",
    description:
      "Local-first, agent-friendly job discovery CLI with JobSpy search and optional native feed providers.",
  },
  {
    name: "OpenPlayer",
    href: "https://github.com/soffits/OpenPlayer",
    description: "Open, multi-loader AI NPC framework for Minecraft.",
  },
];
