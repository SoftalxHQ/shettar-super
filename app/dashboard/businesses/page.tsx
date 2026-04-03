"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useGetBusinessesQuery, type Business } from "@/lib/store/services/api";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

export default function BusinessesPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching } = useGetBusinessesQuery({
    page,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    verification: verificationFilter !== "all" ? verificationFilter : undefined,
  }, { skip: !can("businesses", "view") });

  const businesses = data?.businesses ?? [];
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

  const handleVerificationChange = (value: string) => {
    setVerificationFilter(value);
    setPage(1);
  };

  const pendingCount = businesses.filter((b) => b.verification_status === "pending").length;
  const activeCount = businesses.filter((b) => !b.suspended && b.verification_status === "approved").length;
  const suspendedCount = businesses.filter((b) => b.suspended).length;

  if (!can("businesses", "view")) {
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Business Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all registered businesses on the platform
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Businesses",
            value: meta?.total_count ?? "—",
            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
          },
          {
            label: "Pending Verification",
            value: pendingCount,
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-orange-600",
          },
          {
            label: "Active",
            value: activeCount,
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-green-600",
          },
          {
            label: "Suspended",
            value: suspendedCount,
            icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
            color: "text-red-600",
          },
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
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, ID, or owner..."
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
          <div>
            <label className="label">Verification</label>
            <select className="input" value={verificationFilter} onChange={(e) => handleVerificationChange(e.target.value)}>
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        {isError && (
          <div className="text-center py-12 text-red-500">
            Failed to load businesses. Please try again.
          </div>
        )}

        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">Loading businesses...</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-4 font-medium">Business</th>
                <th className="pb-4 font-medium">Owner</th>
                <th className="pb-4 font-medium">Balances</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {businesses.map((business: Business) => (
                <tr key={business.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold">
                        {business.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/dashboard/businesses/${business.id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {business.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{business.business_unique_id}</span>
                          {business.category && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-muted-foreground">
                              {business.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{business.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-medium">{business.owner_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{business.owner_email ?? "—"}</p>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1">
                      <p className="text-xs">
                        <span className="font-medium">Available:</span>{" "}
                        {formatCurrency(business.withdrawable_balance)}
                      </p>
                      <p className="text-xs">
                        <span className="font-medium">Pending:</span>{" "}
                        {formatCurrency(business.pending_balance)}
                      </p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="space-y-2">
                      {business.suspended && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold inline-block bg-red-100 text-red-600">
                          Suspended
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold inline-block ${
                          business.verification_status === "approved"
                            ? "bg-green-100 text-green-600"
                            : business.verification_status === "rejected"
                            ? "bg-red-100 text-red-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {business.verification_status.charAt(0).toUpperCase() +
                          business.verification_status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <Link
                      href={`/dashboard/businesses/${business.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && !isFetching && !isError && businesses.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-muted-foreground mt-4">No businesses found matching your filters</p>
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
