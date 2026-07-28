"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useGetAccountsQuery } from "@/lib/store/services/api";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { normalizeApiMediaUrl } from "@/lib/media-url";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

export default function UserAccountsPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, isError, isFetching } = useGetAccountsQuery({
    page,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }, { skip: !can("accounts", "view") });

  const accounts = data?.accounts ?? [];
  const meta = data?.meta;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  if (!can("accounts", "view")) {
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

  return (
    <div className="dash-page space-y-6">
      <div>
        <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
          Customers
        </h1>
        <p className="text-sm text-slate-500 mt-2">Manage all customer accounts on the platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Accounts", value: meta?.total_count ?? "—", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
          { label: "Active", value: accounts.filter(a => a.status === "active").length, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Pending", value: accounts.filter(a => a.status === "pending").length, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Suspended", value: accounts.filter(a => a.status === "suspended").length, icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
        ].map((stat) => (
          <div key={stat.label} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 pt-0.5">
                {stat.label}
              </p>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {isLoading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className={`${panelClass} p-4 md:p-5`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
            <div className="relative mt-1.5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        {isError && (
          <div className="text-center py-12 text-red-600 text-sm font-medium">
            Failed to load accounts. Please try again.
          </div>
        )}

        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-4">Loading accounts…</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Account</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Activity</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Wallet</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {account.avatar_url ? (
                          <img
                            src={normalizeApiMediaUrl(account.avatar_url)}
                            alt={`${account.first_name} ${account.last_name}`}
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-10 rounded-full object-cover bg-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                            {account.first_name[0]}{account.last_name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{account.first_name} {account.last_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{account.email}</p>
                          <p className="text-xs text-slate-400">{account.phone_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-700"><span className="font-medium text-slate-600">Joined:</span> {formatDate(account.created_at)}</p>
                        <p className="text-slate-500">Last login: {account.last_sign_in_at ? formatDate(account.last_sign_in_at) : "Never"}</p>
                        <p className="text-slate-500">{account.total_bookings} bookings</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-sm tabular-nums text-slate-900">
                      ₦{account.wallet_balance.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                        account.status === "active" ? "bg-emerald-50 text-emerald-700" :
                        account.status === "pending" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-600"
                      }`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/accounts/${account.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-[13px] font-semibold"
                      >
                        View
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isFetching && !isError && accounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">No accounts found</p>
          </div>
        )}
      </div>

      {meta && (
        <Pagination
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          totalCount={meta.total_count}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
