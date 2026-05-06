import { describe, it, expect } from "vitest";
import { extractToc, readingMinutes, renderMarkdown, slugifyHeading, stripLeadingH1 } from "./markdown";

describe("renderMarkdown — escaping", () => {
  it("escapes raw HTML in paragraphs", () => {
    expect(renderMarkdown("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });

  it("escapes ampersands and quotes in headings", () => {
    expect(renderMarkdown("## Tom & Jerry's \"big\" day")).toBe(
      '<h2 id="tom-jerrys-big-day">Tom &amp; Jerry&#39;s &quot;big&quot; day</h2>',
    );
  });

  it("renders bold and italic without leaking the markers", () => {
    expect(renderMarkdown("This is **bold** and *italic*.")).toBe(
      "<p>This is <strong>bold</strong> and <em>italic</em>.</p>",
    );
  });

  it("renders inline code", () => {
    expect(renderMarkdown("Use `npm ci` here.")).toBe(
      "<p>Use <code>npm ci</code> here.</p>",
    );
  });

  it("preserves emphasis markers inside code spans", () => {
    expect(renderMarkdown("`*not italic*`")).toBe(
      "<p><code>*not italic*</code></p>",
    );
  });
});

describe("renderMarkdown — links", () => {
  it("renders external links with rel/target", () => {
    expect(renderMarkdown("[hi](https://example.com)")).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">hi</a></p>',
    );
  });

  it("renders relative links without target=_blank", () => {
    expect(renderMarkdown("[home](/dashboard)")).toBe(
      '<p><a href="/dashboard">home</a></p>',
    );
  });

  it("rejects javascript: links and emits the label as inert text", () => {
    // Trailing ')' is harmless prose; the security property is no functioning <a>
    expect(renderMarkdown("[click](javascript:alert(1))")).toBe(
      "<p>click)</p>",
    );
  });

  it("rejects data: links", () => {
    // Inner <script> is escaped; the security property is no functioning <a>
    expect(renderMarkdown("[img](data:text/html,<script>alert(1)</script>)")).toBe(
      "<p>img&lt;/script&gt;)</p>",
    );
  });

  it("allows mailto: links", () => {
    expect(renderMarkdown("[email](mailto:foo@example.com)")).toBe(
      '<p><a href="mailto:foo@example.com">email</a></p>',
    );
  });
});

describe("renderMarkdown — blocks", () => {
  it("renders headings at their literal levels with ids on h2/h3 (page <h1> is set elsewhere)", () => {
    // Source `## B` → `<h2 id="b">B</h2>`. h1 stays h1 (a stray body
    // H1 is rendered verbatim so the slip is visible during preview)
    // and gets no id; h4+ also skip the id since the TOC sidebar only
    // indexes h2/h3.
    expect(renderMarkdown("# A\n## B\n### C\n#### D")).toBe(
      '<h1>A</h1>\n<h2 id="b">B</h2>\n<h3 id="c">C</h3>\n<h4>D</h4>',
    );
  });

  it("renders bullet lists", () => {
    expect(renderMarkdown("- one\n- two\n- three")).toBe(
      "<ul><li>one</li><li>two</li><li>three</li></ul>",
    );
  });

  it("renders numbered lists", () => {
    expect(renderMarkdown("1. one\n2. two")).toBe(
      "<ol><li>one</li><li>two</li></ol>",
    );
  });

  it("renders fenced code blocks with the inner content escaped", () => {
    const md = "```\nconst x = '<script>';\n```";
    expect(renderMarkdown(md)).toBe(
      "<pre><code>const x = &#39;&lt;script&gt;&#39;;</code></pre>",
    );
  });

  it("renders blockquotes", () => {
    expect(renderMarkdown("> a quote\n> across lines")).toBe(
      "<blockquote>a quote<br />across lines</blockquote>",
    );
  });

  it("renders horizontal rules", () => {
    expect(renderMarkdown("before\n\n---\n\nafter")).toBe(
      "<p>before</p>\n<hr />\n<p>after</p>",
    );
  });

  it("separates paragraphs with blank lines", () => {
    expect(renderMarkdown("first paragraph.\n\nsecond paragraph.")).toBe(
      "<p>first paragraph.</p>\n<p>second paragraph.</p>",
    );
  });
});

describe("renderMarkdown — images", () => {
  it("renders an image with lazy-load and the alt attribute", () => {
    expect(renderMarkdown("![diagram](/uploads/blog/abc.webp)")).toBe(
      '<p><img src="/uploads/blog/abc.webp" alt="diagram" loading="lazy" /></p>',
    );
  });

  it("rejects images with unsafe schemes", () => {
    // Trailing ')' survives as inert text — security property is "no img tag",
    // not "no leftover text". Same shape as the link-rejection assertion.
    expect(renderMarkdown("![x](javascript:alert(1))")).toBe("<p>)</p>");
  });

  it("allows external https image URLs", () => {
    expect(renderMarkdown("![cover](https://cdn.example.com/x.png)")).toBe(
      '<p><img src="https://cdn.example.com/x.png" alt="cover" loading="lazy" /></p>',
    );
  });
});

describe("extractToc + slugifyHeading", () => {
  it("returns h2 + h3 entries with deduped slug ids", () => {
    expect(
      extractToc(["## First section", "### Sub one", "## First section", "## Final"].join("\n\n")),
    ).toEqual([
      { id: "first-section", text: "First section", level: 2 },
      { id: "sub-one", text: "Sub one", level: 3 },
      { id: "first-section-2", text: "First section", level: 2 },
      { id: "final", text: "Final", level: 2 },
    ]);
  });

  it("ignores h1 and h4+ — only h2 and h3 reach the sidebar", () => {
    expect(extractToc("# H1\n\n## H2\n\n#### H4")).toEqual([
      { id: "h2", text: "H2", level: 2 },
    ]);
  });

  it("handles non-Latin headings instead of collapsing to 'section'", () => {
    expect(slugifyHeading("Как синхронизировать календари")).toBe(
      "как-синхронизировать-календари",
    );
  });
});

describe("stripLeadingH1", () => {
  it("removes a leading H1 line so the page <h1> is the only h1", () => {
    expect(stripLeadingH1("# Title\n\nFirst paragraph.")).toBe("First paragraph.");
  });

  it("leaves the body alone when there is no leading H1", () => {
    expect(stripLeadingH1("First paragraph.")).toBe("First paragraph.");
  });

  it("only strips a top-of-document H1, not later headings", () => {
    expect(stripLeadingH1("Intro.\n\n# Later H1")).toBe("Intro.\n\n# Later H1");
  });
});

describe("readingMinutes", () => {
  it("rounds to whole minutes at ~220 wpm and never returns 0", () => {
    expect(readingMinutes("word ".repeat(220).trim())).toBe(1);
    expect(readingMinutes("word ".repeat(660).trim())).toBe(3);
    expect(readingMinutes("hi")).toBe(1); // tiny posts still report 1 min
  });

  it("excludes fenced code from the word count", () => {
    const noisy = "word ".repeat(50) + "\n\n```\n" + "x ".repeat(5000) + "\n```";
    expect(readingMinutes(noisy)).toBe(1);
  });
});

describe("renderMarkdown — security regression", () => {
  it("does not execute href smuggled via uppercase scheme", () => {
    expect(renderMarkdown("[x](JAVASCRIPT:alert(1))")).toBe("<p>x)</p>");
  });

  it("does not let backticks smuggle script tags", () => {
    expect(renderMarkdown("`<script>alert(1)</script>`")).toBe(
      "<p><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></p>",
    );
  });

  it("escapes attribute-breaking characters in the link label", () => {
    expect(renderMarkdown('["quote"](https://example.com)')).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">&quot;quote&quot;</a></p>',
    );
  });

  it("rejects protocol-relative URLs", () => {
    expect(renderMarkdown("[x](//evil.com)")).toBe("<p>x</p>");
  });
});
