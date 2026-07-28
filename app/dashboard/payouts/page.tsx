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
  useGetCancellationFeesQuery,
  useGetAdWalletTransactionsQuery,
  type Payout,
  type CancellationFee,
  type AdWalletTransaction,
} from "@/lib/store/services/api";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);

type Tab = "business_payouts" | "cancellation_fees" | "ad_revenue";

const TABS: { key: Tab; label: string }[] = [
  { key: "business_payouts", label: "Business Payouts" },
  { key: "cancellation_fees", label: "Cancellation Fees" },
  { key: "ad_revenue", label: "Ad Revenue" },
];

function StatusBadge({ status }: { status: Payout["status"] }) {
  const cls =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "failed"
      ? "bg-red-50 text-red-600"
      : "bg-amber-50 text-amber-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}

function DetailModal({ payout, onClose }: { payout: Payout; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`${panelClass} p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">Payout Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
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
          <hr className="border-slate-100" />
          <Row label="Amount" value={formatCurrency(payout.amount)} bold />
          <Row label="Net Amount" value={formatCurrency(payout.net_amount)} bold />
          <Row label="Commission" value={formatCurrency(payout.commission_amount)} />
          <hr className="border-slate-100" />
          <Row label="Bank" value={payout.bank_name ?? "—"} />
          <Row label="Account Number" value={payout.account_number ?? "—"} mono />
          {payout.transfer_code && <Row label="Transfer Code" value={payout.transfer_code} mono />}
          {payout.description && <Row label="Description" value={payout.description} />}
          <hr className="border-slate-100" />
          <Row label="Requested" value={new Date(payout.created_at).toLocaleString()} />
          <Row label="Updated" value={new Date(payout.updated_at).toLocaleString()} />
          {payout.rejection_reason && (
            <>
              <hr className="border-slate-100" />
              <Row label="Rejection Reason" value={payout.rejection_reason} />
              {payout.rejected_at && <Row label="Rejected At" value={new Date(payout.rejected_at).toLocaleString()} />}
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono, bold }: { label: string; value: React.ReactNode; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span
        className={`text-right text-slate-900 ${mono ? "font-mono text-xs" : ""} ${bold ? "font-semibold tabular-nums" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function ApproveDialog({ payout, onConfirm, onClose, loading }: { payout: Payout; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`${panelClass} p-6 w-full max-w-md space-y-4`}>
        <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">Approve Withdrawal</h2>
        <p className="text-slate-500 text-sm">
          Approve and retry the transfer of{" "}
          <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(payout.net_amount)}</span> to{" "}
          <span className="font-semibold text-slate-900">{payout.business_name}</span>?
        </p>
        <p className="text-xs text-slate-500">
          Bank: {payout.bank_name} — {payout.account_number}
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`${panelClass} p-6 w-full max-w-md space-y-4`}>
        <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">Reject Withdrawal</h2>
        <p className="text-slate-500 text-sm">
          Reject the withdrawal of{" "}
          <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(payout.net_amount)}</span> for{" "}
          <span className="font-semibold text-slate-900">{payout.business_name}</span>.
        </p>
        <div>
          <label className={labelClass}>
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="input resize-none rounded-xl border-slate-200 mt-1.5"
            rows={3}
            placeholder="Enter rejection reason…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancellation Fees Tab ────────────────────────────────────────────────────

function CancellationFeesTab({ can }: { can: (section: keyof AdminPermissions, action: string) => boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isFetching, isError } = useGetCancellationFeesQuery(
    { page, search: debouncedSearch || undefined },
    { skip: !can("finance", "view"), refetchOnMountOrArgChange: true }
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  }, []);

  const fees: CancellationFee[] = data?.fees ?? [];
  const stats = data?.stats;
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Total Fees Collected",
            value: stats ? formatCurrency(stats.total_amount) : "—",
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          },
          {
            label: "This Month",
            value: stats ? formatCurrency(stats.this_month_amount) : "—",
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
          },
          {
            label: "Total Count",
            value: stats ? String(stats.total_count) : "—",
            icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`${labelClass} pt-0.5`}>{stat.label}</p>
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

      <div className={`${panelClass} p-5`}>
        <label className={labelClass}>Search</label>
        <div className="relative mt-1.5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by description…"
            className="input pl-10 rounded-xl border-slate-200"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        {isError && (
          <div className="text-center py-12 text-red-600 text-sm font-medium">Failed to load cancellation fees. Please try again.</div>
        )}

        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-4">Loading cancellation fees…</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && fees.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Business</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Booking ID</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Fee Amount</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Booking Total</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Fee Rate</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{fee.business_name ?? "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{fee.booking_id ?? "—"}</td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-emerald-600">{formatCurrency(fee.amount)}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-900">{formatCurrency(fee.total_booking)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fee.fee_rate > 0 ? `${fee.fee_rate}%` : "—"}</td>
                    <td className="px-5 py-3.5 text-slate-500">{new Date(fee.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isFetching && !isError && fees.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <p className="text-slate-500 mt-4 text-sm">No cancellation fees found</p>
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

const AD_SOURCE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "paystack_card", label: "Paystack top-up" },
  { value: "withdrawable_transfer", label: "Withdrawable transfer" },
  { value: "impression_charge", label: "Impression charge" },
  { value: "click_charge", label: "Click charge" },
  { value: "refund", label: "Refund" },
  { value: "admin_adjustment", label: "Admin adjustment" },
];

function formatAdSource(source: string) {
  return AD_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? source.replace(/_/g, " ");
}

function isProfitSource(source: string) {
  return source === "impression_charge" || source === "click_charge";
}

// ── Ad Revenue Tab ───────────────────────────────────────────────────────────

function AdRevenueTab({ can }: { can: (section: keyof AdminPermissions, action: string) => boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [profitOnly, setProfitOnly] = useState(true);
  const [direction, setDirection] = useState<"" | "credit" | "debit">("");
  const [source, setSource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isFetching, isError } = useGetAdWalletTransactionsQuery(
    {
      page,
      search: debouncedSearch || undefined,
      direction: direction || undefined,
      source: source || undefined,
      from: from || undefined,
      to: to || undefined,
      profit_only: profitOnly,
    },
    { skip: !can("finance", "view"), refetchOnMountOrArgChange: true }
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  }, []);

  const transactions: AdWalletTransaction[] = data?.transactions ?? [];
  const stats = data?.stats;
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className={`${panelClass} p-4 border-emerald-200/70 bg-emerald-50/40`}>
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-emerald-700">Platform ad profit</span> comes from
          impression and click charges only. Wallet top-ups are prepaid business credits — not platform revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Platform ad profit",
            subtitle: "Impressions + clicks",
            value: stats ? formatCurrency(stats.platform_profit) : "—",
            icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
          },
          {
            label: "Impression revenue",
            subtitle: "Views billed",
            value: stats ? formatCurrency(stats.impression_revenue) : "—",
            icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
          },
          {
            label: "Click revenue",
            subtitle: "Clicks billed",
            value: stats ? formatCurrency(stats.click_revenue) : "—",
            icon: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122",
          },
          {
            label: "This month profit",
            subtitle: "Current month charges",
            value: stats ? formatCurrency(stats.this_month_profit) : "—",
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`${labelClass} pt-0.5`}>{stat.label}</p>
                {stat.subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{stat.subtitle}</p>}
              </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`${panelClass} px-5 py-4`}>
          <p className={labelClass}>Prepaid wallet funding</p>
          <p className="mt-2.5 text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
            {stats ? formatCurrency(stats.total_funded) : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Top-ups & transfers — not platform profit</p>
        </div>
        <div className={`${panelClass} px-5 py-4`}>
          <p className={labelClass}>Unspent ads balance</p>
          <p className="mt-2.5 text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
            {stats ? formatCurrency(stats.outstanding_ads_balance) : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Remaining prepaid credit across businesses</p>
        </div>
      </div>

      <div className={`${panelClass} p-5 space-y-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={profitOnly}
              onChange={(e) => {
                setProfitOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300"
            />
            Profit transactions only (impressions & clicks)
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Search</label>
            <div className="relative mt-1.5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Reference or business…"
                className="input pl-10 rounded-xl border-slate-200"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Direction</label>
            <select
              className="input rounded-xl border-slate-200 mt-1.5"
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as "" | "credit" | "debit");
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="credit">Credit (+)</option>
              <option value="debit">Debit (−)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select
              className="input rounded-xl border-slate-200 mt-1.5"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
            >
              {AD_SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>From</label>
              <input
                type="date"
                className="input rounded-xl border-slate-200 mt-1.5"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className={labelClass}>To</label>
              <input
                type="date"
                className="input rounded-xl border-slate-200 mt-1.5"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        {isError && (
          <div className="text-center py-12 text-red-600 text-sm font-medium">Failed to load ad transactions. Please try again.</div>
        )}

        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-4">Loading ad transactions…</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Reference</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Business</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Campaign</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Category</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isProfit = isProfitSource(tx.source);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{tx.reference_code}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{tx.business?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-slate-700">{tx.campaign_name ?? "—"}</td>
                      <td className="px-5 py-3.5 capitalize text-slate-700">{formatAdSource(tx.source)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            isProfit
                              ? "bg-emerald-50 text-emerald-700"
                              : tx.direction === "credit"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {isProfit ? "Profit" : tx.direction === "credit" ? "Funded" : "Debit"}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-3.5 font-semibold tabular-nums ${
                          isProfit ? "text-emerald-600" : tx.direction === "credit" ? "text-sky-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isFetching && !isError && transactions.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <p className="text-slate-500 mt-4 text-sm">No ad transactions found</p>
          </div>
        )}

        {meta && !isLoading && !isError && (
          <div className="px-5 py-4 border-t border-slate-100">
            <Pagination
              currentPage={meta.current_page}
              totalPages={Math.max(meta.total_pages, 1)}
              totalCount={meta.total_count}
              onPageChange={setPage}
              alwaysShow
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [activeTab, setActiveTab] = useState<Tab>("business_payouts");

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
    { skip: !can("finance", "view") || activeTab !== "business_payouts", refetchOnMountOrArgChange: true }
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

  const stats = statsData;

  return (
    <div className="dash-page space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Payout Management
          </h1>
          <p className="text-sm text-slate-500 mt-2">Monitor and manage all business withdrawal payouts</p>
        </div>
        {can("finance", "manage_payouts") && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-sm font-semibold ${isPaused ? "text-red-600" : "text-emerald-600"}`}>
              {pauseLoading ? "—" : isPaused ? "Payouts Paused" : "Payouts Active"}
            </span>
            <button
              onClick={handleTogglePause}
              disabled={toggling || pauseLoading}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${
                isPaused ? "bg-red-500" : "bg-emerald-500"
              }`}
              title={isPaused ? "Click to resume payouts" : "Click to pause payouts"}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  isPaused ? "translate-x-1" : "translate-x-6"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Pause Banner */}
      {isPaused && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200/80 rounded-2xl">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-red-700">
            Payouts are currently paused. All withdrawal requests will be blocked until payouts are resumed.
          </p>
        </div>
      )}

      {/* Tab Rail — Analytics-style segmented control */}
      <div
        className="inline-flex flex-wrap gap-1 p-1 rounded-2xl border border-slate-200/90 bg-slate-100/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
        role="group"
        aria-label="Payout sections"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={active}
              className={`px-4 py-2 rounded-xl text-[12px] font-semibold tracking-tight transition-all duration-150 ${
                active
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Business Payouts Tab */}
      {activeTab === "business_payouts" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Total Payouts",
                count: stats?.total ?? 0,
                amount: stats?.total_amount ?? 0,
                icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
              },
              {
                label: "Completed",
                count: stats?.completed ?? 0,
                amount: stats?.completed_amount ?? 0,
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                label: "Failed",
                count: stats?.failed ?? 0,
                amount: stats?.failed_amount ?? 0,
                icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                label: "Pending",
                count: stats?.pending ?? 0,
                amount: stats?.pending_amount ?? 0,
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              },
            ].map((stat) => (
              <div key={stat.label} className={`${panelClass} px-5 py-4`}>
                <div className="flex items-start justify-between gap-3">
                  <p className={`${labelClass} pt-0.5`}>{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                      {statsLoading ? "—" : `${stat.count} payouts`}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={stat.icon} />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
                  {statsLoading ? "—" : formatCurrency(stat.amount)}
                </p>
              </div>
            ))}
          </div>

          <div className={`${panelClass} p-5`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Search</label>
                <div className="relative mt-1.5">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by business name or ID…"
                    className="input pl-10 rounded-xl border-slate-200"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className="input rounded-xl border-slate-200 mt-1.5"
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`${panelClass} overflow-hidden`}>
            {isError && (
              <div className="text-center py-12 text-red-600 text-sm font-medium">Failed to load payouts. Please try again.</div>
            )}

            {(isLoading || isFetching) && !isError && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 mt-4">Loading payouts…</p>
              </div>
            )}

            {!isLoading && !isFetching && !isError && payouts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Business</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount / Net</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Bank Account</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Requested</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-slate-50/90 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{payout.business_name ?? "—"}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{payout.business_unique_id ?? "—"}</p>
                          {payout.user_name && <p className="text-xs text-slate-500 mt-0.5">by {payout.user_name}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 tabular-nums">{formatCurrency(payout.amount)}</p>
                          <p className="text-xs text-slate-500 tabular-nums mt-0.5">Net: {formatCurrency(payout.net_amount)}</p>
                          <p className="text-xs text-slate-500 tabular-nums">Commission: {formatCurrency(payout.commission_amount)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-900">{payout.bank_name ?? "—"}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{payout.account_number ?? "—"}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={payout.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {payout.status === "failed" && can("finance", "manage_payouts") ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setApprovePayout(payout)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-[11px] font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectPayout(payout)}
                                className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-[11px] font-semibold"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDetailPayout(payout)}
                              className="text-[13px] text-indigo-600 hover:text-indigo-700 font-semibold"
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && !isFetching && !isError && payouts.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-slate-500 mt-4 text-sm">No payouts found</p>
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
        </>
      )}

      {activeTab === "cancellation_fees" && <CancellationFeesTab can={can} />}

      {activeTab === "ad_revenue" && <AdRevenueTab can={can} />}

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
