# Sakina's Personal Blog

This repository powers <https://soffits.github.io/>, Sakina's GitHub Pages personal blog.

It is a small Astro static site for soft notes, project pages, maintainer writing, and reflective posts. Content is written in Markdown/MDX and deployed to GitHub Pages with GitHub Actions.

## Development

```sh
npm ci
npm run dev
```

## Checks

```sh
npm run check
npm run build
```

## Content

Blog posts live in `src/content/posts`. Frontmatter is validated by the posts content collection schema in `src/content.config.ts`.

## License

This repository is licensed under `AGPL-3.0-only`. See `LICENSE`.
