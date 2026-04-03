"use client";

import Link from "next/link";
import { useGetDashboardSummaryQuery } from "@/lib/store/services/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString()}`;
}

export default function DashboardPage() {
  const { admin } = useAuth();
  const { data, isLoading } = useGetDashboardSummaryQuery();

  const stats = data?.stats;
  const recentBusinesses = data?.recent_businesses ?? [];
  const recentTickets = data?.recent_tickets ?? [];

  const kpiCards = [
    {
      label: "Total Revenue",
      value: stats ? formatCurrency(stats.total_revenue) : "—",
      sub: `${stats?.pending_payouts ? formatCurrency(stats.pending_payouts) + " pending payouts" : ""}`,
      icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z",
      color: "text-primary",
    },
    {
      label: "Active Businesses",
      value: stats ? stats.active_businesses.toLocaleString() : "—",
      sub: stats ? `${stats.pending_businesses} pending verification` : "",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      color: "text-blue-600",
    },
    {
      label: "Customer Accounts",
      value: stats ? stats.active_accounts.toLocaleString() : "—",
      sub: stats ? `${stats.total_accounts.toLocaleString()} total registered` : "",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      color: "text-green-600",
    },
    {
      label: "Open Support Tickets",
      value: stats ? stats.open_tickets.toLocaleString() : "—",
      sub: "open & in progress",
      icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {admin?.first_name || "Admin"}. Here&apos;s what&apos;s happening on the Shettar platform.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => (
          <div key={i} className="glass p-6 rounded-3xl hover:shadow-xl transition-shadow duration-300">
            <div className={`p-3 bg-primary/10 rounded-2xl w-fit mb-4 ${card.color}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-1">
              {isLoading ? <span className="animate-pulse bg-slate-200 dark:bg-zinc-700 rounded h-7 w-20 inline-block" /> : card.value}
            </p>
            {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Registered Businesses */}
        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Recently Registered Businesses</h3>
            <Link href="/dashboard/businesses" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : recentBusinesses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No businesses yet</p>
          ) : (
            <div className="space-y-3">
              {recentBusinesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/dashboard/businesses/${business.id}`}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
                      {business.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{business.name}</p>
                      <p className="text-xs text-muted-foreground">{business.city}, {business.state}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      business.verification_status === "approved" ? "bg-green-100 text-green-600" :
                      business.verification_status === "rejected" ? "bg-red-100 text-red-600" :
                      "bg-orange-100 text-orange-600"
                    }`}>
                      {business.verification_status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(business.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active Support Tickets */}
        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Active Support Tickets</h3>
            <Link href="/dashboard/support" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No open tickets</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/support/${ticket.id}`}
                  className="block p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-muted-foreground">{ticket.ticket_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      ticket.priority === "high" ? "bg-red-100 text-red-600" :
                      ticket.priority === "medium" ? "bg-orange-100 text-orange-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1 truncate">{ticket.subject}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">{ticket.business?.name || ticket.user?.name || "—"}</p>
                    <span className={`text-xs font-medium ml-2 flex-shrink-0 ${
                      ticket.status === "open" ? "text-red-600" :
                      ticket.status === "in_progress" ? "text-orange-600" :
                      "text-green-600"
                    }`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
