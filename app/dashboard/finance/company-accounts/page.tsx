"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAppSelector } from "@/lib/store/hooks";
import { selectToken } from "@/lib/store/slices/authSlice";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  useGetCompanyBankAccountsQuery,
  useCreateCompanyBankAccountMutation,
  useDeleteCompanyBankAccountMutation,
  useGetPaystackBanksQuery,
  useLazyResolvePaystackAccountQuery,
  type CompanyBankAccount,
  type PaystackBank,
} from "@/lib/store/services/api";
import { toast } from "sonner";

function DeleteConfirmDialog({
  account,
  onConfirm,
  onClose,
  loading,
}: {
  account: CompanyBankAccount;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Remove Bank Account</h2>
        <p className="text-muted-foreground text-sm">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-foreground">{account.account_name}</span> at{" "}
          <span className="font-semibold text-foreground">{account.bank_name}</span>? This cannot be undone.
        </p>
        <p className="text-xs text-muted-foreground font-mono">{account.account_number}</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyAccountsPage() {
  const { admin } = useAuth();
  const token = useAppSelector(selectToken);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const canManage = can("finance", "manage_company_accounts");

  const { data, isLoading, isError } = useGetCompanyBankAccountsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: banksData, isLoading: banksLoading } = useGetPaystackBanksQuery(undefined, { skip: !canManage });
  const [resolveAccount, { isFetching: resolving }] = useLazyResolvePaystackAccountQuery();
  const [createAccount, { isLoading: creating }] = useCreateCompanyBankAccountMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteCompanyBankAccountMutation();

  const [confirmDelete, setConfirmDelete] = useState<CompanyBankAccount | null>(null);

  const [form, setForm] = useState({
    account_number: "",
    bank_code: "",
    account_name: "",
    bank_name: "",
    currency: "NGN",
  });
  const [resolveStatus, setResolveStatus] = useState<"idle" | "resolving" | "resolved" | "manual">("idle");

  const banks: PaystackBank[] = banksData?.data ?? [];
  const accounts = data?.company_bank_accounts ?? [];

  // Auto-resolve when account_number is 10 digits and bank_code is selected
  useEffect(() => {
    if (form.account_number.length === 10 && form.bank_code) {
      setResolveStatus("resolving");
      setForm((prev) => ({ ...prev, account_name: "" }));
      resolveAccount({ account_number: form.account_number, bank_code: form.bank_code })
        .unwrap()
        .then((res) => {
          const name = res?.data?.account_name ?? "";
          if (name) {
            setForm((prev) => ({ ...prev, account_name: name }));
            setResolveStatus("resolved");
          } else {
            // Paystack returned empty — fall back to manual
            setResolveStatus("manual");
          }
        })
        .catch(() => {
          // Business accounts often fail — allow manual entry
          setResolveStatus("manual");
        });
    } else {
      setResolveStatus("idle");
      setForm((prev) => ({ ...prev, account_name: "" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.account_number, form.bank_code]);

  const handleBankChange = (code: string) => {
    const bank = banks.find((b) => b.code === code);
    setForm((prev) => ({ ...prev, bank_code: code, bank_name: bank?.name ?? "" }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.account_name.trim()) {
      toast.error("Account name is required.");
      return;
    }
    try {
      await createAccount({
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_name: form.account_name.trim(),
        bank_code: form.bank_code,
        currency: form.currency,
      }).unwrap();
      toast.success("Bank account added successfully.");
      setForm({ account_number: "", bank_code: "", account_name: "", bank_name: "", currency: "NGN" });
      setResolveStatus("idle");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string | string[] } })?.data?.error;
      const errorText = Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to add bank account.");
      toast.error(errorText);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAccount(confirmDelete.id).unwrap();
      toast.success("Bank account removed.");
      setConfirmDelete(null);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to remove bank account.";
      toast.error(msg);
    }
  };

  if (!canManage) {
    return (
      <div className="p-8">
        <div className="glass p-12 rounded-3xl text-center">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold mt-4">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You don&apos;t have permission to manage company bank accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Bank Accounts</h1>
        <p className="text-muted-foreground mt-1">Manage the platform&apos;s registered bank accounts for revenue withdrawals.</p>
      </div>

      {/* Add Account Form */}
      <div className="glass p-6 rounded-3xl">
        <h2 className="text-lg font-bold mb-4">Add Account</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank selector */}
            <div>
              <label className="label">Bank <span className="text-red-500">*</span></label>
              {banksLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded-xl" />
              ) : (
                <select
                  className="input"
                  value={form.bank_code}
                  onChange={(e) => handleBankChange(e.target.value)}
                  required
                >
                  <option value="">Select a bank…</option>
                  {banks.map((b) => (
                    <option key={`${b.id}-${b.code}`} value={b.code}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Account number */}
            <div>
              <label className="label">Account Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input font-mono"
                placeholder="10-digit account number"
                maxLength={10}
                value={form.account_number}
                onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value.replace(/\D/g, "") }))}
                required
              />
            </div>
          </div>

          {/* Account name — auto-filled or manual */}
          <div>
            <label className="label">
              Account Name <span className="text-red-500">*</span>
              {resolveStatus === "manual" && (
                <span className="ml-2 text-xs text-orange-500 font-normal">
                  Auto-resolve unavailable — enter manually
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                className={`input ${resolveStatus === "resolved" ? "bg-slate-50 dark:bg-zinc-800/50" : ""}`}
                placeholder={
                  resolveStatus === "resolving" ? "Resolving…" :
                  resolveStatus === "manual" ? "Enter account name as it appears on the account" :
                  "Auto-filled after account resolution"
                }
                value={form.account_name}
                readOnly={resolveStatus === "resolved"}
                onChange={(e) => {
                  if (resolveStatus === "manual") {
                    setForm((prev) => ({ ...prev, account_name: e.target.value }));
                  }
                }}
                required
              />
              {resolveStatus === "resolving" && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
              {resolveStatus === "resolved" && form.account_name && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">Currency</label>
              <select className="input" value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}>
                {["NGN", "USD", "GBP", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <button
                type="submit"
                disabled={creating || resolveStatus === "resolving" || !form.account_name.trim()}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? "Adding…" : "Add Account"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Accounts Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        <h2 className="text-lg font-bold mb-4">Registered Accounts</h2>

        {isError && <div className="text-center py-12 text-red-500">Failed to load bank accounts.</div>}

        {isLoading && !isError && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!isLoading && !isError && accounts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-muted-foreground mt-4">No bank accounts registered yet.</p>
          </div>
        )}

        {!isLoading && !isError && accounts.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-4 font-medium">Bank</th>
                <th className="pb-4 font-medium">Account</th>
                <th className="pb-4 font-medium">Bank Code</th>
                <th className="pb-4 font-medium">Currency</th>
                <th className="pb-4 font-medium">Recipient</th>
                <th className="pb-4 font-medium">Added</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4 font-semibold text-sm">{account.bank_name}</td>
                  <td className="py-4">
                    <p className="text-sm">{account.account_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{account.account_number}</p>
                  </td>
                  <td className="py-4 text-sm text-muted-foreground font-mono">{account.bank_code ?? "—"}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">{account.currency}</span>
                  </td>
                  <td className="py-4">
                    {account.recipient_code ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-600">Ready</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600">Pending</span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-muted-foreground">{new Date(account.created_at).toLocaleDateString()}</td>
                  <td className="py-4 text-right">
                    <button onClick={() => setConfirmDelete(account)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <DeleteConfirmDialog account={confirmDelete} onConfirm={handleDelete} onClose={() => setConfirmDelete(null)} loading={deleting} />
      )}
    </div>
  );
}
