"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useGetMarketerQuery,
  useUpdateMarketerMutation,
  useGetMarketerPerformanceQuery,
  useGetMarketerTransactionsQuery,
} from "@/lib/store/services/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  MarketerCommissionTiersEditor,
  DEFAULT_MARKETER_TIERS,
  tierLabel,
  type CommissionTier,
} from "@/components/marketer-commission-tiers-editor";

const DEACT_REASONS = [
  { value: "", label: "Select a reason..." },
  { value: "Contract suspension — The marketer's contract has been temporarily suspended pending review.", label: "Suspension" },
  { value: "Employment terminated — The marketer's affiliation with Shettar has been formally terminated.", label: "Termination / Fired" },
  { value: "Policy violation — The account has been deactivated due to a breach of Shettar's marketer terms.", label: "Policy Violation" },
  { value: "Voluntary resignation — The marketer has voluntarily resigned from the Shettar affiliate programme.", label: "Resignation" },
  { value: "Account under investigation — This account has been temporarily suspended while an internal review is conducted.", label: "Under Investigation" },
  { value: "Inactivity — The account has been deactivated due to a prolonged period of inactivity.", label: "Inactivity" },
];

const ACT_REASONS = [
  { value: "", label: "Select a reason..." },
  { value: "Account reinstated — After a thorough review, your account has been fully reinstated.", label: "Reinstated" },
  { value: "Onboarding complete — Your onboarding process has been completed successfully.", label: "Onboarding Complete" },
  { value: "Appeal approved — Your appeal has been reviewed and approved. Your account has been reactivated.", label: "Appeal Approved" },
  { value: "Contract renewed — Your marketer contract has been renewed and your account access restored.", label: "Contract Renewed" },
];

function Spinner() {
  return <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />;
}

export default function MarketerDetailPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState("overview");
  const [txFilter, setTxFilter] = useState("all");
  const [txPage, setTxPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [action, setAction] = useState<{ type: string; title: string; confirmText: string; variant: "green" | "red"; reasons?: { value: string; label: string }[] } | null>(null);
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [commissionRateInput, setCommissionRateInput] = useState("");
  const [useCustomTiers, setUseCustomTiers] = useState(false);
  const [customTiers, setCustomTiers] = useState<CommissionTier[]>(DEFAULT_MARKETER_TIERS);

  const [updateMarketer, { isLoading: isUpdating }] = useUpdateMarketerMutation();
  const { data, isLoading, isError } = useGetMarketerQuery(id, { skip: !can("marketers", "view") });
  const { data: perfData, isLoading: perfLoading } = useGetMarketerPerformanceQuery(id, { skip: activeTab !== "performance" });
  const { data: txData, isLoading: txLoading } = useGetMarketerTransactionsQuery(
    { id, page: txPage, transaction_type: txFilter },
    { skip: activeTab !== "transactions" }
  );

  const marketer = data?.marketer as any;
  const perf = perfData as any;
  const transactions = txData?.transactions ?? [];
  const txMeta = txData?.meta;

  const openAction = (type: string, title: string, confirmText: string, variant: "green" | "red", reasons?: typeof DEACT_REASONS) => {
    setAction({ type, title, confirmText, variant, reasons });
    setSelectedReason("");
    setShowModal(true);
  };

  const openCommissionForm = () => {
    if (!marketer) return;
    setCommissionRateInput(marketer.commission_rate != null ? String(marketer.commission_rate) : "");
    setUseCustomTiers(!!marketer.use_custom_commission_tiers);
    setCustomTiers(
      (marketer.custom_commission_tiers ?? marketer.default_commission_tiers ?? DEFAULT_MARKETER_TIERS).map((t: CommissionTier) => ({
        min_rooms: t.min_rooms ?? 0,
        max_rooms: t.max_rooms ?? null,
        amount: Number(t.amount) || 0,
      }))
    );
    setShowCommissionForm(true);
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = commissionRateInput.trim() === "" ? 0 : parseFloat(commissionRateInput);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Booking commission rate must be between 0 and 100");
      return;
    }
    try {
      await updateMarketer({
        id: Number(id),
        marketer: {
          commission_rate: rate,
          use_custom_commission_tiers: useCustomTiers,
          custom_commission_tiers: useCustomTiers ? customTiers : [],
        },
      }).unwrap();
      toast.success("Commission settings updated");
      setShowCommissionForm(false);
    } catch (err: any) {
      toast.error(err?.data?.error || "Failed to update commission settings");
    }
  };

  const handleAction = async () => {
    if (!action) return;
    try {
      if (action.type === "inactive") {
        await updateMarketer({ id: Number(id), marketer: { status: "inactive" }, reason: selectedReason }).unwrap();
        toast.success("Marketer deactivated. Email notification sent.");
      } else if (action.type === "active") {
        await updateMarketer({ id: Number(id), marketer: { status: "active" }, reason: selectedReason }).unwrap();
        toast.success("Marketer activated. Email notification sent.");
      } else if (action.type === "verify_bank") {
        await updateMarketer({ id: Number(id), marketer: { bank_verified: true } }).unwrap();
        toast.success("Bank account verified.");
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.error || "Failed to perform action");
    }
  };

  if (!can("marketers", "view")) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view marketers.</p>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 flex justify-center py-20"><Spinner /></div>;
  if (isError || !marketer) return (
    <div className="p-8 text-center py-20">
      <p className="text-red-500 font-semibold">Marketer not found</p>
      <Link href="/dashboard/marketers" className="text-sm text-primary mt-2 inline-block">← Back</Link>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id: "performance", label: "Performance", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "transactions", label: "Transactions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/marketers" className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{marketer.full_name}</h1>
            <p className="text-muted-foreground mt-1">Ref: <span className="font-mono font-bold text-primary">{marketer.referrer_code}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${marketer.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {marketer.status === "active" ? "Active" : "Inactive"}
          </span>
          {can("marketers", "manage") && (
            marketer.status === "inactive" ? (
              <button onClick={() => openAction("active", "Activate Marketer", "Activate & Notify", "green", ACT_REASONS)} disabled={isUpdating} className="px-4 py-2 rounded-full text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Activate</button>
            ) : (
              <button onClick={() => openAction("inactive", "Deactivate Marketer", "Deactivate & Notify", "red", DEACT_REASONS)} disabled={isUpdating} className="px-4 py-2 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Deactivate</button>
            )
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Salary Balance", value: formatCurrency(marketer.balance || 0), color: "bg-indigo-100 text-indigo-600" },
          { label: "Commission Balance", value: formatCurrency(marketer.commission_balance || 0), color: "bg-green-100 text-green-600" },
          { label: "Businesses Referred", value: marketer.businesses_referred || 0, color: "bg-blue-100 text-blue-600" },
          { label: "Joined", value: formatDate(marketer.created_at), color: "bg-orange-100 text-orange-600" },
        ].map((s, i) => (
          <div key={i} className="glass p-5 rounded-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">{s.label}</p>
            <p className="text-xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass rounded-3xl p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-slate-100 dark:hover:bg-zinc-800"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-3xl">
            <h3 className="text-xl font-bold mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full Name", value: marketer.full_name },
                { label: "Email", value: marketer.email },
                { label: "Phone", value: marketer.phone_number || "—" },
                { label: "Commission Rate", value: marketer.commission_rate ? `${marketer.commission_rate}%` : "—" },
                { label: "Status", value: marketer.status },
                { label: "Joined", value: formatDate(marketer.created_at) },
              ].map((f, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                  <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                  <p className="font-semibold text-sm">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Bank Account</h3>
              {can("marketers", "manage") && marketer.bank_name && !marketer.bank_verified && (
                <button onClick={() => openAction("verify_bank", "Verify Bank Account", "Verify Account", "green")} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  Verify Now
                </button>
              )}
              {marketer.bank_verified && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 border border-emerald-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  Verified
                </span>
              )}
            </div>
            {marketer.bank_name ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Bank Name", value: marketer.bank_name },
                  { label: "Account Name", value: marketer.account_name },
                  { label: "Account Number", value: marketer.account_number },
                  { label: "Bank Code", value: marketer.bank_code },
                ].map((f, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                    <p className="font-semibold font-mono text-sm">{f.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl text-sm">No bank account added yet.</div>
            )}
          </div>
        </div>

          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Commission Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Referral payout tiers (one-time on verification) and optional booking revenue share from verified businesses only.
                </p>
              </div>
              {!showCommissionForm && can("marketers", "manage") && (
                <button
                  onClick={openCommissionForm}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  Edit Commission
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-1">Booking commission rate</p>
                <p className="text-lg font-bold text-indigo-600">
                  {marketer.commission_rate ? `${marketer.commission_rate}%` : "0%"} of verified business booking revenue
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-1">Referral tier source</p>
                <p className="text-lg font-bold">
                  {marketer.use_custom_commission_tiers ? "Custom (negotiated)" : "Platform default"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active referral tiers</p>
              <div className="flex flex-wrap gap-2">
                {(marketer.use_custom_commission_tiers
                  ? marketer.custom_commission_tiers
                  : marketer.default_commission_tiers ?? DEFAULT_MARKETER_TIERS
                )?.map((tier: CommissionTier, i: number) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-semibold">
                    {tierLabel(tier)} → ₦{Number(tier.amount).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>

            {showCommissionForm && (
              <form onSubmit={handleSaveCommission} className="space-y-5 pt-2 border-t border-border">
                <div>
                  <label className="label">Booking commission rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="input"
                    placeholder="0 — no booking share"
                    value={commissionRateInput}
                    onChange={(e) => setCommissionRateInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentage of booking revenue from fully verified, non-suspended referred businesses.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomTiers}
                    onChange={(e) => setUseCustomTiers(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm font-semibold">Use custom referral tiers (override platform default)</span>
                </label>
                {useCustomTiers ? (
                  <MarketerCommissionTiersEditor tiers={customTiers} onChange={setCustomTiers} />
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl text-sm text-muted-foreground">
                    Platform default tiers apply. Enable custom tiers to negotiate different referral amounts per room band.
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCommissionForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                    {isUpdating ? "Saving…" : "Save Commission Settings"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {perfLoading ? (
            <div className="glass p-12 rounded-3xl text-center"><Spinner /></div>
          ) : perf ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Referrals", value: perf.total_referrals ?? 0, color: "bg-indigo-100 text-indigo-600" },
                  { label: "Verified Businesses", value: perf.verified_businesses ?? perf.active_businesses ?? 0, color: "bg-green-100 text-green-600" },
                  { label: "Referral Commission", value: formatCurrency(perf.referral_commission_earned ?? 0), color: "bg-amber-100 text-amber-600" },
                  { label: "Conversion Rate", value: `${perf.conversion_rate ?? 0}%`, color: "bg-rose-100 text-rose-600" },
                ].map((s, i) => (
                  <div key={i} className="glass p-5 rounded-3xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">{s.label}</p>
                    <p className="text-2xl font-black">{s.value}</p>
                  </div>
                ))}
              </div>

              {perf.growth_analysis?.length > 0 && (
                <div className="glass p-6 rounded-3xl">
                  <h3 className="text-xl font-bold mb-4">Referral Activity — Last 30 Days</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-border">
                          <th className="pb-3 font-medium text-muted-foreground">Date</th>
                          <th className="pb-3 font-medium text-muted-foreground">New Referrals</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {perf.growth_analysis.filter((d: any) => d.referrals > 0).length === 0 ? (
                          <tr><td colSpan={2} className="py-8 text-center text-muted-foreground">No referral activity in the last 30 days.</td></tr>
                        ) : (
                          perf.growth_analysis.filter((d: any) => d.referrals > 0).map((d: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="py-3 font-medium">{d.date}</td>
                              <td className="py-3">
                                <span className="inline-flex items-center gap-2">
                                  <span className="font-bold text-indigo-600">{d.referrals}</span>
                                  <div className="h-2 bg-indigo-100 rounded-full overflow-hidden" style={{ width: `${Math.min(d.referrals * 20, 120)}px` }}>
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "100%" }} />
                                  </div>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass p-12 rounded-3xl text-center text-muted-foreground">No performance data available.</div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="glass p-6 rounded-3xl">
          <div className="mb-5">
            <select className="input max-w-xs" value={txFilter} onChange={(e) => { setTxFilter(e.target.value); setTxPage(1); }}>
              <option value="all">All Transactions</option>
              <option value="salary">Salary</option>
              <option value="commission">Commission</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="bonus">Bonus</option>
            </select>
          </div>

          {txLoading ? (
            <div className="py-12 text-center"><Spinner /></div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p>No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border text-muted-foreground">
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Type</th>
                      <th className="pb-4 font-medium">Description</th>
                      <th className="pb-4 font-medium">Method</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((txn: any) => {
                      const isCredit = ["salary", "commission", "bonus"].includes(txn.transaction_type);
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-4">{formatDate(txn.created_at)}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 capitalize">{txn.transaction_type?.replace(/_/g, " ")}</span>
                          </td>
                          <td className="py-4 text-muted-foreground max-w-[200px] truncate">{txn.description || "—"}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 capitalize">{txn.payment_method || "—"}</span>
                          </td>
                          <td className="py-4">
                            <span className={`font-bold ${isCredit ? "text-green-600" : "text-red-600"}`}>
                              {isCredit ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${txn.status === "completed" ? "bg-green-100 text-green-600" : txn.status === "pending" ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"}`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {txMeta && txMeta.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">Page {txMeta.current_page} of {txMeta.total_pages} ({txMeta.total_count} total)</p>
                  <div className="flex gap-2">
                    <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txMeta.current_page === 1} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800">Previous</button>
                    <button onClick={() => setTxPage(p => Math.min(txMeta.total_pages, p + 1))} disabled={txMeta.current_page === txMeta.total_pages} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action Modal */}
      {showModal && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowModal(false); setSelectedReason(""); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold">{action.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {action.type === "inactive" && "The marketer will be notified via email."}
                {action.type === "active" && "The marketer will be notified via email."}
                {action.type === "verify_bank" && "This will allow the marketer to withdraw funds."}
              </p>
            </div>
            {action.reasons && (
              <div className="px-6 pt-5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Reason (Required)</label>
                <select className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 text-sm" value={selectedReason} onChange={e => setSelectedReason(e.target.value)}>
                  {action.reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {selectedReason && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
                    <p className="text-xs font-bold text-foreground mb-1">Email will say:</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedReason}</p>
                  </div>
                )}
              </div>
            )}
            <div className="p-6 flex gap-3">
              <button onClick={() => { setShowModal(false); setSelectedReason(""); }} className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:opacity-90">Cancel</button>
              <button
                onClick={handleAction}
                disabled={isUpdating || (!!action.reasons && action.type !== "verify_bank" && !selectedReason)}
                className={`flex-1 px-4 py-3 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 ${action.variant === "red" ? "bg-red-500" : "bg-green-600"}`}
              >
                {isUpdating ? "Processing..." : action.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
