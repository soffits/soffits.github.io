# Agent Notes

## Project Purpose

- This repository builds <https://soffits.github.io/>, Sakina's personal blog.
- Keep the site built with Astro from Markdown/MDX files and published through GitHub Pages.
- The site is based on the AstroPaper theme (`satnaing/astro-paper`, MIT). Keep its file layout close to upstream so upstream fixes can be pulled in; see "Theme" below.
- Keep repository content English-only: code, docs, metadata, workflow names, and blog posts.

## Package Manager And Commands

- Use npm with the committed `package-lock.json`; do not switch package managers.
- Use Node `>=22.23.4` (required by Astro 7) and npm `>=10.9.0`, matching `package.json` engines. The deploy workflow and dev container use Node 24.
- Install dependencies with `npm ci` so local work, hosted checks, and the development container use the same saved versions.
- Start development with `npm run dev`.
- Run static checks with `npm run check`, `npm run lint` and `npm run format:check`.
- Build the site with `npm run build`.
- Check dependency security with `npm audit --omit=dev` and `npm audit` when changing dependencies.

## Theme

- Base: AstroPaper `main` at commit `35cfa7f` (v6.1.0 + Astro 7 upgrade, 2026-08-05). Its MIT licence is kept in `LICENSE-ASTROPAPER`; keep that file whenever AstroPaper code is in the repo.
- Where customisations live:
  - `astro-paper.config.ts`: site, author, features, socials (AstroPaper's own config).
  - `astro.config.ts`: fonts (Space Grotesk / Source Serif 4 / JetBrains Mono via the Astro Fonts API), Shiki themes, `trailingSlash: "always"`, and `redirects` from `src/redirects.ts`.
  - `src/styles/theme.css`: colour tokens for light and dark.
  - `src/styles/sakina.css`: every visual override of the stock theme, in one unlayered stylesheet.
  - `src/site.ts`: projects list and repository links. `src/i18n/lang/en.ts`: UI wording.
  - `src/utils/renderOgImage.ts`: shared social image layout.
  - Small hook classes and edits inside upstream components are marked with `Sakina:` comments. Search for `Sakina:` to list every divergence.
- Local divergences from upstream structure: `src/pages/posts/` is renamed to `src/pages/blog/` (route constant `BLOG_ROUTE` in `src/content.config.ts`), `src/pages/projects.astro` is added, sample posts, images, Docker and pnpm files are removed, and npm is used instead of pnpm.
- Pulling upstream updates:
  1. `git clone https://github.com/satnaing/astro-paper.git` outside this repo and note the new commit or tag.
  2. `git -C astro-paper diff 35cfa7f <new> -- . ':!src/content' ':!pnpm-lock.yaml' > upstream.patch`.
  3. Rewrite `src/pages/posts/` paths in the patch to `src/pages/blog/`, then `git apply -3 upstream.patch` and resolve conflicts around `Sakina:` markers.
  4. Port dependency version changes into `package.json` by hand, run `npm install`, `npm audit`, the checks and the build, then look at the pages in light and dark.
  5. Update the base commit recorded above.
- Do not add a catch-all route or anything that claims sub-paths owned by other repositories' project pages (such as `/eci-live/`). The generated `404.html` only applies to paths no repository serves.

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
