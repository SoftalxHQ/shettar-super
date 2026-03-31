"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useGetAccountsQuery } from "@/lib/store/services/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function UserAccountsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, isError, isFetching } = useGetAccountsQuery({
    page,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const accounts = data?.accounts ?? [];
  const meta = data?.meta;

  // Debounce search input
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Customer Accounts</h1>
        <p className="text-muted-foreground mt-1">Manage all customer accounts on the platform</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Accounts", value: meta?.total_count ?? "—", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
          { label: "Active", value: accounts.filter(a => a.status === "active").length, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600" },
          { label: "Pending", value: accounts.filter(a => a.status === "pending").length, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-orange-600" },
          { label: "Suspended", value: accounts.filter(a => a.status === "suspended").length, icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", color: "text-red-600" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className={`p-3 bg-primary/10 rounded-2xl inline-flex mb-3 ${stat.color || "text-primary"}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{isLoading ? "—" : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        {isError && (
          <div className="text-center py-12 text-red-500">
            Failed to load accounts. Please try again.
          </div>
        )}

        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">Loading accounts...</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-4 font-medium">Account</th>
                <th className="pb-4 font-medium">Activity</th>
                <th className="pb-4 font-medium">Wallet</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((account) => (
                <tr key={account.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        {account.first_name[0]}{account.last_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{account.first_name} {account.last_name}</p>
                        <p className="text-xs text-muted-foreground">{account.email}</p>
                        <p className="text-xs text-muted-foreground">{account.phone_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-medium">Joined:</span> {formatDate(account.created_at)}</p>
                      <p className="text-xs text-muted-foreground">Last login: {account.last_sign_in_at ? formatDate(account.last_sign_in_at) : "Never"}</p>
                      <p className="text-xs text-muted-foreground">{account.total_bookings} bookings</p>
                    </div>
                  </td>
                  <td className="py-4 font-semibold text-sm">
                    ₦{account.wallet_balance.toLocaleString()}
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      account.status === "active" ? "bg-green-100 text-green-600" :
                      account.status === "pending" ? "bg-orange-100 text-orange-600" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <Link href={`/dashboard/accounts/${account.id}`} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors inline-flex">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && !isFetching && !isError && accounts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-muted-foreground mt-4">No accounts found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.total_pages} ({meta.total_count} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page === 1}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
              disabled={meta.current_page === meta.total_pages}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
