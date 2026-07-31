"use client";

import { useState, useCallback, useMemo } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import {
  useGetAdminActivitiesQuery,
  useAnalyzeAdminActivitiesMutation,
} from "@/lib/store/services/api";
import type { AdminActivityItem, ActivityAiReport } from "@/lib/store/services/api";
import { useAppSelector } from "@/lib/store/hooks";
import { selectToken } from "@/lib/store/slices/authSlice";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { ActivityAiPanel } from "@/components/activity-ai-panel";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";
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
  promo_code_created: "Promo Created",
  promo_code_updated: "Promo Updated",
  marketer_created: "Marketer Created",
  marketer_updated: "Marketer Updated",
  octopus_search: "Octopus Search",
  octopus_analyze: "Octopus AI Analyze",
  activity_analyze: "Activity AI Analyze",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActivityRow({ activity }: { activity: AdminActivityItem }) {
  const timeLabel = formatTimeAgo(activity.occurred_at);
  const fullTime = new Date(activity.occurred_at).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex items-start gap-4 py-3.5 pr-2 hover:bg-slate-50/90 rounded-xl transition-colors">
      <div className="relative z-10 w-8 flex justify-center flex-shrink-0 pt-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
          style={{ backgroundColor: activity.color }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800">{activity.description}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {activity.actor && (
            <span className="text-xs text-slate-500">
              by <span className="font-medium text-slate-700">{activity.actor.name}</span>
            </span>
          )}
          <span className="text-xs text-slate-300">•</span>
          <span className="text-xs text-slate-500" title={fullTime}>{timeLabel}</span>
        </div>
      </div>
      <span
        className="text-[11px] px-2 py-0.5 rounded-md font-semibold flex-shrink-0 hidden sm:inline-flex capitalize"
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
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<ActivityAiReport | null>(null);
  const [analyzedCount, setAnalyzedCount] = useState<number | undefined>();
  const token = useAppSelector(selectToken);
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };
  const [analyzeActivities, { isLoading: isAnalyzing }] = useAnalyzeAdminActivitiesMutation();

  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const dateFrom = dateRange.length === 2 ? formatLocalDate(dateRange[0]) : "";
  const dateTo = dateRange.length === 2 ? formatLocalDate(dateRange[1]) : "";

  const flatpickrOptions = useMemo(() => ({
    mode: "range" as const,
    dateFormat: "d M Y",
    maxDate: "today",
  }), []);

  const { data, isLoading, isError, isFetching, refetch } = useGetAdminActivitiesQuery({
    page,
    action_type: actionType || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }, { refetchOnMountOrArgChange: true, skip: !can("activities", "view") });

  const activities = data?.activities ?? [];
  const pagination = data?.pagination;

  const handleFilterChange = useCallback((key: string, value: string) => {
    setPage(1);
    if (key === "action_type") setActionType(value);
  }, []);

  if (!can("activities", "view")) {
    return (
      <div className="dash-page">
        <div className={`${panelClass} p-12 text-center`}>
          <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="font-display text-xl font-semibold mt-4 text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2">You don&apos;t have permission to access this section.</p>
        </div>
      </div>
    );
  }

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

  const handleAnalyze = async (mode: "general" | "request") => {
    if (!can("activities", "analyze")) {
      setAiError("You don't have permission to run AI analysis");
      return;
    }
    const query = mode === "request" ? aiQuery.trim() : "";
    if (mode === "request" && !query) {
      setAiError("Enter a request, or use general scan");
      return;
    }
    setAiError(null);
    setAiStatus(
      query
        ? "Running your request against the activity log..."
        : "Analyzing activity for abnormalities..."
    );
    try {
      const result = await analyzeActivities({
        action_type: actionType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        query: query || undefined,
      }).unwrap();
      setAiReport(result.report);
      setAnalyzedCount(result.analyzed_count);
      setAiStatus(null);
      setAiPromptOpen(false);
      setAiOpen(true);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { error?: string } }).data?.error || "Analysis failed")
          : "Analysis failed";
      setAiStatus(null);
      setAiError(message);
    }
  };

  const filtersLabel = useMemo(() => {
    const parts: string[] = [];
    if (actionType) parts.push(ACTION_LABELS[actionType] || actionType);
    if (dateFrom && dateTo) parts.push(`${dateFrom} → ${dateTo}`);
    return parts.join(" · ") || "All activity";
  }, [actionType, dateFrom, dateTo]);

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
    <div className="dash-page space-y-6 max-w-5xl mx-auto">
      <style>{`
        .flatpickr-day.selected,
        .flatpickr-day.startRange,
        .flatpickr-day.endRange,
        .flatpickr-day.selected.inRange,
        .flatpickr-day.startRange.inRange,
        .flatpickr-day.endRange.inRange,
        .flatpickr-day.selected:hover,
        .flatpickr-day.startRange:hover,
        .flatpickr-day.endRange:hover {
          background: #4f46e5 !important;
          border-color: #4f46e5 !important;
          color: #fff !important;
        }
        .flatpickr-day.inRange {
          background: #e0e7ff !important;
          border-color: #e0e7ff !important;
          color: #3730a3 !important;
        }
        .flatpickr-day.today {
          border-color: #4f46e5 !important;
        }
        .flatpickr-day.today:hover {
          background: #e0e7ff !important;
          color: #3730a3 !important;
        }
        .flatpickr-months .flatpickr-month,
        .flatpickr-current-month .flatpickr-monthDropdown-months {
          background: #4f46e5 !important;
          color: #fff !important;
        }
        .flatpickr-weekdays, .flatpickr-weekday {
          background: #4f46e5 !important;
          color: #fff !important;
        }
        .flatpickr-prev-month svg, .flatpickr-next-month svg {
          fill: #fff !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">Activity Log</h1>
          <p className="text-sm text-slate-500 mt-2">Real-time record of all admin operations</p>
        </div>
      <div className="flex items-center gap-2">
        {can("activities", "analyze") && (
          <button
            onClick={() => {
              setAiError(null);
              setAiStatus(null);
              setAiPromptOpen(true);
            }}
            disabled={isAnalyzing}
            className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${isAnalyzing ? "animate-pulse" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {isAnalyzing ? "Analyzing..." : "AI Analyzer"}
          </button>
        )}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isExporting ? "Exporting..." : "Export Excel"}
        </button>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      </div>

      {/* Filters */}
      <div className={`${panelClass} p-5`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Activity Type</label>
            <select className="input rounded-xl border-slate-200 mt-1.5" value={actionType} onChange={(e) => handleFilterChange("action_type", e.target.value)}>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date Range</label>
            <Flatpickr
              options={flatpickrOptions}
              onChange={(dates) => {
                if (dates.length === 2) {
                  setDateRange(dates);
                  setPage(1);
                }
              }}
              onClose={(dates) => {
                // If user closes picker with only one date selected, clear it
                if (dates.length < 2) {
                  setDateRange([]);
                  setPage(1);
                }
              }}
              placeholder="Select date range..."
              className="input rounded-xl border-slate-200 mt-1.5"
            />
          </div>
        </div>
        {(actionType || dateRange.length > 0) && (
          <button
            onClick={() => { setActionType(""); setDateRange([]); setPage(1); }}
            className="mt-3 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className={`${panelClass} p-5`}>
        {isError && <p className="text-center py-12 text-red-600 text-sm font-medium">Failed to load activity. Please try again.</p>}

        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-4">Loading activity...</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && activities.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-slate-500">No activity found</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && activities.length > 0 && (
          <div className="relative">
            <div className="absolute left-4 top-3 bottom-3 w-px bg-slate-200 z-[1]" aria-hidden />
            <div className="space-y-2">
              {grouped.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 py-3 pl-10">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                      {formatGroupDate(group.date)}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div>
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
        <Pagination
          currentPage={page}
          totalPages={pagination.last}
          totalCount={pagination.count}
          onPageChange={setPage}
        />
      )}

      <ActivityAiPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        report={aiReport}
        analyzedCount={analyzedCount}
        filtersLabel={filtersLabel}
      />

      {aiPromptOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => !isAnalyzing && setAiPromptOpen(false)}
          />
          <div className={`relative w-full max-w-lg ${panelClass} p-5`}>
            <h2 className="font-display text-lg font-semibold text-slate-900">AI Analyzer</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ask about something specific, or run a general abnormality scan on the current filters
              ({filtersLabel}).
            </p>

            {isAnalyzing && aiStatus ? (
              <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-5 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                <p className="mt-3 text-sm font-medium text-indigo-900">{aiStatus}</p>
                <p className="mt-1 text-xs text-indigo-600/80">This can take a few seconds.</p>
              </div>
            ) : (
              <>
                <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Specific request <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={aiQuery}
                  onChange={(e) => {
                    setAiQuery(e.target.value);
                    if (aiError) setAiError(null);
                  }}
                  rows={4}
                  placeholder='e.g. "Did anyone suspend accounts after midnight last week?" or "List all staff permission changes by Alex"'
                  className="input mt-1.5 w-full rounded-xl border-slate-200 text-sm"
                />
              </>
            )}

            {aiError && !isAnalyzing && (
              <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {aiError}
              </p>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => setAiPromptOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleAnalyze("general")}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                General scan
              </button>
              <button
                type="button"
                disabled={isAnalyzing || !aiQuery.trim()}
                onClick={() => handleAnalyze("request")}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
