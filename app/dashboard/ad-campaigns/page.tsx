"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { selectToken } from "@/lib/store/slices/authSlice";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

type GeoTarget = { country?: string; state?: string; city?: string };

type Campaign = {
  id: number;
  name: string;
  status: string;
  business: { id: number; name: string };
  placements: string[];
  billing_model: string;
  complimentary: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  spent_amount: number;
  max_bid: number;
  daily_budget?: number | null;
  total_budget?: number | null;
  target_geo?: GeoTarget[];
  created_at: string;
};

type StatusFilter = "pending_review" | "active" | "paused" | "rejected" | "all";

type CampaignsMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "pending_review", label: "Pending review" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function formatGeoTargets(targets?: GeoTarget[]): string {
  if (!targets?.length) return "Nationwide (Nigeria)";
  return targets
    .map((t) => {
      if (t.city && t.state) return `${t.city}, ${t.state}`;
      if (t.state) return t.state;
      return t.country || "Nigeria";
    })
    .join("; ");
}

function formatPlacement(label: string): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusStyle(status: string) {
  switch (status) {
    case "active":
      return { label: "Active", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", dot: "bg-emerald-500" };
    case "pending_review":
      return { label: "Pending review", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", dot: "bg-amber-500" };
    case "paused":
      return { label: "Paused", badge: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300", dot: "bg-slate-400" };
    case "rejected":
      return { label: "Rejected", badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", dot: "bg-red-500" };
    case "completed":
      return { label: "Completed", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", dot: "bg-blue-500" };
    default:
      return { label: status.replace(/_/g, " "), badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" };
  }
}

export default function AdCampaignsAdminPage() {
  const token = useAppSelector(selectToken);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending_review");
  const [page, setPage] = useState(1);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [meta, setMeta] = useState<CampaignsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Campaign | null>(null);
  const [rejectReason, setRejectReason] = useState("Does not meet advertising guidelines");
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const loadCampaigns = useCallback(async (status: StatusFilter, pageNum: number, silent = false) => {
    if (!token) return;
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ page: String(pageNum) });
      if (status !== "all") params.set("status", status);
      const res = await fetch(`${API_URL}/api/v1/admin/ad_campaigns?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Client-Platform": "web-super" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load campaigns");
      setCampaigns(data.campaigns || []);
      setMeta(data.meta || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load campaigns");
      setCampaigns([]);
      setMeta(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    loadCampaigns(statusFilter, page);
  }, [loadCampaigns, statusFilter, page]);

  const stats = useMemo(() => {
    const pending = campaigns.filter((c) => c.status === "pending_review").length;
    const active = campaigns.filter((c) => c.status === "active").length;
    const spend = campaigns.reduce((sum, c) => sum + (c.spent_amount || 0), 0);
    return {
      total: meta?.total_count ?? campaigns.length,
      pending,
      active,
      spend,
    };
  }, [campaigns, meta?.total_count]);

  const review = async (id: number, decision: "approve" | "reject", reason?: string) => {
    setReviewingId(id);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/ad_campaigns/${id}/review`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Client-Platform": "web-super",
        },
        body: JSON.stringify({ decision, reason: decision === "reject" ? reason : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Review failed");
        return;
      }
      toast.success(data.message || "Campaign updated");
      setRejectTarget(null);
      await loadCampaigns(statusFilter, page, true);
    } catch {
      toast.error("Review failed");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="dash-page space-y-6 relative">
      {refreshing && (
        <div className="absolute inset-0 bg-white/40 z-[40] pointer-events-none flex items-center justify-center">
          <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-500">Refreshing…</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Ad Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Review business ad campaigns, check targeting and budgets, and approve delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadCampaigns(statusFilter, page, true)}
          className="w-fit px-4 py-2 text-[13px] font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "In this view", value: stats.total },
          { label: "Pending review", value: stats.pending },
          { label: "Active", value: stats.active },
          { label: "Spend (view)", value: formatCurrency(stats.spend) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
            <p className="mt-2.5 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border border-slate-200 bg-white w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              statusFilter === tab.id
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]">
          <p className="font-display text-base font-semibold text-slate-900">No campaigns found</p>
          <p className="text-sm text-slate-500 mt-2">
            {statusFilter === "pending_review"
              ? "Nothing is waiting for review right now."
              : "Try another status filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const status = statusStyle(campaign.status);
            const isPending = campaign.status === "pending_review";

            return (
              <div
                key={campaign.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">{campaign.name}</h2>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${status.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      {campaign.complimentary && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700">
                          Complimentary
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {campaign.business.name}
                      <span className="mx-2 text-slate-300">·</span>
                      Campaign #{campaign.id}
                    </p>
                    <p className="text-xs text-slate-400">
                      Created {formatDateTime(campaign.created_at)}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={reviewingId === campaign.id}
                        onClick={() => review(campaign.id, "approve")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold disabled:opacity-60"
                      >
                        {reviewingId === campaign.id ? "Processing…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId === campaign.id}
                        onClick={() => {
                          setRejectTarget(campaign);
                          setRejectReason("Does not meet advertising guidelines");
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Billing</p>
                    <p className="font-semibold mt-1.5 text-sm text-slate-900 capitalize">{campaign.billing_model}</p>
                    <p className="text-xs text-slate-500 mt-1">Max bid {formatCurrency(campaign.max_bid)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Budget</p>
                    <p className="font-semibold mt-1.5 text-sm text-slate-900">
                      Daily {campaign.daily_budget != null ? formatCurrency(campaign.daily_budget) : "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Total {campaign.total_budget != null ? formatCurrency(campaign.total_budget) : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Spend</p>
                    <p className="font-semibold mt-1.5 text-sm text-slate-900 tabular-nums">{formatCurrency(campaign.spent_amount)}</p>
                    <p className="text-xs text-slate-500 mt-1">Lifetime campaign spend</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Schedule</p>
                    <p className="font-semibold mt-1.5 text-sm text-slate-900">
                      {campaign.starts_at ? formatDateTime(campaign.starts_at) : "Immediate"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Ends {campaign.ends_at ? formatDateTime(campaign.ends_at) : "Open-ended"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Placements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.placements.map((placement) => (
                        <span
                          key={placement}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700"
                        >
                          {formatPlacement(placement)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Geo targeting</p>
                    <p className="text-sm font-medium text-slate-700">{formatGeoTargets(campaign.target_geo)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta && !loading && (
        <Pagination
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          totalCount={meta.total_count}
          onPageChange={setPage}
        />
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-lg">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">Reject campaign</h3>
              <p className="text-sm text-slate-500 mt-1">
                {rejectTarget.name} · {rejectTarget.business.name}
              </p>
            </div>
            <div>
              <label htmlFor="reject-reason" className="text-[13px] font-medium text-slate-600">
                Reason
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || reviewingId === rejectTarget.id}
                onClick={() => review(rejectTarget.id, "reject", rejectReason.trim())}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-[13px] font-semibold disabled:opacity-60"
              >
                Reject campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
