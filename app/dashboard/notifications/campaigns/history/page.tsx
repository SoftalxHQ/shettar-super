"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Pagination } from "@/components/ui/pagination";
import { useGetNewslettersQuery, type Newsletter } from "@/lib/store/services/api";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  queued: "bg-amber-50 text-amber-700",
  sending: "bg-sky-50 text-sky-700",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-600",
};

export default function CampaignHistoryPage() {
  const { admin } = useAuth();
  const canView = admin?.admin_role === "super_admin" || admin?.permissions?.newsletters?.view === true;
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetNewslettersQuery({ page, audience: "promotional" }, { skip: !canView });

  if (!canView) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="font-display text-base font-semibold text-red-600">Access denied</p>
          <p className="text-sm text-slate-500 mt-2">You need the &quot;View Newsletters&quot; permission.</p>
          <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Campaign history
          </h1>
          <p className="text-sm text-slate-500 mt-2">Open a campaign to review it or send it again.</p>
        </div>
        <Link href="/dashboard/notifications/campaigns" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          New campaign
        </Link>
      </div>

      <section className={`${panelClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Sent</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading campaigns…</td>
                </tr>
              )}
              {!isLoading && data?.newsletters.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No campaigns yet.</td>
                </tr>
              )}
              {data?.newsletters.map((campaign) => (
                <HistoryRow key={campaign.id} campaign={campaign} />
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="px-6 py-4 border-t border-slate-100">
            <Pagination
              currentPage={data.meta.current_page}
              totalPages={data.meta.total_pages}
              totalCount={data.meta.total_count}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryRow({ campaign }: { campaign: Newsletter }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-6 py-3.5">
        <p className="font-semibold text-slate-900">{campaign.subject}</p>
        <p className="text-xs text-slate-500 mt-0.5">{new Date(campaign.created_at).toLocaleString()}</p>
      </td>
      <td className="px-6 py-3.5">
        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${STATUS_STYLES[campaign.status] || ""}`}>
          {campaign.status}
        </span>
      </td>
      <td className="px-6 py-3.5 tabular-nums text-slate-900">
        {campaign.sent_count.toLocaleString()}
        {campaign.failed_count > 0 && (
          <span className="text-red-600 text-xs ml-1">({campaign.failed_count} failed)</span>
        )}
      </td>
      <td className="px-6 py-3.5 text-right">
        <Link
          href={`/dashboard/notifications/campaigns?id=${campaign.id}`}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Open
        </Link>
      </td>
    </tr>
  );
}
