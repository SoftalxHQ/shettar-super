"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAppSelector } from "@/lib/store/hooks";
import { selectToken } from "@/lib/store/slices/authSlice";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  useGetCompanyBankAccountsQuery,
  useWithdrawPlatformRevenueMutation,
  useGetPlatformWithdrawalsQuery,
} from "@/lib/store/services/api";
import { toast } from "sonner";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Withdraw Platform Revenue</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Balance display */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold text-emerald-600">{fmt(walletBalance)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="label">Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₦</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input pl-8"
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
            <label className="label">Destination Account <span className="text-red-500">*</span></label>
            {accountsLoading ? (
              <div className="h-10 bg-muted animate-pulse rounded-xl" />
            ) : accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No registered accounts.{" "}
                <a href="/dashboard/finance/company-accounts" className="text-primary underline underline-offset-2">Add one here.</a>
              </p>
            ) : (
              <select className="input" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} required>
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
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl grid grid-cols-2 gap-3 text-sm">
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
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl space-y-2 text-sm">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Breakdown</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Withdrawal amount</span>
                <span className="font-semibold">{fmt(parsedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paystack fee</span>
                <span className="text-xs text-muted-foreground italic">From Paystack balance</span>
              </div>
              <div className="border-t border-indigo-200 pt-2 flex justify-between">
                <span className="font-bold">You receive</span>
                <span className="font-bold text-emerald-600">{fmt(parsedAmount)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={withdrawing || accounts.length === 0 || parsedAmount > walletBalance}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
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
  const token = useAppSelector(selectToken);

  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const canManage = can("finance", "manage_company_accounts");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { data: withdrawalsData, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useGetPlatformWithdrawalsQuery(undefined, { skip: !canManage });
  const withdrawals = withdrawalsData?.withdrawals ?? [];

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const res = await fetch(`${API_URL}/api/v1/configurations`, {
        headers: { Authorization: `Bearer ${token}`, "X-Client-Platform": "web-super" },
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.wallet_balance ?? 0);
      }
    } catch { /* silent */ } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) fetchBalance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const handleWithdrawSuccess = () => {
    setShowModal(false);
    fetchBalance();
    refetchWithdrawals();
  };

  if (!canManage) {
    return (
      <div className="p-8">
        <div className="glass p-12 rounded-3xl text-center">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold mt-4">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You don&apos;t have permission to withdraw platform revenue.</p>
        </div>
      </div>
    );
  }

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((s, w) => s + Number(w.amount), 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Platform Revenue</h1>
          <p className="text-muted-foreground mt-1">Manage and withdraw accumulated platform earnings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Withdraw Revenue
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <div className="glass p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Platform Wallet Balance</p>
          {balanceLoading ? (
            <div className="h-8 w-36 bg-muted animate-pulse rounded-lg mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1 text-emerald-600">{fmt(walletBalance ?? 0)}</p>
          )}
        </div>

        {/* Total Withdrawn */}
        <div className="glass p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Withdrawn</p>
          <p className="text-2xl font-bold mt-1">{withdrawalsLoading ? "—" : fmt(totalWithdrawn)}</p>
        </div>

        {/* Withdrawal Count */}
        <div className="glass p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
          <p className="text-2xl font-bold mt-1">{withdrawalsLoading ? "—" : withdrawals.length}</p>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        <h2 className="text-lg font-bold mb-4">Withdrawal History</h2>

        {withdrawalsLoading && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!withdrawalsLoading && withdrawals.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
            <p className="text-muted-foreground mt-4">No withdrawals yet.</p>
          </div>
        )}

        {!withdrawalsLoading && withdrawals.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-4 font-medium">Description</th>
                <th className="pb-4 font-medium">Amount</th>
                <th className="pb-4 font-medium">Transfer Code</th>
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4 text-sm max-w-xs truncate">{w.description ?? "—"}</td>
                  <td className="py-4 font-bold text-sm">{fmt(Number(w.amount))}</td>
                  <td className="py-4 text-xs text-muted-foreground font-mono">{w.metadata?.transfer_code ?? "—"}</td>
                  <td className="py-4 text-sm text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      w.status === "completed" ? "bg-green-100 text-green-600" :
                      w.status === "failed" ? "bg-red-100 text-red-600" :
                      "bg-orange-100 text-orange-600"
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

      {showModal && walletBalance !== null && (
        <WithdrawModal
          walletBalance={walletBalance}
          onClose={() => setShowModal(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}
    </div>
  );
}
