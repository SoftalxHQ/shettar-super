"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  useGetCompanyBankAccountsQuery,
  useWithdrawPlatformRevenueMutation,
  useGetPlatformWithdrawalsQuery,
} from "@/lib/store/services/api";
import { toast } from "sonner";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(n);

function WithdrawModal({
  walletBalance,
  onClose,
  onSuccess,
}: {
  walletBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: accountsData, isLoading: accountsLoading } = useGetCompanyBankAccountsQuery();
  const [withdrawRevenue, { isLoading: withdrawing }] = useWithdrawPlatformRevenueMutation();

  const [amount, setAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const accounts = accountsData?.company_bank_accounts ?? [];
  const parsedAmount = parseFloat(amount) || 0;
  const selectedAccount = accounts.find((a) => String(a.id) === selectedAccountId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) { toast.error("Please select a bank account."); return; }
    if (parsedAmount <= 0) { toast.error("Please enter a valid amount."); return; }
    if (parsedAmount > walletBalance) { toast.error("Amount exceeds available balance."); return; }
    if (!selectedAccount?.recipient_code) { toast.error("Selected account has no Paystack recipient code. Please re-add the account."); return; }

    try {
      await withdrawRevenue({ amount: parsedAmount, company_bank_account_id: parseInt(selectedAccountId, 10) }).unwrap();
      toast.success("Withdrawal initiated successfully.");
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Withdrawal failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`${panelClass} w-full max-w-lg p-6 space-y-6`}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">Withdraw Platform Revenue</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Balance display */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Available Balance</p>
            <p className="text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums mt-1">{fmt(walletBalance)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₦</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input pl-8 rounded-xl border-slate-200"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {parsedAmount > walletBalance && parsedAmount > 0 && (
              <p className="text-xs text-red-500 mt-1">Amount exceeds available balance</p>
            )}
          </div>

          {/* Bank Account */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Destination Account <span className="text-red-500">*</span></label>
            {accountsLoading ? (
              <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
            ) : accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No registered accounts.{" "}
                <a href="/dashboard/finance/company-accounts" className="text-indigo-600 underline underline-offset-2">Add one here.</a>
              </p>
            ) : (
              <select className="input rounded-xl border-slate-200" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} required>
                <option value="">Select a bank account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={String(a.id)} disabled={!a.recipient_code}>
                    {a.bank_name} — {a.account_name} ({a.account_number}){!a.recipient_code ? " ⚠ No recipient" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected account preview */}
          {selectedAccount && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Bank</p>
                <p className="font-semibold">{selectedAccount.bank_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Number</p>
                <p className="font-semibold font-mono">{selectedAccount.account_number}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="font-semibold">{selectedAccount.account_name}</p>
              </div>
            </div>
          )}

          {/* Fee breakdown */}
          {parsedAmount > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">Breakdown</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Withdrawal amount</span>
                <span className="font-semibold">{fmt(parsedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Paystack transfer fee ({parsedAmount <= 5000 ? "₦10" : parsedAmount <= 50000 ? "₦25" : "₦50"} flat)
                </span>
                <span className="text-xs text-muted-foreground italic">From Paystack balance</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="font-semibold text-slate-900">Recipient receives</span>
                <span className="font-semibold text-slate-900 tabular-nums">{fmt(parsedAmount)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={withdrawing || accounts.length === 0 || parsedAmount > walletBalance}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {withdrawing ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Processing…</>
              ) : "Withdraw"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WithdrawRevenuePage() {
  const { admin } = useAuth();

  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const canManage = can("finance", "manage_company_accounts") || can("finance", "withdraw_revenue");

  const [showModal, setShowModal] = useState(false);

  const { data: withdrawalsData, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useGetPlatformWithdrawalsQuery(undefined, { skip: !canManage });
  const withdrawals = withdrawalsData?.withdrawals ?? [];
  const walletBalance = withdrawalsData?.wallet_balance ?? 0;

  const handleWithdrawSuccess = () => {
    setShowModal(false);
    refetchWithdrawals();
  };

  if (!canManage) {
    return (
      <div className="dash-page">
        <div className={`${panelClass} p-12 text-center`}>
          <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="font-display text-xl font-semibold mt-4 text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2">You don&apos;t have permission to withdraw platform revenue.</p>
        </div>
      </div>
    );
  }

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((s, w) => s + Number(w.amount), 0);

  return (
    <div className="dash-page space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">Withdraw Revenue</h1>
          <p className="text-sm text-slate-500 mt-2">Manage and withdraw accumulated platform earnings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Withdraw Revenue
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Wallet Balance */}
        <div className={`${panelClass} px-5 py-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Platform Wallet Balance</p>
          {withdrawalsLoading ? (
            <div className="h-8 w-36 bg-muted animate-pulse rounded-lg mt-1" />
          ) : (
            <p className="text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums mt-2.5">{fmt(walletBalance)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            From booking commissions, cancellation fees & ad impression/click charges — not ad wallet top-ups
          </p>
        </div>

        {/* Total Withdrawn */}
        <div className={`${panelClass} px-5 py-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Withdrawn</p>
          <p className="text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums mt-2.5">{withdrawalsLoading ? "—" : fmt(totalWithdrawn)}</p>
        </div>

        {/* Withdrawal Count */}
        <div className={`${panelClass} px-5 py-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Withdrawals</p>
          <p className="text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums mt-2.5">{withdrawalsLoading ? "—" : withdrawals.length}</p>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className={`${panelClass} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Withdrawal History</h2>
        </div>
        <div className="overflow-x-auto px-5 pb-5">

        {withdrawalsLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!withdrawalsLoading && withdrawals.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
            <p className="text-sm text-slate-500 mt-4">No withdrawals yet.</p>
          </div>
        )}

        {!withdrawalsLoading && withdrawals.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                <th className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Description</th>
                <th className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount</th>
                <th className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Transfer Code</th>
                <th className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Paystack Fee</th>
                <th className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                <th className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/90 transition-colors">
                  <td className="py-3.5 text-sm max-w-xs truncate text-slate-700">{w.description ?? "—"}</td>
                  <td className="py-3.5 font-semibold text-sm tabular-nums text-slate-900">{fmt(Number(w.amount))}</td>
                  <td className="py-3.5 text-xs text-slate-400 font-mono">{w.metadata?.transfer_code ?? "—"}</td>
                  <td className="py-3.5 text-xs text-slate-500">
                    {w.metadata?.paystack_transfer_fee != null
                      ? `₦${w.metadata.paystack_transfer_fee} (from Paystack balance)`
                      : "—"}
                  </td>
                  <td className="py-3.5 text-sm text-slate-500">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      w.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                      w.status === "failed" ? "bg-red-50 text-red-600" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {showModal && (
        <WithdrawModal
          walletBalance={walletBalance}
          onClose={() => setShowModal(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}
    </div>
  );
}
