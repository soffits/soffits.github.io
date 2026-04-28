# Agent Notes

## Project Purpose

- This repository powers <https://soffits.github.io/>, Sakina's GitHub Pages personal blog.
- Preserve the Astro static-site stack with Markdown/MDX content and GitHub Pages deployment.
- Keep the hand-written site theme in `src/styles/global.css`; do not add third-party themes.
- Keep repository content English-only: code, docs, metadata, workflow names, and blog posts.

## Package Manager And Commands

- Use npm with the committed `package-lock.json`; do not switch package managers.
- Use Node `>=22.12.0` and npm `>=10.9.0`, matching `package.json` engines.
- Install dependencies with `npm ci` for reproducible local, CI, and devcontainer installs.
- Start development with `npm run dev`.
- Run static checks with `npm run check`.
- Build the site with `npm run build`.
- Check dependency security with `npm audit --omit=dev` and `npm audit` when changing dependencies.

## Engineering Policy

- Prefer small, self-documenting changes with strict types, centralized constants, and no dead code.
- Keep the AGPL license unchanged: this repository is licensed as `AGPL-3.0-only`.
- Do not include secrets, personal credentials, private tokens, or generated secret material.
- Do not weaken dependency, CI, or deployment security boundaries to make a task pass.
- Do not commit changes unless explicitly requested.

## Commit Convention

- Use Angular/Conventional Commit subjects in English, with an optional scope, such as `feat: add post archive`, `docs(readme): update setup steps`, or `chore: update Astro dependencies`.
- Keep commit messages focused on the user-visible purpose of the change.
