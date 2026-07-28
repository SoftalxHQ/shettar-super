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
      sub: stats?.pending_payouts
        ? `${formatCurrency(stats.pending_payouts)} pending payouts`
        : "",
      icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z",
      iconWrap: "bg-slate-100 text-slate-500",
    },
    {
      label: "Active Businesses",
      value: stats ? stats.active_businesses.toLocaleString() : "—",
      sub: stats ? `${stats.pending_businesses} pending verification` : "",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      iconWrap: "bg-slate-100 text-slate-500",
    },
    {
      label: "Customer Accounts",
      value: stats ? stats.active_accounts.toLocaleString() : "—",
      sub: stats ? `${stats.total_accounts.toLocaleString()} total registered` : "",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      iconWrap: "bg-slate-100 text-slate-500",
    },
    {
      label: "Open Support Tickets",
      value: stats ? stats.open_tickets.toLocaleString() : "—",
      sub: "open & in progress",
      icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
      iconWrap: "bg-slate-100 text-slate-500",
    },
  ];

  return (
    <div className="dash-page space-y-6">
      <header className="dash-enter flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Overview
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">
            Welcome back, {admin?.first_name || "Admin"}. Here&apos;s what&apos;s happening on the Shettar platform.
          </p>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 pt-1 sm:pt-0">
          Live summary
        </p>
      </header>

      <div className="dash-enter dash-enter-delay grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 pt-0.5">
                {card.label}
              </p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.iconWrap}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={card.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {isLoading ? (
                <span className="inline-block h-7 w-20 rounded-md bg-slate-100 animate-pulse" />
              ) : (
                card.value
              )}
            </p>
            {card.sub ? (
              <p className="text-xs text-slate-500 mt-2.5 leading-snug">{card.sub}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="dash-enter dash-enter-delay-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">
              Recent businesses
            </h2>
            <Link
              href="/dashboard/businesses"
              className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all
            </Link>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentBusinesses.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No businesses yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentBusinesses.map((business) => (
                <li key={business.id}>
                  <Link
                    href={`/dashboard/businesses/${encodeURIComponent(business.business_unique_id)}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/90 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0">
                        {business.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{business.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {business.city}, {business.state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                          business.verification_status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : business.verification_status === "rejected"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {business.verification_status}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 tabular-nums">{formatDate(business.created_at)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] overflow-hidden flex flex-col min-h-[280px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">
              Active support tickets
            </h2>
            <Link
              href="/dashboard/support"
              className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all
            </Link>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">No open tickets</p>
              <p className="text-xs text-slate-400 mt-1">Support queue is clear</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/dashboard/support/${ticket.id}`}
                    className="block px-5 py-3 hover:bg-slate-50/90 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-mono font-medium text-slate-400">
                        {ticket.ticket_id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                          ticket.priority === "high"
                            ? "bg-red-50 text-red-600"
                            : ticket.priority === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-slate-900 truncate mb-1">{ticket.subject}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 truncate">
                        {ticket.business?.name || ticket.user?.name || "—"}
                      </p>
                      <span
                        className={`text-[11px] font-medium ml-2 flex-shrink-0 capitalize ${
                          ticket.status === "open"
                            ? "text-red-600"
                            : ticket.status === "in_progress"
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
