"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { useGetAnalyticsSummaryQuery } from "@/lib/store/services/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString()}`;
}

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) return null;
  const positive = change >= 0;
  return (
    <span className={`text-xs font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {positive ? "▲" : "▼"} {Math.abs(change)}%
    </span>
  );
}

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

// ── Date range ────────────────────────────────────────────────────────────────

type PresetRange = "30d" | "3m" | "6m" | "12m" | "all";

const PRESETS: { key: PresetRange; label: string; short: string }[] = [
  { key: "30d", label: "Last 30 Days", short: "30D" },
  { key: "3m",  label: "Last 3 Months", short: "3M" },
  { key: "6m",  label: "Last 6 Months", short: "6M" },
  { key: "12m", label: "Last 12 Months", short: "12M" },
  { key: "all", label: "All Time", short: "All" },
];

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateRange(preset: PresetRange): { start_date: string; end_date: string } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);

  switch (preset) {
    case "30d":
      start.setDate(end.getDate() - 29);
      break;
    case "3m":
      start.setMonth(end.getMonth() - 3);
      break;
    case "6m":
      start.setMonth(end.getMonth() - 6);
      break;
    case "12m":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "all":
      // Explicit far-back start so "All Time" never collapses to the API default window.
      start.setFullYear(2018, 0, 1);
      break;
  }

  return {
    start_date: formatLocalDate(start),
    end_date: formatLocalDate(end),
  };
}

function formatRangeLabel(range: { start_date: string; end_date: string }): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const start = new Date(`${range.start_date}T12:00:00`);
  const end = new Date(`${range.end_date}T12:00:00`);
  return `${start.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", opts)}`;
}

// ── Chart colours ─────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  web: "#6366f1",
  mobile: "#22c55e",
  walk_in: "#f97316",
};

const METHOD_COLORS: Record<string, string> = {
  wallet: "#6366f1",
  card: "#22c55e",
  pos: "#f97316",
  cash: "#a855f7",
  transfer: "#3b82f6",
};

const DEMO_COLORS: Record<string, string> = {
  "Gen Z": "#6366f1",
  Millennials: "#ec4899",
  "Gen X": "#f97316",
  Boomers: "#22c55e",
  Other: "#94a3b8",
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-zinc-700 rounded-2xl ${className ?? ""}`} />;
}

function PageSkeleton() {
  return (
    <div className="dash-page space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { admin } = useAuth();

  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [preset, setPreset] = useState<PresetRange>("30d");
  const dateRange = useMemo(() => getDateRange(preset), [preset]);

  const { data, isLoading, isError } = useGetAnalyticsSummaryQuery(dateRange, {
    skip: !can("analytics", "view"),
    refetchOnMountOrArgChange: true,
  });

  // ── Sort state for geographic table ──────────────────────────────────────
  const [geoSort, setGeoSort] = useState<{ col: "state" | "bookings" | "revenue"; dir: "asc" | "desc" }>({
    col: "bookings",
    dir: "desc",
  });

  const sortedGeo = useMemo(() => {
    if (!data?.geographic_distribution) return [];
    return [...data.geographic_distribution].sort((a, b) => {
      const aVal = a[geoSort.col];
      const bVal = b[geoSort.col];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return geoSort.dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return geoSort.dir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [data?.geographic_distribution, geoSort]);

  const toggleSort = (col: "state" | "bookings" | "revenue") => {
    setGeoSort((prev) =>
      prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" }
    );
  };

  // ── Access guard ──────────────────────────────────────────────────────────
  if (!can("analytics", "view")) {
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

  if (isLoading) return <PageSkeleton />;

  if (isError || !data) {
    return (
      <div className="dash-page">
        <div className={`${panelClass} p-12 text-center`}>
          <p className="text-red-600 font-medium text-sm">Failed to load analytics. Please try again.</p>
        </div>
      </div>
    );
  }

  const { kpis, revenue_trend, booking_sources, payment_methods, top_businesses, booking_trends, demographics, platform_health } = data;

  // Donut total for booking sources
  const totalBookingSources = booking_sources.reduce((s, x) => s + x.count, 0);

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-2">Platform-wide performance overview</p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <div
            className="inline-flex flex-wrap gap-1 p-1 rounded-2xl border border-slate-200/90 bg-slate-100/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
            role="group"
            aria-label="Date range"
          >
            {PRESETS.map((p) => {
              const active = preset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  title={p.label}
                  aria-pressed={active}
                  className={`min-w-[3.25rem] px-3.5 py-2 rounded-xl text-[12px] font-semibold tracking-tight transition-all duration-150 ${
                    active
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                  }`}
                >
                  <span className="sm:hidden">{p.short}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] font-medium text-slate-400 tabular-nums px-1">
            {formatRangeLabel(dateRange)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(kpis.total_revenue.value),
            change: kpis.total_revenue.change,
            icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z",
          },
          {
            label: "Total Bookings",
            value: kpis.total_bookings.value.toLocaleString(),
            change: kpis.total_bookings.change,
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
          },
          {
            label: "Active Businesses",
            value: kpis.active_businesses.value.toLocaleString(),
            change: kpis.active_businesses.change,
            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
          },
          {
            label: "Total Accounts",
            value: kpis.total_accounts.value.toLocaleString(),
            change: kpis.total_accounts.change,
            icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
          },
        ].map((card) => (
          <div key={card.label} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 pt-0.5">
                {card.label}
              </p>
              <div className="flex items-center gap-2">
                <ChangeIndicator change={card.change} />
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={card.icon} />
                  </svg>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${panelClass} p-5`}>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue_trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(v: number | undefined) => v != null ? formatCurrency(v) : ''} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={`${panelClass} p-5`}>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Booking Sources</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={booking_sources}
                  dataKey="count"
                  nameKey="source"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {booking_sources.map((entry) => (
                    <Cell key={entry.source} fill={SOURCE_COLORS[entry.source] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => v != null ? v.toLocaleString() : ''} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {booking_sources.map((entry) => {
                const pct = totalBookingSources > 0 ? ((entry.count / totalBookingSources) * 100).toFixed(1) : "0.0";
                return (
                  <div key={entry.source} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: SOURCE_COLORS[entry.source] ?? "#94a3b8" }} />
                      <span className="capitalize text-slate-600">{entry.source.replace("_", " ")}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-slate-900">{entry.count.toLocaleString()} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${panelClass} p-5`}>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={payment_methods} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="method" tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {payment_methods.map((entry) => (
                  <Cell key={entry.method} fill={METHOD_COLORS[entry.method] ?? "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`${panelClass} p-5`}>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Top Businesses by Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              layout="vertical"
              data={top_businesses}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number | undefined) => v != null ? formatCurrency(v) : ''} />
              <Bar dataKey="total_revenue" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${panelClass} p-5`}>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Booking Trends</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={booking_trends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cancellations" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`${panelClass} p-5`}>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Geographic Distribution</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  {(["state", "bookings", "revenue"] as const).map((col) => (
                    <th
                      key={col}
                      className="pb-3 font-medium cursor-pointer hover:text-slate-800 transition-colors select-none"
                      onClick={() => toggleSort(col)}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                      {geoSort.col === col && (
                        <span className="ml-1">{geoSort.dir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedGeo.map((row) => (
                  <tr key={row.state} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-2.5 font-medium text-slate-900">{row.state}</td>
                    <td className="py-2.5 tabular-nums text-slate-700">{row.bookings.toLocaleString()}</td>
                    <td className="py-2.5 tabular-nums text-slate-700">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
                {sortedGeo.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">No data for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${panelClass} p-5`}>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Guest Demographics</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={demographics}
                  dataKey="count"
                  nameKey="group"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {demographics.map((entry) => (
                    <Cell key={entry.group} fill={DEMO_COLORS[entry.group] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => v != null ? v.toLocaleString() : ''} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {demographics.map((entry) => (
                <div key={entry.group} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: DEMO_COLORS[entry.group] ?? "#94a3b8" }} />
                    <span className="text-slate-600">{entry.group}</span>
                  </div>
                  <span className="font-semibold tabular-nums text-slate-900">{entry.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${panelClass} p-5`}>
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Platform Health</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active Accounts", value: platform_health.active_accounts },
              { label: "Verified Accounts", value: platform_health.verified_accounts },
              { label: "Suspended Accounts", value: platform_health.suspended_accounts },
              { label: "Pending Businesses", value: platform_health.pending_businesses },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-[1.375rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
