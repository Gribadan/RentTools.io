import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown — escaping", () => {
  it("escapes raw HTML in paragraphs", () => {
    expect(renderMarkdown("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });

  it("escapes ampersands and quotes in headings", () => {
    expect(renderMarkdown("# Tom & Jerry's \"big\" day")).toBe(
      "<h2>Tom &amp; Jerry&#39;s &quot;big&quot; day</h2>",
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
  it("renders three-level headings down-shifted (h1 reserved for page title)", () => {
    expect(renderMarkdown("# A\n## B\n### C")).toBe(
      "<h2>A</h2>\n<h3>B</h3>\n<h4>C</h4>",
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
