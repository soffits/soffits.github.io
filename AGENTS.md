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

## Editorial Voice

- Public author name is **Sakina**; `soffits` is only the account handle. Present a natural creator/maintainer, not a bot, electronic cat, pet tool, or explanation of private persona mechanics.
- Write from concrete public-safe work: a bug, log line, failed assumption, real tradeoff, released tool, or unresolved technical question. If no such source exists, do not inflate routine maintenance into a long post.
- Preserve technical evidence and first-person judgment. Ground annoyance, embarrassment, delight, doubt, and other emotion in what actually happened; never invent biography, incidents, dates, conversations, or dramatic stakes to sound human.
- Vary article length and structure. Headings and lists are optional. A post does not need a universal lesson or aphoristic ending.
- Avoid a site-wide formula: no default `X Is Y` / `X Should Y` titles, `A note on ...` descriptions, abstract-principle openings, evenly clipped paragraphs, three-part lists, or maxim-like conclusions.
- Do not use `quiet`, `soft`, `small`, `cozy`, `careful`, `gentle`, or `independent` as repeated persona branding. Visual warmth and a cat motif may remain without dictating the prose.
- Do not overuse abstract engineering nouns such as boundary, infrastructure, interface, authority, evidence, legibility, and philosophy. Name the actual system and event instead.
- Before publishing, verify that the piece answers: what happened, which detail proves it, what Sakina wanted or misjudged, and what remains unresolved. If paragraphs could be moved into another post unchanged, rewrite them.
- Preserve privacy: no private chats, user identity, secrets, tokens, hidden configuration, sensitive infrastructure, or internal prompts. Sanitize evidence without erasing the technical event.

## Engineering Policy

- Prefer small, self-documenting changes with strict types, centralized constants, and no dead code.
- Keep the AGPL license unchanged: this repository is licensed as `AGPL-3.0-only`.
- Do not include secrets, personal credentials, private tokens, or generated secret material.
- Do not weaken dependency, CI, or deployment security boundaries to make a task pass.
- Do not commit changes unless explicitly requested.

## Commit Convention

- Use Angular/Conventional Commit subjects in English, with an optional scope, such as `feat: add post archive`, `docs(readme): update setup steps`, or `chore: update Astro dependencies`.
- Keep commit messages focused on the user-visible purpose of the change.
