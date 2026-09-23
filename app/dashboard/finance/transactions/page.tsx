"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { useGetAdminTransactionsQuery } from "@/lib/store/services/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const fieldClass =
  "input h-8 rounded-lg border-slate-200 px-2.5 py-1 text-xs";

const TYPE_OPTIONS = ["income", "withdrawal", "refund", "adjustment", "debit", "payment"];
const STATUS_OPTIONS = ["pending", "completed", "failed"];
const METHOD_OPTIONS = ["wallet", "card", "pos", "cash", "transfer", "crypto"];

export default function FinanceTransactionsPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching } = useGetAdminTransactionsQuery(
    {
      page,
      search: debouncedSearch || undefined,
      transaction_type: transactionType || undefined,
      status: status || undefined,
      payment_method: paymentMethod || undefined,
      from: from || undefined,
      to: to || undefined,
    },
    { skip: !can("finance", "view") }
  );

  const transactions = data?.transactions ?? [];
  const stats = data?.stats;
  const meta = data?.meta;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    return () => clearTimeout(timer);
  }, []);

  if (!can("finance", "view")) {
    return (
      <div className="dash-page">
        <div className={`${panelClass} p-12 text-center`}>
          <h2 className="font-display text-xl font-semibold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2">You don&apos;t have permission to view transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page space-y-6">
      <div>
        <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
          Transactions
        </h1>
        <p className="text-sm text-slate-500 mt-2">Search by reference, account, or business</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total transactions",
            value: stats ? stats.total_count.toLocaleString() : "—",
            sub: stats ? `${stats.pending_count.toLocaleString()} pending · ${stats.failed_count.toLocaleString()} failed` : "All records on the system",
          },
          {
            label: "Completed volume",
            value: stats ? formatCurrency(stats.completed_amount) : "—",
            sub: stats ? `${stats.completed_count.toLocaleString()} completed` : "Sum of completed amounts",
          },
          {
            label: "Income",
            value: stats ? formatCurrency(stats.income_amount) : "—",
            sub: "Completed money in",
          },
          {
            label: "Withdrawals",
            value: stats ? formatCurrency(stats.withdrawal_amount) : "—",
            sub: "Completed money out",
          },
        ].map((card) => (
          <div key={card.label} className={`${panelClass} px-4 py-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {isLoading ? <span className="inline-block h-5 w-16 rounded bg-slate-100 animate-pulse" /> : card.value}
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className={`${panelClass} px-3 py-2.5`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-52">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Reference, email, business"
              className={`${fieldClass} pl-7`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <select
            aria-label="Type"
            className={`${fieldClass} w-full sm:w-28 capitalize`}
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Type</option>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            aria-label="Status"
            className={`${fieldClass} w-full sm:w-28 capitalize`}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            aria-label="Method"
            className={`${fieldClass} w-full sm:w-28 capitalize`}
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Method</option>
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <input
            type="date"
            aria-label="From"
            className={`${fieldClass} w-full sm:w-32`}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="date"
            aria-label="To"
            className={`${fieldClass} w-full sm:w-32`}
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className={panelClass}>
        {isError && (
          <p className="p-6 text-sm text-red-600">Failed to load transactions.</p>
        )}
        {(isLoading || isFetching) && !isError && (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        )}
        {!isLoading && !isFetching && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Reference</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Method</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Party</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/octopus/transactions/${txn.id}`}
                        className="font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {txn.reference_code}
                      </Link>
                      {txn.description ? (
                        <p className="text-xs text-slate-500 mt-0.5 max-w-[16rem] truncate">{txn.description}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-slate-900">
                      {formatCurrency(Number(txn.amount))}
                    </td>
                    <td className="px-5 py-3.5 capitalize text-slate-700">{txn.transaction_type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                        txn.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                        txn.status === "pending" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-600"
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-slate-600">{txn.payment_method || "—"}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-800">{txn.account?.name || txn.business?.name || "—"}</p>
                      <p className="text-xs text-slate-500">{txn.account?.email || ""}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDateTime(txn.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !isFetching && !isError && transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">No transactions found</p>
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
