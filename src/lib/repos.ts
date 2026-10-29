// Sakina: projects list, fetched from GitHub at build time so it never goes stale.
import { GITHUB_USER } from "@/site";

export type Repo = {
  name: string;
  href: string;
  description: string;
  language: string | null;
  pushedAt: string;
};

type ApiRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
};

// The blog's own repository isn't a project to show.
const HIDDEN = new Set([`${GITHUB_USER}.github.io`]);

export async function getRepos(): Promise<Repo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${GITHUB_USER}.github.io build`,
  };
  // In CI the workflow token lifts the anonymous rate limit.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`,
    { headers }
  );
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  const repos = (await res.json()) as ApiRepo[];
  return repos
    .filter(r => !r.fork && !r.archived && !HIDDEN.has(r.name))
    .map(r => ({
      name: r.name,
      href: r.html_url,
      description: r.description ?? "",
      language: r.language,
      pushedAt: r.pushed_at,
    }));
}
