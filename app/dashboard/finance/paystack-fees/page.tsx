"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { useGetPaystackFeesQuery } from "@/lib/store/services/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";

const SOURCE_LABELS: Record<string, string> = {
  wallet_topup: "Wallet deposit",
  ads_topup: "Ads deposit",
  ai_points: "AI points",
  restaurant_order: "Room service",
  business_withdrawal: "Hotel payout",
  marketer_withdrawal: "Marketer payout",
  company_withdrawal: "Shettar withdrawal",
};

export default function PaystackFeesPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kind, setKind] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetPaystackFeesQuery(
    {
      page,
      search: debouncedSearch || undefined,
      kind: kind || undefined,
      source: source || undefined,
    },
    { skip: !can("finance", "view") }
  );

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
          <p className="text-sm text-slate-500 mt-2">You don&apos;t have permission to view Paystack fees.</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const fees = data?.fees ?? [];
  const meta = data?.meta;

  return (
    <div className="dash-page space-y-6">
      <div>
        <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
          Paystack Fees
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-2xl">
          Deposit and transfer charges kept by Paystack. They are not Shettar earnings. Shettar withdrawal fees are also deducted from the company wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Deposit fees", value: stats?.deposit_fees, sub: "Card and bank-transfer funding" },
          { label: "Payout transfer fees", value: stats?.payout_transfer_fees, sub: "Collected from hotels and marketers" },
          { label: "Shettar transfer fees", value: stats?.shettar_transfer_fees, sub: "Deducted from Shettar earnings" },
        ].map((card) => (
          <div key={card.label} className={`${panelClass} px-5 py-4`}>
            <p className={labelClass}>{card.label}</p>
            <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {isLoading || stats == null ? "—" : formatCurrency(card.value ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-2.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-slate-100">
          <div className="md:col-span-1">
            <label className={labelClass}>Search</label>
            <input
              type="text"
              placeholder="Reference, email, business…"
              className="input rounded-xl border-slate-200 mt-1.5"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Kind</label>
            <select
              className="input rounded-xl border-slate-200 mt-1.5"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="deposit">Deposit</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Source</label>
            <select
              className="input rounded-xl border-slate-200 mt-1.5"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-red-600 py-12 text-center">Could not load Paystack fees.</p>
        ) : fees.length === 0 ? (
          <p className="text-sm text-slate-500 py-12 text-center">No Paystack fees found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Kind</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Source</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Fee</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Party</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Reference</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-5 py-3.5 capitalize text-slate-700">{fee.kind}</td>
                    <td className="px-5 py-3.5 text-slate-700">{SOURCE_LABELS[fee.source] || fee.source}</td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-slate-900">{formatCurrency(fee.amount)}</td>
                    <td className="px-5 py-3.5 text-slate-700">{fee.business?.name || fee.account?.email || "Shettar"}</td>
                    <td className="px-5 py-3.5">
                      {fee.transaction_id ? (
                        <Link href={`/dashboard/octopus/transactions/${fee.transaction_id}`} className="font-mono text-xs text-indigo-600 hover:text-indigo-800">
                          {fee.paystack_reference || "View"}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-slate-500">{fee.paystack_reference || "—"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDateTime(fee.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta ? (
        <Pagination
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          totalCount={meta.total_count}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
