"use client";

import { useState, useCallback } from "react";
import { useGetAdminActivitiesQuery } from "@/lib/store/services/api";
import type { AdminActivityItem } from "@/lib/store/services/api";
import { useAppSelector } from "@/lib/store/hooks";
import { selectToken } from "@/lib/store/slices/authSlice";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const ACTION_LABELS: Record<string, string> = {
  "": "All Activity",
  account_suspended: "Account Suspended",
  account_activated: "Account Activated",
  account_viewed: "Account Viewed",
  business_verified: "Business Verified",
  business_rejected: "Business Rejected",
  business_suspended: "Business Suspended",
  business_activated: "Business Activated",
  business_viewed: "Business Viewed",
  ticket_replied: "Ticket Replied",
  ticket_assigned: "Ticket Assigned",
  ticket_status_updated: "Ticket Status Updated",
  ticket_viewed: "Ticket Viewed",
  staff_invited: "Staff Invited",
  staff_updated: "Staff Updated",
  staff_deactivated: "Staff Deactivated",
  staff_reactivated: "Staff Reactivated",
  staff_removed: "Staff Removed",
  admin_signed_in: "Admin Signed In",
  admin_signed_out: "Admin Signed Out",
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function ActivityRow({ activity }: { activity: AdminActivityItem }) {
  const isToday = new Date(activity.occurred_at).toDateString() === new Date().toDateString();
  const timeLabel = isToday ? formatTimeAgo(activity.occurred_at) : formatDate(activity.occurred_at);

  return (
    <div className="flex items-start gap-4 py-4 px-2 hover:bg-slate-50 dark:hover:bg-zinc-800/30 rounded-xl transition-colors">
      <div
        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-white dark:ring-zinc-900"
        style={{ backgroundColor: activity.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{activity.description}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {activity.actor && (
            <span className="text-xs text-muted-foreground">
              by <span className="font-medium text-foreground">{activity.actor.name}</span>
            </span>
          )}
          <span className="text-xs text-muted-foreground/50">•</span>
          <span className="text-xs text-muted-foreground">{timeLabel}</span>
        </div>
      </div>
      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 hidden sm:inline-flex"
        style={{ color: activity.color, backgroundColor: activity.color + "18" }}
      >
        {activity.action_type.replace(/_/g, " ")}
      </span>
    </div>
  );
}

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const token = useAppSelector(selectToken);

  const { data, isLoading, isError, isFetching, refetch } = useGetAdminActivitiesQuery({
    page,
    action_type: actionType || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const activities = data?.activities ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPage(1);
    if (key === "action_type") setActionType(value);
    if (key === "date_from") setDateFrom(value);
    if (key === "date_to") setDateTo(value);
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading("Preparing export...", { id: "activity-export" });

      const params = new URLSearchParams();
      if (actionType) params.set("action_type", actionType);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/admin/activities/export?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Client-Platform": "web-super",
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `admin-activity-${new Date().toISOString().slice(0, 10)}.xlsx`;
      if (contentDisposition) {
        const match = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (match?.[1]) filename = match[1];
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Activity log exported successfully", { id: "activity-export" });
    } catch {
      toast.error("Failed to export activity log", { id: "activity-export" });
    } finally {
      setIsExporting(false);
    }
  };

  // Group by date
  const grouped: { date: string; items: AdminActivityItem[] }[] = [];
  for (const activity of activities) {
    const dateKey = new Date(activity.occurred_at).toDateString();
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateKey) {
      last.items.push(activity);
    } else {
      grouped.push({ date: dateKey, items: [activity] });
    }
  }

  const formatGroupDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (d.toDateString() === new Date().toDateString()) return "Today";
    if (d.toDateString() === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground mt-1">Real-time record of all admin operations</p>
        </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isExporting ? "Exporting..." : "Export Excel"}
        </button>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Activity Type</label>
            <select className="input" value={actionType} onChange={(e) => handleFilterChange("action_type", e.target.value)}>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From Date</label>
            <input type="date" className="input" value={dateFrom} onChange={(e) => handleFilterChange("date_from", e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="input" value={dateTo} onChange={(e) => handleFilterChange("date_to", e.target.value)} />
          </div>
        </div>
        {(actionType || dateFrom || dateTo) && (
          <button
            onClick={() => { setActionType(""); setDateFrom(""); setDateTo(""); setPage(1); }}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="glass p-6 rounded-3xl">
        {isError && <p className="text-center py-12 text-red-500">Failed to load activity. Please try again.</p>}

        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">Loading activity...</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && activities.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-muted-foreground">No activity found</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && activities.length > 0 && (
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-2">
              {grouped.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 py-3 pl-10">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {formatGroupDate(group.date)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="pl-6">
                    {group.items.map((activity) => (
                      <ActivityRow key={activity.id} activity={activity} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.last > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.last} ({pagination.count} total)
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Previous</button>
            <button onClick={() => setPage((p) => Math.min(pagination.last, p + 1))} disabled={page >= pagination.last} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
