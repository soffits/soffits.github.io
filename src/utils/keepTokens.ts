/**
 * Sakina: keep names like `seafile-vault-cli` or `--icmp` on one line.
 *
 * Browsers break after hyphens and slashes, which splits project names and
 * command flags across lines. Tokens that contain such characters are
 * wrapped in `span.nobr` (white-space: nowrap). Tokens too long to ever fit
 * a phone line (hashes, URLs) get `span.break-any` instead, so they may wrap
 * anywhere rather than overflow.
 */

const BREAKABLE_TOKEN = /[-/.:_=]/;
const MAX_NOWRAP_LENGTH = 28;
/** Inline code at or below this length is never split at all. */
const MAX_UNSPLIT_CODE_LENGTH = 32;

type TokenKind = "text" | "nobr" | "break-any";

function classify(token: string): TokenKind {
  if (/^\s+$/.test(token) || !BREAKABLE_TOKEN.test(token)) return "text";
  return token.length > MAX_NOWRAP_LENGTH ? "break-any" : "nobr";
}

function tokenize(text: string): { kind: TokenKind; value: string }[] {
  return text
    .split(/(\s+)/)
    .filter(token => token !== "")
    .map(value => ({ kind: classify(value), value }));
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** HTML string for titles rendered with `set:html` in components. */
export function keepTokensHtml(text: string): string {
  return tokenize(text)
    .map(({ kind, value }) =>
      kind === "text"
        ? escapeHtml(value)
        : `<span class="${kind}">${escapeHtml(value)}</span>`
    )
    .join("");
}

/* ---- rehype plugin for Markdown content ---- */

type HastText = { type: "text"; value: string };
type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
};
type HastNode =
  HastText | HastElement | { type: string; children?: HastNode[] };

const isElement = (node: HastNode): node is HastElement =>
  node.type === "element";

function wrapTextChildren(element: HastElement): void {
  element.children = element.children.flatMap((child): HastNode[] => {
    if (child.type !== "text") return [child];
    return tokenize((child as HastText).value).map(({ kind, value }) =>
      kind === "text"
        ? { type: "text", value }
        : {
            type: "element",
            tagName: "span",
            properties: { className: [kind] },
            children: [{ type: "text", value }],
          }
    );
  });
}

function textLength(element: HastElement): number {
  return element.children.reduce(
    (sum, child) =>
      sum +
      (child.type === "text"
        ? (child as HastText).value.length
        : isElement(child)
          ? textLength(child)
          : 0),
    0
  );
}

function visit(node: HastNode, insidePre: boolean): void {
  if (!("children" in node) || !node.children) return;
  for (const child of node.children) {
    if (!isElement(child)) continue;
    const inPre = insidePre || child.tagName === "pre";
    if (child.tagName === "code" && !inPre) {
      if (textLength(child) <= MAX_UNSPLIT_CODE_LENGTH) {
        const existing = child.properties?.className;
        child.properties = {
          ...child.properties,
          className: [...(Array.isArray(existing) ? existing : []), "nobr"],
        };
      } else {
        wrapTextChildren(child);
      }
      continue;
    }
    if (child.tagName === "a" && !inPre) wrapTextChildren(child);
    visit(child, inPre);
  }
}

export function rehypeKeepTokens() {
  return (tree: HastNode) => visit(tree, false);
}
