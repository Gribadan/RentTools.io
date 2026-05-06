/**
 * Tiny markdown→safe-HTML renderer for blog post bodies.
 *
 * Bodies are authored by super-admins via the admin panel (RT-20.3) and are
 * therefore semi-trusted, but we still escape and whitelist constructs so a
 * stale draft, a poisoned database row, or a future contributor flow can't
 * smuggle script tags or unsafe URL schemes onto the page.
 *
 * Supports a deliberately small subset:
 *   - Headings:      `## H2`, `### H3`, `#### H4` (a leading `# Title` line is stripped — the page <h1> already supplies the title)
 *   - Paragraphs:    blank-line separated
 *   - Lists:         `- item` / `* item` (bullet), `1. item` (numbered)
 *   - Code blocks:   ```fenced```
 *   - Inline:        **bold**, *italic*, `code`, [text](url), ![alt](url)
 *   - Blockquotes:   `> quoted line`
 *   - Horizontal rule: `---` on its own line
 *
 * URL whitelist: http://, https://, mailto:, and root-relative `/...` paths
 * only. javascript:, data:, vbscript: etc. are rejected and rendered as
 * inert text.
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === "") return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("#")) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^mailto:/i.test(trimmed)) return true;
  return false;
}

/**
 * Slugify a heading text into a stable URL-safe id. Used for `#anchor` links
 * in the TOC sidebar and for direct deep-linking. We intentionally strip
 * inline-formatting markers before slugging so `## **Step 1**: Setup` and
 * `## Step 1: Setup` produce the same id.
 */
export function slugifyHeading(text: string): string {
  // Keep Unicode letters/numbers (`\p{L}\p{N}`) so non-Latin headings — Russian
  // posts especially — produce readable, unique anchors instead of collapsing
  // to `section`. NFKD + diacritic strip turns "café" into "cafe" so the EN
  // path still hits the simpler slug it expected.
  return text
    .replace(/[*`_]/g, "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // strip combining marks
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "section";
}

/**
 * Apply inline transforms (bold, italic, links, code, images) to a single
 * line that has already been HTML-escaped. Order matters: code spans win
 * over emphasis (so emphasis markers inside `...` are preserved verbatim),
 * and images are pulled out before plain links so `![alt](url)` doesn't
 * get parsed as link-with-leading-bang.
 */
function renderInline(escaped: string): string {
  // Code spans first — pull them out and replace with placeholders so emphasis
  // markers inside `...` are preserved verbatim.
  const codeSlots: string[] = [];
  let withoutCode = escaped.replace(/`([^`]+)`/g, (_, body: string) => {
    const idx = codeSlots.length;
    codeSlots.push(`<code>${body}</code>`);
    return ` CODE${idx} `;
  });

  // Images: ![alt](url) — must run before link rule so the leading `!` is
  // consumed. Lazy-loaded; opens at full width inside .prose-blog.
  withoutCode = withoutCode.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, url: string) => {
    if (!isSafeUrl(url)) return "";
    return `<img src="${url.trim()}" alt="${alt}" loading="lazy" />`;
  });

  // Links: [text](url) — only emit <a> if the URL passes the whitelist.
  withoutCode = withoutCode.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) => {
    if (!isSafeUrl(url)) return label;
    const isExternal = /^https?:\/\//i.test(url.trim());
    const attrs = isExternal
      ? ` target="_blank" rel="noopener noreferrer nofollow"`
      : "";
    return `<a href="${url.trim()}"${attrs}>${label}</a>`;
  });

  // Bold then italic — bold uses two markers so we run it first.
  withoutCode = withoutCode.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  withoutCode = withoutCode.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  // Restore code spans.
  return withoutCode.replace(/ CODE(\d+) /g, (_, n: string) => codeSlots[Number(n)] ?? "");
}

interface Block {
  type: "heading" | "paragraph" | "ul" | "ol" | "code" | "quote" | "hr";
  level?: number;            // for headings
  lines?: string[];           // raw escaped lines
  language?: string;          // for code fences
}

/**
 * Group raw markdown into structural blocks. We keep this dumb on purpose —
 * one pass, never recursive. Lists don't nest; if a post needs nested lists,
 * the author writes plain HTML (which is sanitised away — escape hatch is
 * "rephrase the prose").
 */
function tokenize(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Code fence
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      // Skip closing ``` if present
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", lines: body, language });
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // Heading
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push({ type: "heading", level, lines: [headingMatch[2]] });
      i += 1;
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", lines: items });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", lines: items });
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    // Paragraph: collect non-blank lines until the next blank line
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !lines[i].startsWith("#") && !lines[i].startsWith(">") && !lines[i].startsWith("```")) {
      paraLines.push(lines[i]);
      i += 1;
    }
    if (paraLines.length > 0) blocks.push({ type: "paragraph", lines: paraLines });
  }

  return blocks;
}

/**
 * One TOC entry. `level` is 2 or 3 — h4+ are intentionally excluded so the
 * sidebar list stays scannable. Slugs are unique per document; collisions
 * get a numeric suffix (`-2`, `-3`, …) so anchor links remain stable.
 */
export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Walk the markdown source and return the heading list the TOC sidebar
 * should render. The same slug + dedup logic runs inside `renderMarkdown`
 * so the ids the TOC links to actually exist in the rendered HTML. Only
 * h2 and h3 (source `##` and `###`) make the cut so the sidebar stays
 * scannable; h4+ are still rendered, just not indexed.
 */
export function extractToc(md: string): TocEntry[] {
  const blocks = tokenize(md);
  const entries: TocEntry[] = [];
  const seen = new Map<string, number>();
  for (const b of blocks) {
    if (b.type !== "heading") continue;
    const sourceLevel = b.level ?? 2;
    if (sourceLevel < 2 || sourceLevel > 3) continue;
    const text = (b.lines ?? [""])[0];
    const baseSlug = slugifyHeading(text);
    const count = (seen.get(baseSlug) ?? 0) + 1;
    seen.set(baseSlug, count);
    const id = count === 1 ? baseSlug : `${baseSlug}-${count}`;
    entries.push({ id, text: text.replace(/[*`_]/g, ""), level: sourceLevel as 2 | 3 });
  }
  return entries;
}

/**
 * Render a parsed markdown document to safe HTML. The output is always
 * static markup with no inline event handlers, no scripts, no stylesheets —
 * the renderer never emits a tag the input didn't explicitly request via the
 * supported syntax above.
 */
export function renderMarkdown(md: string): string {
  const blocks = tokenize(md);
  const out: string[] = [];
  const headingSeen = new Map<string, number>();

  for (const b of blocks) {
    if (b.type === "hr") {
      out.push("<hr />");
      continue;
    }

    if (b.type === "heading") {
      // Source `## H2` → `<h2>`, `### H3` → `<h3>`, etc. We do NOT down-shift
      // anymore; the page already renders the post title as `<h1>` so a
      // body `# Title` would have produced two competing h1s. Authors
      // should now write `## Section` for top-level sections (matches
      // every blog CMS convention). A stray `# Heading` is rendered
      // as <h1> so the slip is visible during preview, not silently fixed.
      const sourceLevel = b.level ?? 2;
      const tag = `h${Math.min(6, sourceLevel)}`;
      const rawText = (b.lines ?? [""])[0];
      const escaped = escapeHtml(rawText);
      // Index h2 + h3 in the TOC. Other levels still render but don't get
      // anchors — keeps the sidebar tight on long posts.
      let attrs = "";
      if (sourceLevel >= 2 && sourceLevel <= 3) {
        const baseSlug = slugifyHeading(rawText);
        const count = (headingSeen.get(baseSlug) ?? 0) + 1;
        headingSeen.set(baseSlug, count);
        const id = count === 1 ? baseSlug : `${baseSlug}-${count}`;
        attrs = ` id="${id}"`;
      }
      out.push(`<${tag}${attrs}>${renderInline(escaped)}</${tag}>`);
      continue;
    }

    if (b.type === "paragraph") {
      const text = (b.lines ?? []).map(escapeHtml).join("\n");
      out.push(`<p>${renderInline(text).replace(/\n/g, "<br />")}</p>`);
      continue;
    }

    if (b.type === "ul" || b.type === "ol") {
      const tag = b.type;
      const items = (b.lines ?? [])
        .map((item) => `<li>${renderInline(escapeHtml(item))}</li>`)
        .join("");
      out.push(`<${tag}>${items}</${tag}>`);
      continue;
    }

    if (b.type === "code") {
      const body = (b.lines ?? []).map(escapeHtml).join("\n");
      out.push(`<pre><code>${body}</code></pre>`);
      continue;
    }

    if (b.type === "quote") {
      const text = (b.lines ?? []).map(escapeHtml).join("\n");
      out.push(`<blockquote>${renderInline(text).replace(/\n/g, "<br />")}</blockquote>`);
      continue;
    }
  }

  return out.join("\n");
}

/**
 * Estimate reading time in whole minutes for a markdown body. Strips
 * fenced code, then counts whitespace-separated tokens. 220 wpm matches
 * Medium / Substack defaults.
 */
export function readingMinutes(md: string): number {
  const text = md.replace(/```[\s\S]*?```/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * Drop a leading `# Title` line if the body opens with one. The post
 * page renders the post title as `<h1>` already, so a body H1 produces
 * a duplicate-title heading + breaks the h1→h2→h3 outline accessibility
 * tools expect. Existing markdown sources still ship the H1 for readability
 * inside an editor; this strips it at render time so we don't have to
 * do a one-shot rewrite of every post.
 */
export function stripLeadingH1(md: string): string {
  return md.replace(/^\s*#\s+[^\n]*\n+/, "");
}
