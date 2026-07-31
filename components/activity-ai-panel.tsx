"use client";

import type { ActivityAiReport } from "@/lib/store/services/api";

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-50 text-amber-800",
  high: "bg-orange-50 text-orange-800",
  critical: "bg-red-50 text-red-700",
};

function formatTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ActivityAiPanel({
  open,
  onClose,
  report,
  analyzedCount,
  filtersLabel,
}: {
  open: boolean;
  onClose: () => void;
  report: ActivityAiReport | null;
  analyzedCount?: number;
  filtersLabel?: string;
}) {
  if (!open || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 print:static print:bg-transparent">
      <button type="button" className="flex-1 print:hidden" aria-label="Close" onClick={onClose} />
      <aside
        id="activity-ai-report"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl print:max-w-none print:border-0 print:shadow-none"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 print:border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI Analyzer</h2>
            <p className="text-xs text-slate-500">
              {report.query?.trim() ? "Custom request" : "General abnormality scan"}
              {typeof analyzedCount === "number" ? ` · ${analyzedCount} events` : ""}
              {filtersLabel ? ` · ${filtersLabel}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Print / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 text-sm text-slate-700">
          {report.query?.trim() && (
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Your request
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed text-indigo-950">{report.query}</p>
            </section>
          )}

          {report.focused_answer?.trim() && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Answer
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed">{report.focused_answer}</p>
            </section>
          )}

          {report.executive_summary?.trim() && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Executive Summary
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed">{report.executive_summary}</p>
            </section>
          )}

          {report.timeline_analysis?.trim() && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Timeline Analysis
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed">{report.timeline_analysis}</p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Abnormalities
            </h3>
            {report.abnormalities?.length > 0 ? (
              <ul className="space-y-3">
                {report.abnormalities.map((item, idx) => {
                  const when = formatTimestamp(item.occurred_at);
                  return (
                    <li
                      key={`${item.title}-${idx}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                            SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.medium
                          }`}
                        >
                          {item.severity}
                        </span>
                        <span className="font-medium text-slate-900">{item.title}</span>
                      </div>
                      {when && (
                        <p className="mt-1.5 text-xs font-medium text-indigo-600" title={item.occurred_at || undefined}>
                          {when}
                        </p>
                      )}
                      {item.detail?.trim() && (
                        <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-600">{item.detail}</p>
                      )}
                      {item.action_types?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.action_types.map((type) => (
                            <span
                              key={type}
                              className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200"
                            >
                              {type.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500">No abnormalities flagged for this window.</p>
            )}
          </section>

          {report.actor_patterns?.trim() && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Actor Patterns
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed">{report.actor_patterns}</p>
            </section>
          )}

          {report.risk_assessment?.trim() && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Risk Assessment
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed">{report.risk_assessment}</p>
            </section>
          )}

          {report.recommendations?.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recommendations
              </h3>
              <ul className="list-disc space-y-2 pl-5">
                {report.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </aside>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden !important; }
              #activity-ai-report, #activity-ai-report * { visibility: visible !important; }
              #activity-ai-report {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
