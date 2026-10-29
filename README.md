# Sakina's Personal Blog

This repository builds <https://soffits.github.io/>, Sakina's personal blog.

It is an Astro static site for debugging write-ups and open-source project pages. Content is written in Markdown/MDX and deployed to GitHub Pages with GitHub Actions. The site is built on the [AstroPaper](https://github.com/satnaing/astro-paper) theme with its own type, colours and layout styling.

## Development

Requires Node `>=22.23.4` (CI uses Node 24) and npm.

```sh
npm ci
npm run dev
```

Search results only appear in `npm run dev` after one `npm run build`, which copies the Pagefind index into `public/pagefind/` (ignored by Git).

## Checks

```sh
npm run check
npm run lint
npm run format:check
npm run build
```

## Content

- Blog posts live in `src/content/posts` and are served at `/blog/<file-name>/`. Frontmatter (`title`, `description`, `pubDatetime`, `tags`, optional `modDatetime`, `draft`, `featured`) is validated in `src/content.config.ts`.
- The about page is `src/content/pages/about.md`.
- The project list is `PROJECTS` in `src/site.ts`.
- Redirects for retired post URLs are in `src/redirects.ts`.

## License

This repository is licensed under `AGPL-3.0-only`. See `LICENSE`.

The theme code taken from AstroPaper by Sat Naing is under the MIT License; its licence text is in `LICENSE-ASTROPAPER`.
