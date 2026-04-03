"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";

export default function PayoutsPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - will be replaced with API calls
  const payouts = [
    {
      id: 1,
      payout_id: "PO-2026-001",
      business: "Grand Royale Hotel",
      business_id: "GRHBLH8A9C",
      amount: 2800000,
      bank_account: "GTBank - 0123456789",
      status: "pending",
      requested_date: "2026-02-08",
      processed_date: null,
      reference: "REF-GRH-001",
    },
    {
      id: 2,
      payout_id: "PO-2026-002",
      business: "Urban Stay Inn",
      business_id: "URBSTN4A7E",
      amount: 850000,
      bank_account: "Access Bank - 9876543210",
      status: "completed",
      requested_date: "2026-02-05",
      processed_date: "2026-02-06",
      reference: "REF-URB-002",
    },
    {
      id: 3,
      payout_id: "PO-2026-003",
      business: "Skyline Apartments",
      business_id: "SLYNEBF9D2",
      amount: 1200000,
      bank_account: "Zenith Bank - 1234567890",
      status: "processing",
      requested_date: "2026-02-09",
      processed_date: null,
      reference: "REF-SKY-003",
    },
    {
      id: 4,
      payout_id: "PO-2026-004",
      business: "Ocean Breeze Resort",
      business_id: "OCNBRZE1F4",
      amount: 3200000,
      bank_account: "Not configured",
      status: "failed",
      requested_date: "2026-02-07",
      processed_date: null,
      reference: "REF-OCN-004",
    },
  ];

  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch =
      payout.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.payout_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.business_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || payout.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprovePayout = (id: number) => {
    alert(`Approving payout ${id}`);
  };

  const handleRejectPayout = (id: number) => {
    if (confirm("Are you sure you want to reject this payout?")) {
      alert(`Payout ${id} rejected`);
    }
  };

  const totalPending = payouts
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalProcessing = payouts
    .filter(p => p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCompleted = payouts
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payout Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all business payout requests
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Pending Payouts", value: formatCurrency(totalPending), count: payouts.filter(p => p.status === "pending").length, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-orange-600" },
          { label: "Processing", value: formatCurrency(totalProcessing), count: payouts.filter(p => p.status === "processing").length, icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "text-blue-600" },
          { label: "Completed This Month", value: formatCurrency(totalCompleted), count: payouts.filter(p => p.status === "completed").length, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600" },
          { label: "Failed/Rejected", value: payouts.filter(p => p.status === "failed").length, count: payouts.filter(p => p.status === "failed").length, icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-red-600" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 bg-primary/10 rounded-2xl ${stat.color}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <span className="text-xs font-bold text-muted-foreground">{stat.count} requests</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{typeof stat.value === "string" ? stat.value : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by business, payout ID, or business ID..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground border-b border-border">
              <th className="pb-4 font-medium">Payout Details</th>
              <th className="pb-4 font-medium">Business</th>
              <th className="pb-4 font-medium">Amount</th>
              <th className="pb-4 font-medium">Bank Account</th>
              <th className="pb-4 font-medium">Dates</th>
              <th className="pb-4 font-medium">Status</th>
              <th className="pb-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPayouts.map((payout) => (
              <tr key={payout.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="py-4">
                  <div>
                    <p className="font-mono font-bold text-sm">{payout.payout_id}</p>
                    <p className="text-xs text-muted-foreground">Ref: {payout.reference}</p>
                  </div>
                </td>
                <td className="py-4">
                  <div>
                    <p className="font-semibold text-sm">{payout.business}</p>
                    <p className="text-xs text-muted-foreground font-mono">{payout.business_id}</p>
                  </div>
                </td>
                <td className="py-4">
                  <p className="text-lg font-bold text-primary">{formatCurrency(payout.amount)}</p>
                </td>
                <td className="py-4">
                  <p className="text-sm">{payout.bank_account}</p>
                </td>
                <td className="py-4">
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Requested:</span> {new Date(payout.requested_date).toLocaleDateString()}</p>
                    {payout.processed_date && (
                      <p><span className="font-medium">Processed:</span> {new Date(payout.processed_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${payout.status === "completed" ? "bg-green-100 text-green-600" :
                      payout.status === "processing" ? "bg-blue-100 text-blue-600" :
                        payout.status === "pending" ? "bg-orange-100 text-orange-600" :
                          "bg-red-100 text-red-600"
                    }`}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 text-right">
                  {payout.status === "pending" && can("finance", "manage_payouts") && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApprovePayout(payout.id)}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectPayout(payout.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {payout.status !== "pending" && (
                    <button className="text-xs text-primary hover:underline font-medium">
                      View Details
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPayouts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-muted-foreground mt-4">No payouts found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
