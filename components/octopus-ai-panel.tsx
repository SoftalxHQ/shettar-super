"use client";

import Link from "next/link";
import type { OctopusAiReport } from "@/lib/store/services/api";

function resolveLinkHref(link: OctopusAiReport["links"][number]): string {
  const accountId = link.account_id;
  switch (link.href_hint) {
    case "account_reservations":
      return accountId ? `/dashboard/accounts/${accountId}?tab=bookings` : "/dashboard/octopus";
    case "account_transactions":
      return accountId ? `/dashboard/accounts/${accountId}?tab=transactions` : "/dashboard/octopus";
    case "account_show":
      return accountId ? `/dashboard/accounts/${accountId}` : "/dashboard/octopus";
    case "business_show":
      return link.business_id ? `/dashboard/businesses/${link.business_id}` : "/dashboard/businesses";
    case "support_show":
      return link.entity_id ? `/dashboard/support/${link.entity_id}` : "/dashboard/support";
    default:
      return "/dashboard/octopus";
  }
}

const SECTIONS: { key: keyof OctopusAiReport; title: string }[] = [
  { key: "executive_summary", title: "Executive Summary" },
  { key: "customer_profile", title: "Customer Profile" },
  { key: "booking_analysis", title: "Booking Analysis" },
  { key: "financial_analysis", title: "Financial Analysis" },
  { key: "risk_assessment", title: "Risk Assessment" },
];

export function OctopusAiPanel({
  open,
  onClose,
  report,
  query,
}: {
  open: boolean;
  onClose: () => void;
  report: OctopusAiReport | null;
  query: string;
}) {
  if (!open || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 print:static print:bg-transparent">
      <button type="button" className="flex-1 print:hidden" aria-label="Close" onClick={onClose} />
      <aside
        id="octopus-ai-report"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl print:max-w-none print:border-0 print:shadow-none"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 print:border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI Analyzer</h2>
            <p className="text-xs text-slate-500">Report for “{query}”</p>
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
          {SECTIONS.map(({ key, title }) => {
            const body = report[key];
            if (typeof body !== "string" || !body.trim()) return null;
            return (
              <section key={key}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
                <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
              </section>
            );
          })}

          {report.recommendations?.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recommendations</h3>
              <ul className="list-disc space-y-2 pl-5">
                {report.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {report.links?.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">References</h3>
              <div className="flex flex-wrap gap-2">
                {report.links.map((link) => (
                  <Link
                    key={`${link.href_hint}-${link.label}`}
                    href={resolveLinkHref(link)}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden !important; }
              #octopus-ai-report, #octopus-ai-report * { visibility: visible !important; }
              #octopus-ai-report {
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
