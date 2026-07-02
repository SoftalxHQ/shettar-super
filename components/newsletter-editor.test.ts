import { describe, expect, it } from "vitest";

describe("NewsletterEditor HTML export", () => {
  it("exports toolbar heading markup as HTML", () => {
    const html = "<h2>Title</h2><p>Body <strong>bold</strong></p>";
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>bold</strong>");
  });
});
