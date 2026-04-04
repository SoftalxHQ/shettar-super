"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  useGetPayoutsQuery,
  useGetPayoutStatsQuery,
  useApprovePayoutMutation,
  useRejectPayoutMutation,
  useGetPayoutStatusQuery,
  useTogglePayoutPauseMutation,
  type Payout,
} from "@/lib/store/services/api";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);

function StatusBadge({ status }: { status: Payout["status"] }) {
  const cls =
    status === "completed"
      ? "bg-green-100 text-green-600"
      : status === "failed"
      ? "bg-red-100 text-red-600"
      : "bg-orange-100 text-orange-600";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DetailModal({ payout, onClose }: { payout: Payout; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Payout Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="ID" value={`#${payout.id}`} />
          <Row label="Business" value={payout.business_name ?? "—"} />
          <Row label="Business ID" value={payout.business_unique_id ?? "—"} mono />
          <Row label="Requested by" value={payout.user_name ?? "—"} />
          <Row label="Status" value={<StatusBadge status={payout.status} />} />
          <hr className="border-border" />
          <Row label="Amount" value={formatCurrency(payout.amount)} bold />
          <Row label="Net Amount" value={formatCurrency(payout.net_amount)} bold />
          <Row label="Commission" value={formatCurrency(payout.commission_amount)} />
          <hr className="border-border" />
          <Row label="Bank" value={payout.bank_name ?? "—"} />
          <Row label="Account Number" value={payout.account_number ?? "—"} mono />
          {payout.transfer_code && <Row label="Transfer Code" value={payout.transfer_code} mono />}
          {payout.description && <Row label="Description" value={payout.description} />}
          <hr className="border-border" />
          <Row label="Requested" value={new Date(payout.created_at).toLocaleString()} />
          <Row label="Updated" value={new Date(payout.updated_at).toLocaleString()} />
          {payout.rejection_reason && (
            <>
              <hr className="border-border" />
              <Row label="Rejection Reason" value={payout.rejection_reason} />
              {payout.rejected_at && <Row label="Rejected At" value={new Date(payout.rejected_at).toLocaleString()} />}
            </>
          )}
        </div>

        <button onClick={onClose} className="w-full mt-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono, bold }: { label: string; value: React.ReactNode; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : ""} ${bold ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}

function ApproveDialog({ payout, onConfirm, onClose, loading }: { payout: Payout; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Approve Withdrawal</h2>
        <p className="text-muted-foreground text-sm">
          Approve and retry the transfer of <span className="font-bold text-foreground">{formatCurrency(payout.net_amount)}</span> to{" "}
          <span className="font-semibold text-foreground">{payout.business_name}</span>?
        </p>
        <p className="text-xs text-muted-foreground">Bank: {payout.bank_name} — {payout.account_number}</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Processing…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectDialog({ payout, onConfirm, onClose, loading }: { payout: Payout; onConfirm: (reason: string) => void; onClose: () => void; loading: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Reject Withdrawal</h2>
        <p className="text-muted-foreground text-sm">
          Reject the withdrawal of <span className="font-bold text-foreground">{formatCurrency(payout.net_amount)}</span> for{" "}
          <span className="font-semibold text-foreground">{payout.business_name}</span>.
        </p>
        <div>
          <label className="label">Reason <span className="text-red-500">*</span></label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Enter rejection reason…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading || !reason.trim()} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayoutsPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [detailPayout, setDetailPayout] = useState<Payout | null>(null);
  const [approvePayout, setApprovePayout] = useState<Payout | null>(null);
  const [rejectPayout, setRejectPayout] = useState<Payout | null>(null);

  const { data: statsData, isLoading: statsLoading } = useGetPayoutStatsQuery(undefined, {
    skip: !can("finance", "view"),
    refetchOnMountOrArgChange: true,
  });

  const { data, isLoading, isFetching, isError } = useGetPayoutsQuery(
    { page, status: statusFilter, search: debouncedSearch || undefined },
    { skip: !can("finance", "view"), refetchOnMountOrArgChange: true }
  );

  const [approvePayoutMutation, { isLoading: approving }] = useApprovePayoutMutation();
  const [rejectPayoutMutation, { isLoading: rejecting }] = useRejectPayoutMutation();
  const { data: pauseData, isLoading: pauseLoading } = useGetPayoutStatusQuery(undefined, {
    skip: !can("finance", "view"),
    refetchOnMountOrArgChange: true,
  });
  const [togglePause, { isLoading: toggling }] = useTogglePayoutPauseMutation();

  const isPaused = pauseData?.payouts_paused ?? false;

  const handleTogglePause = async () => {
    try {
      const result = await togglePause().unwrap();
      toast.success(result.message);
    } catch {
      toast.error("Failed to update payout status");
    }
  };

  const payouts = data?.payouts ?? [];
  const meta = data?.meta;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  }, []);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleApprove = async () => {
    if (!approvePayout) return;
    try {
      await approvePayoutMutation(approvePayout.id).unwrap();
      toast.success("Withdrawal approved and transfer initiated");
      setApprovePayout(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to approve withdrawal";
      toast.error(msg);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectPayout) return;
    try {
      await rejectPayoutMutation({ id: rejectPayout.id, reason }).unwrap();
      toast.success("Withdrawal rejected");
      setRejectPayout(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to reject withdrawal";
      toast.error(msg);
    }
  };

  if (!can("finance", "view")) {
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

  const stats = statsData;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payout Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all business withdrawal payouts</p>
        </div>
        {can("finance", "manage_payouts") && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-sm font-semibold ${isPaused ? "text-red-600" : "text-green-600"}`}>
              {pauseLoading ? "—" : isPaused ? "Payouts Paused" : "Payouts Active"}
            </span>
            <button
              onClick={handleTogglePause}
              disabled={toggling || pauseLoading}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${isPaused ? "bg-red-500" : "bg-green-500"}`}
              title={isPaused ? "Click to resume payouts" : "Click to pause payouts"}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isPaused ? "translate-x-1" : "translate-x-8"}`} />
            </button>
          </div>
        )}
      </div>

      {/* Pause Banner */}
      {isPaused && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            Payouts are currently paused. All withdrawal requests will be blocked until payouts are resumed.
          </p>
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Payouts",
            count: stats?.total ?? 0,
            amount: stats?.total_amount ?? 0,
            icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
            color: "text-slate-600",
          },
          {
            label: "Completed",
            count: stats?.completed ?? 0,
            amount: stats?.completed_amount ?? 0,
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-green-600",
          },
          {
            label: "Failed",
            count: stats?.failed ?? 0,
            amount: stats?.failed_amount ?? 0,
            icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-red-600",
          },
          {
            label: "Pending",
            count: stats?.pending ?? 0,
            amount: stats?.pending_amount ?? 0,
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-orange-600",
          },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 bg-primary/10 rounded-2xl ${stat.color}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {statsLoading ? "—" : stat.count} payouts
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{statsLoading ? "—" : formatCurrency(stat.amount)}</p>
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
                placeholder="Search by business name or ID…"
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
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        {isError && (
          <div className="text-center py-12 text-red-500">Failed to load payouts. Please try again.</div>
        )}

        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">Loading payouts…</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-4 font-medium">Business</th>
                <th className="pb-4 font-medium">Amount / Net</th>
                <th className="pb-4 font-medium">Bank Account</th>
                <th className="pb-4 font-medium">Requested</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((payout) => (
                <tr key={payout.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4">
                    <p className="font-semibold text-sm">{payout.business_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{payout.business_unique_id ?? "—"}</p>
                    {payout.user_name && <p className="text-xs text-muted-foreground">by {payout.user_name}</p>}
                  </td>
                  <td className="py-4">
                    <p className="font-bold text-sm">{formatCurrency(payout.amount)}</p>
                    <p className="text-xs text-muted-foreground">Net: {formatCurrency(payout.net_amount)}</p>
                    <p className="text-xs text-muted-foreground">Fee: {formatCurrency(payout.commission_amount)}</p>
                  </td>
                  <td className="py-4">
                    <p className="text-sm">{payout.bank_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{payout.account_number ?? "—"}</p>
                  </td>
                  <td className="py-4 text-sm text-muted-foreground">
                    {new Date(payout.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <StatusBadge status={payout.status} />
                  </td>
                  <td className="py-4 text-right">
                    {payout.status === "failed" && can("finance", "manage_payouts") ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setApprovePayout(payout)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectPayout(payout)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDetailPayout(payout)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && !isFetching && !isError && payouts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-muted-foreground mt-4">No payouts found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && (
        <Pagination
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          totalCount={meta.total_count}
          onPageChange={setPage}
        />
      )}

      {/* Modals */}
      {detailPayout && <DetailModal payout={detailPayout} onClose={() => setDetailPayout(null)} />}
      {approvePayout && (
        <ApproveDialog
          payout={approvePayout}
          onConfirm={handleApprove}
          onClose={() => setApprovePayout(null)}
          loading={approving}
        />
      )}
      {rejectPayout && (
        <RejectDialog
          payout={rejectPayout}
          onConfirm={handleReject}
          onClose={() => setRejectPayout(null)}
          loading={rejecting}
        />
      )}
    </div>
  );
}
