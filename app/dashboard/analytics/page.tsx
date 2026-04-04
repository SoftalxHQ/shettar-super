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
    <span className={`text-xs font-bold ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? "▲" : "▼"} {Math.abs(change)}%
    </span>
  );
}

// ── Date range ────────────────────────────────────────────────────────────────

type PresetRange = "30d" | "3m" | "6m" | "12m" | "all";

const PRESETS: { key: PresetRange; label: string; days: number | null }[] = [
  { key: "30d", label: "Last 30 Days", days: 30 },
  { key: "3m",  label: "Last 3 Months", days: 90 },
  { key: "6m",  label: "Last 6 Months", days: 180 },
  { key: "12m", label: "Last 12 Months", days: 365 },
  { key: "all", label: "All Time", days: null },
];

function getDateRange(preset: PresetRange): { start_date?: string; end_date?: string } {
  if (preset === "all") return {};
  const end = new Date();
  const start = new Date();
  const days = PRESETS.find((p) => p.key === preset)!.days!;
  start.setDate(end.getDate() - days + 1);
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  };
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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-48" />
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
      <div className="p-8">
        <div className="glass p-12 rounded-3xl text-center">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold mt-4">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You don&apos;t have permission to access this section.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <PageSkeleton />;

  if (isError || !data) {
    return (
      <div className="p-8">
        <div className="glass p-12 rounded-3xl text-center">
          <p className="text-red-500 font-semibold">Failed to load analytics. Please try again.</p>
        </div>
      </div>
    );
  }

  const { kpis, revenue_trend, booking_sources, payment_methods, top_businesses, booking_trends, demographics, platform_health } = data;

  // Donut total for booking sources
  const totalBookingSources = booking_sources.reduce((s, x) => s + x.count, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">Platform-wide performance overview</p>
        </div>
        {/* Date range selector */}
        <div className="flex items-center gap-2 p-1 glass rounded-2xl">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                preset === p.key
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(kpis.total_revenue.value),
            change: kpis.total_revenue.change,
            icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z",
            color: "text-indigo-600",
          },
          {
            label: "Total Bookings",
            value: kpis.total_bookings.value.toLocaleString(),
            change: kpis.total_bookings.change,
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            color: "text-green-600",
          },
          {
            label: "Active Businesses",
            value: kpis.active_businesses.value.toLocaleString(),
            change: kpis.active_businesses.change,
            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
            color: "text-orange-600",
          },
          {
            label: "Total Accounts",
            value: kpis.total_accounts.value.toLocaleString(),
            change: kpis.total_accounts.change,
            icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
            color: "text-pink-600",
          },
        ].map((card, i) => (
          <div key={i} className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 bg-primary/10 rounded-2xl ${card.color}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <ChangeIndicator change={card.change} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Row 2: Revenue Trend + Booking Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Revenue Trend</h2>
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
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Sources */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Booking Sources</h2>
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
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {booking_sources.map((entry) => {
                const pct = totalBookingSources > 0 ? ((entry.count / totalBookingSources) * 100).toFixed(1) : "0.0";
                return (
                  <div key={entry.source} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: SOURCE_COLORS[entry.source] ?? "#94a3b8" }} />
                      <span className="capitalize">{entry.source.replace("_", " ")}</span>
                    </div>
                    <span className="font-semibold">{entry.count.toLocaleString()} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Payment Methods + Top Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Payment Methods</h2>
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

        {/* Top Businesses */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Top Businesses by Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              layout="vertical"
              data={top_businesses}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="total_revenue" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Booking Trends + Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Booking Trends</h2>
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

        {/* Geographic Distribution */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Geographic Distribution</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  {(["state", "bookings", "revenue"] as const).map((col) => (
                    <th
                      key={col}
                      className="pb-3 font-medium cursor-pointer hover:text-foreground transition-colors select-none"
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
              <tbody className="divide-y divide-border">
                {sortedGeo.map((row) => (
                  <tr key={row.state} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-2 font-medium">{row.state}</td>
                    <td className="py-2">{row.bookings.toLocaleString()}</td>
                    <td className="py-2">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
                {sortedGeo.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">No data for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 5: Demographics + Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest Demographics */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Guest Demographics</h2>
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
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {demographics.map((entry) => (
                <div key={entry.group} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: DEMO_COLORS[entry.group] ?? "#94a3b8" }} />
                    <span>{entry.group}</span>
                  </div>
                  <span className="font-semibold">{entry.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Health */}
        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Platform Health</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Active Accounts", value: platform_health.active_accounts, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Verified Accounts", value: platform_health.verified_accounts, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
              { label: "Suspended Accounts", value: platform_health.suspended_accounts, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
              { label: "Pending Businesses", value: platform_health.pending_businesses, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} rounded-2xl p-4`}>
                <div className={`${stat.color} mb-2`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className={`text-xs font-medium mt-1 ${stat.color}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
