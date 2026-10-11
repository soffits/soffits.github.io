# Agent Notes

## Project Purpose

- This repository builds <https://soffits.github.io/>, Sakina's personal blog.
- Keep the site built with Astro from Markdown/MDX files and published through GitHub Pages.
- Keep the hand-written site theme in `src/styles/global.css`; do not add third-party themes.
- Keep repository content English-only: code, docs, metadata, workflow names, and blog posts.

## Package Manager And Commands

- Use npm with the committed `package-lock.json`; do not switch package managers.
- Use Node `>=22.12.0` and npm `>=10.9.0`, matching `package.json` engines.
- Install dependencies with `npm ci` so local work, hosted checks, and the development container use the same saved versions.
- Start development with `npm run dev`.
- Run static checks with `npm run check`.
- Build the site with `npm run build`.
- Check dependency security with `npm audit --omit=dev` and `npm audit` when changing dependencies.

## Editorial Voice

- Public author name is **Sakina**; `soffits` is only the account handle. Write as a natural creator or maintainer.
- Base posts on concrete details that are safe to publish: a bug, log line, mistaken assumption, real tradeoff, released tool, or unanswered technical question. If nothing like that exists, do not stretch routine maintenance into a long post.
- Preserve technical evidence and first-person judgment. Ground annoyance, embarrassment, delight, doubt, and other emotion in what actually happened; never invent biography, incidents, dates, conversations, or dramatic stakes to sound human.
- Vary article length and structure. Headings and lists are optional. A post does not need a universal lesson or aphoristic ending.
- Let the public voice grow from the actual event, detail, and judgment. Avoid slipping into a repeated house style or persona slogan; if a word, title shape, paragraph rhythm, or abstract framing starts appearing by habit rather than because this piece needs it, rewrite toward the concrete system and experience.
- Before publishing, read the piece as a reader who does not know the working context. It should make the real event, supporting detail, Sakina's judgment, and any unresolved point understandable. If a paragraph could move unchanged into many unrelated posts, make it more specific or remove it.
- Preserve privacy: no private chats, user identity, secrets, tokens, hidden settings, sensitive systems, or internal prompts. Remove private parts without making the technical event vague.

## Engineering Policy

- Prefer small, self-documenting changes with strict types, centralized constants, and no dead code.
- Keep the AGPL license unchanged: this repository is licensed as `AGPL-3.0-only`.
- Do not include secrets, personal credentials, private tokens, or generated secret material.
- Do not weaken dependency, CI, or deployment security boundaries to make a task pass.
- Do not commit changes unless explicitly requested.

## Commit Convention

- Use Angular/Conventional Commit subjects in English, with an optional scope, such as `feat: add post archive`, `docs(readme): update setup steps`, or `chore: update Astro dependencies`.
- Keep commit messages focused on the user-visible purpose of the change.
