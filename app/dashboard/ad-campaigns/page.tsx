"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { selectToken } from "@/lib/store/slices/authSlice";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Campaign | null>(null);
  const [rejectReason, setRejectReason] = useState("Does not meet advertising guidelines");
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const loadCampaigns = useCallback(async (status: StatusFilter, silent = false) => {
    if (!token) return;
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const query = status === "all" ? "" : `?status=${status}`;
      const res = await fetch(`${API_URL}/api/v1/admin/ad_campaigns${query}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Client-Platform": "web-super" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load campaigns");
      setCampaigns(data.campaigns || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    loadCampaigns(statusFilter);
  }, [loadCampaigns, statusFilter]);

  const stats = useMemo(() => {
    const pending = campaigns.filter((c) => c.status === "pending_review").length;
    const active = campaigns.filter((c) => c.status === "active").length;
    const spend = campaigns.reduce((sum, c) => sum + (c.spent_amount || 0), 0);
    return {
      total: campaigns.length,
      pending,
      active,
      spend,
    };
  }, [campaigns]);

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
      await loadCampaigns(statusFilter, true);
    } catch {
      toast.error("Review failed");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative">
      {refreshing && (
        <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[1px] z-[40] pointer-events-none flex items-center justify-center">
          <div className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-border">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Refreshing…</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Ad Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Review business ad campaigns, check targeting and budgets, and approve delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadCampaigns(statusFilter, true)}
          className="btn-secondary w-fit px-5 py-2.5 text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "In this view", value: stats.total },
          { label: "Pending review", value: stats.pending, color: "text-amber-600" },
          { label: "Active", value: stats.active, color: "text-emerald-600" },
          { label: "Spend (view)", value: formatCurrency(stats.spend), color: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="glass p-6 rounded-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">{stat.label}</p>
            <p className={`text-3xl font-black mt-1 ${stat.color || ""}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              statusFilter === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-white dark:bg-zinc-900 border border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <p className="text-lg font-semibold">No campaigns found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {statusFilter === "pending_review"
              ? "Nothing is waiting for review right now."
              : "Try another status filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const status = statusStyle(campaign.status);
            const isPending = campaign.status === "pending_review";

            return (
              <div key={campaign.id} className="glass rounded-3xl p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black tracking-tight">{campaign.name}</h2>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      {campaign.complimentary && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          Complimentary
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.business.name}
                      <span className="mx-2 opacity-40">·</span>
                      Campaign #{campaign.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDateTime(campaign.created_at)}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={reviewingId === campaign.id}
                        onClick={() => review(campaign.id, "approve")}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60"
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
                        className="px-5 py-2.5 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm font-semibold disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Billing</p>
                    <p className="font-semibold mt-1 capitalize">{campaign.billing_model}</p>
                    <p className="text-sm text-muted-foreground mt-1">Max bid {formatCurrency(campaign.max_bid)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Budget</p>
                    <p className="font-semibold mt-1">
                      Daily {campaign.daily_budget != null ? formatCurrency(campaign.daily_budget) : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total {campaign.total_budget != null ? formatCurrency(campaign.total_budget) : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Spend</p>
                    <p className="font-semibold mt-1">{formatCurrency(campaign.spent_amount)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Lifetime campaign spend</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-zinc-800/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Schedule</p>
                    <p className="font-semibold mt-1 text-sm">
                      {campaign.starts_at ? formatDateTime(campaign.starts_at) : "Immediate"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ends {campaign.ends_at ? formatDateTime(campaign.ends_at) : "Open-ended"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">Placements</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.placements.map((placement) => (
                        <span
                          key={placement}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary"
                        >
                          {formatPlacement(placement)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">Geo targeting</p>
                    <p className="text-sm font-medium">{formatGeoTargets(campaign.target_geo)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-black">Reject campaign</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {rejectTarget.name} · {rejectTarget.business.name}
              </p>
            </div>
            <div>
              <label htmlFor="reject-reason" className="text-sm font-semibold">
                Reason
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || reviewingId === rejectTarget.id}
                onClick={() => review(rejectTarget.id, "reject", rejectReason.trim())}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
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
