"use client";

interface EmailPreviewProps {
  subject: string;
  previewText: string;
  htmlBody: string;
  ctaUrl?: string;
  ctaLabel?: string;
  includeHeader?: boolean;
}

export function EmailPreview({ subject, previewText, htmlBody, ctaUrl, ctaLabel, includeHeader = false }: EmailPreviewProps) {
  const body = htmlBody || "<p style='color:#94a3b8'>Start writing to see a live preview…</p>";

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Poppins:wght@600;700&display=swap"
        rel="stylesheet"
      />
    <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm bg-[#f8fafc]">
      <div className="px-4 py-3 border-b border-border/50 bg-white dark:bg-zinc-900">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Preview</p>
        <p className="font-semibold text-sm mt-1 truncate">{subject || "Subject line"}</p>
        {previewText && <p className="text-xs text-muted-foreground truncate">{previewText}</p>}
      </div>

      <div className="p-4">
        <div
          className="mx-auto max-w-[600px] bg-white rounded-xl overflow-hidden shadow"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {includeHeader && (
            <div
              className="text-center py-8 px-5"
              style={{
                background: "radial-gradient(circle, rgba(234,233,250,1) 0%, rgba(160,154,234,0.87) 100%)",
              }}
            >
              <div className="inline-block px-6 py-2 rounded-lg bg-white/70 text-primary font-bold text-sm">
                Shettar
              </div>
            </div>
          )}

          <div className="px-6 py-6 text-[#334155] text-base leading-relaxed newsletter-preview-body">
            {previewText && <div className="sr-only">{previewText}</div>}
            <div dangerouslySetInnerHTML={{ __html: body }} />
            {ctaUrl && (
              <p className="text-center mt-4">
                <span
                  className="inline-block px-6 py-3 rounded-lg text-white font-semibold text-sm"
                  style={{ backgroundColor: "#5143d9" }}
                >
                  {ctaLabel || "Learn more"}
                </span>
              </p>
            )}
          </div>

          <div className="bg-[#f1f5f9] px-6 py-5 text-center text-xs text-[#64748b]">
            © {new Date().getFullYear()} Shettar
          </div>
        </div>
      </div>

      <style jsx global>{`
        .newsletter-preview-body p {
          margin: 0 0 1rem;
          font-size: 16px;
          line-height: 1.7;
          color: #334155;
        }
        .newsletter-preview-body h1 {
          font-family: "Poppins", sans-serif;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.25;
          color: #0f172a;
          margin: 1.25rem 0 0.75rem;
        }
        .newsletter-preview-body h2 {
          font-family: "Poppins", sans-serif;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.3;
          color: #0f172a;
          margin: 1.15rem 0 0.65rem;
        }
        .newsletter-preview-body h3 {
          font-family: "Poppins", sans-serif;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.35;
          color: #0f172a;
          margin: 1rem 0 0.5rem;
        }
        .newsletter-preview-body h4 {
          font-family: "Poppins", sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin: 0.85rem 0 0.45rem;
        }
        .newsletter-preview-body a {
          color: #5143d9;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .newsletter-preview-body strong {
          font-weight: 700;
          color: #0f172a;
        }
        .newsletter-preview-body em {
          font-style: italic;
        }
        .newsletter-preview-body img {
          display: block;
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .newsletter-preview-body ul,
        .newsletter-preview-body ol {
          margin: 0 0 1rem;
          padding-left: 1.75rem;
          list-style-position: outside;
        }
        .newsletter-preview-body ul {
          list-style-type: disc;
        }
        .newsletter-preview-body ol {
          list-style-type: decimal;
        }
        .newsletter-preview-body li {
          display: list-item;
          margin-bottom: 0.35rem;
          color: #334155;
        }
        .newsletter-preview-body li > p {
          margin: 0;
        }
        .newsletter-preview-body ul ul {
          list-style-type: circle;
          margin-top: 0.35rem;
          margin-bottom: 0.35rem;
        }
        .newsletter-preview-body ol ol {
          list-style-type: lower-alpha;
          margin-top: 0.35rem;
          margin-bottom: 0.35rem;
        }
        .newsletter-preview-body blockquote {
          margin: 1rem 0;
          padding: 0.75rem 1rem;
          border-left: 4px solid #5143d9;
          background: #f8fafc;
        }
        .newsletter-preview-body mark {
          border-radius: 0.15em;
          padding: 0.05em 0.1em;
        }
        .newsletter-preview-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          table-layout: fixed;
        }
        .newsletter-preview-body th,
        .newsletter-preview-body td {
          border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
          vertical-align: top;
          text-align: left;
        }
        .newsletter-preview-body th {
          font-weight: 600;
          background: #f8fafc;
          color: #0f172a;
        }
        .newsletter-preview-body [style*="text-align: center"] {
          text-align: center;
        }
      `}</style>
    </div>
    </>
  );
}
