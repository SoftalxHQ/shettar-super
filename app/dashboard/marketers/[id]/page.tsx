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
import {
  useCreateAgencyMemberMutation,
  useAllocateAgencyFundsMutation,
} from "@/lib/store/services/marketer-agency-api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  MarketerCommissionTiersEditor,
  DEFAULT_MARKETER_TIERS,
  tierLabel,
  type CommissionTier,
} from "@/components/marketer-commission-tiers-editor";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

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
  return <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />;
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
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [memberForm, setMemberForm] = useState({ full_name: "", email: "", phone_number: "" });
  const [allocateForm, setAllocateForm] = useState({ member_id: "", amount: "", wallet_type: "commission_balance", notes: "" });

  const [updateMarketer, { isLoading: isUpdating }] = useUpdateMarketerMutation();
  const [createAgencyMember, { isLoading: isCreatingMember }] = useCreateAgencyMemberMutation();
  const [allocateAgencyFunds, { isLoading: isAllocating }] = useAllocateAgencyFundsMutation();
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAgencyMember({ agencyId: Number(id), member: memberForm }).unwrap();
      toast.success("Team member invited. Login credentials sent via email.");
      setShowAddMember(false);
      setMemberForm({ full_name: "", email: "", phone_number: "" });
    } catch (err: any) {
      toast.error(err?.data?.error || err?.data?.errors?.join?.(", ") || "Failed to add team member");
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(allocateForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!allocateForm.member_id) {
      toast.error("Select a team member");
      return;
    }
    try {
      await allocateAgencyFunds({
        agencyId: Number(id),
        member_id: Number(allocateForm.member_id),
        amount,
        wallet_type: allocateForm.wallet_type,
        notes: allocateForm.notes || undefined,
      }).unwrap();
      toast.success("Funds released to team member");
      setShowAllocate(false);
      setAllocateForm({ member_id: "", amount: "", wallet_type: "commission_balance", notes: "" });
    } catch (err: any) {
      toast.error(err?.data?.error || "Failed to release funds");
    }
  };

  const accountTypeLabel = (type?: string) => {
    if (type === "agency") return "Agency";
    if (type === "agency_member") return "Agency Member";
    return "Individual";
  };

  if (!can("marketers", "view")) {
    return (
      <div className="dash-page">
        <div className={`${panelClass} p-12 text-center`}>
          <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="font-display text-xl font-semibold mt-4 text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2">You don&apos;t have permission to view marketers.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-slate-500">Loading marketer...</p>
        </div>
      </div>
    );
  }

  if (isError || !marketer) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Marketer not found</p>
          <Link href="/dashboard/marketers" className="text-sm text-indigo-600 font-semibold mt-2 inline-block hover:text-indigo-700">
            ← Back to marketers
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id: "performance", label: "Performance", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    ...(marketer.account_type === "agency" ? [{ id: "team", label: "Team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" }] : []),
    { id: "transactions", label: "Transactions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  ];

  const kpiIcon = "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z";

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/marketers" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
              {marketer.full_name}
            </h1>
            <p className="text-sm text-slate-500 mt-2 flex flex-wrap items-center gap-2">
              <span>
                Ref: <span className="font-mono font-semibold text-slate-700">{marketer.referrer_code}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                marketer.account_type === "agency" ? "bg-violet-50 text-violet-700" :
                marketer.account_type === "agency_member" ? "bg-slate-100 text-slate-600" :
                "bg-indigo-50 text-indigo-600"
              }`}>
                {accountTypeLabel(marketer.account_type)}
              </span>
              {marketer.account_type === "agency" && marketer.agency_name && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700">{marketer.agency_name}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${marketer.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {marketer.status === "active" ? "Active" : "Inactive"}
          </span>
          {can("marketers", "manage") && (
            marketer.status === "inactive" ? (
              <button onClick={() => openAction("active", "Activate Marketer", "Activate & Notify", "green", ACT_REASONS)} disabled={isUpdating} className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors">Activate</button>
            ) : (
              <button onClick={() => openAction("inactive", "Deactivate Marketer", "Deactivate & Notify", "red", DEACT_REASONS)} disabled={isUpdating} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">Deactivate</button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Salary Balance", value: formatCurrency(marketer.balance || 0), icon: kpiIcon },
          { label: "Commission Balance", value: formatCurrency(marketer.commission_balance || 0), icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Businesses Referred", value: marketer.businesses_referred || 0, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          { label: "Joined", value: formatDate(marketer.created_at), icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
        ].map((s) => (
          <div key={s.label} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 pt-0.5">
                {s.label}
              </p>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={s.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div
        className="inline-flex flex-wrap gap-1 p-1 rounded-2xl border border-slate-200/90 bg-slate-100/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
        role="tablist"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold tracking-tight transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tab.icon} /></svg>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${panelClass} p-5`}>
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Full Name", value: marketer.full_name },
                  { label: "Email", value: marketer.email },
                  { label: "Phone", value: marketer.phone_number || "—" },
                  { label: "Account Type", value: accountTypeLabel(marketer.account_type) },
                  ...(marketer.account_type === "agency" ? [{ label: "Agency Name", value: marketer.agency_name || "—" }] : []),
                  ...(marketer.account_type === "agency_member" && marketer.agency ? [{
                    label: "Parent Agency",
                    value: (
                      <Link href={`/dashboard/marketers/${marketer.agency.id}`} className="text-indigo-600 hover:text-indigo-700 font-semibold">
                        {marketer.agency.name}
                      </Link>
                    ),
                  }] : []),
                  { label: "Commission Rate", value: marketer.commission_rate ? `${marketer.commission_rate}%` : "—" },
                  { label: "Status", value: marketer.status },
                  { label: "Joined", value: formatDate(marketer.created_at) },
                ].map((f, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">{f.label}</p>
                    <p className="font-semibold text-sm text-slate-900">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${panelClass} p-5`}>
              <div className="flex justify-between items-start mb-4 gap-3">
                <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Bank Account</h3>
                {can("marketers", "manage") && marketer.bank_name && !marketer.bank_verified && (
                  <button onClick={() => openAction("verify_bank", "Verify Bank Account", "Verify Account", "green")} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    Verify Now
                  </button>
                )}
                {marketer.bank_verified && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    Verified
                  </span>
                )}
              </div>
              {marketer.bank_name ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "Bank Name", value: marketer.bank_name },
                    { label: "Account Name", value: marketer.account_name },
                    { label: "Account Number", value: marketer.account_number },
                    { label: "Bank Code", value: marketer.bank_code },
                  ].map((f, i) => (
                    <div key={i} className="p-3.5 bg-slate-50 rounded-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">{f.label}</p>
                      <p className="font-semibold font-mono text-sm text-slate-900">{f.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl text-sm">No bank account added yet.</div>
              )}
            </div>
          </div>

          <div className={`${panelClass} p-5 space-y-4`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Commission Settings</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Referral payout tiers (one-time on verification) and optional booking revenue share from verified businesses only.
                </p>
              </div>
              {!showCommissionForm && can("marketers", "manage") && (
                <button
                  onClick={openCommissionForm}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                >
                  Edit Commission
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">Booking commission rate</p>
                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                  {marketer.commission_rate ? `${marketer.commission_rate}%` : "0%"} of verified business booking revenue
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">Referral tier source</p>
                <p className="text-sm font-semibold text-slate-900">
                  {marketer.use_custom_commission_tiers ? "Custom (negotiated)" : "Platform default"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Active referral tiers</p>
              <div className="flex flex-wrap gap-2">
                {(marketer.use_custom_commission_tiers
                  ? marketer.custom_commission_tiers
                  : marketer.default_commission_tiers ?? DEFAULT_MARKETER_TIERS
                )?.map((tier: CommissionTier, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                    {tierLabel(tier)} → ₦{Number(tier.amount).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>

            {showCommissionForm && (
              <form onSubmit={handleSaveCommission} className="space-y-5 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Booking commission rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="input mt-1.5"
                    placeholder="0 — no booking share"
                    value={commissionRateInput}
                    onChange={(e) => setCommissionRateInput(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">Percentage of booking revenue from fully verified, non-suspended referred businesses.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomTiers}
                    onChange={(e) => setUseCustomTiers(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-800">Use custom referral tiers (override platform default)</span>
                </label>
                {useCustomTiers ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <MarketerCommissionTiersEditor tiers={customTiers} onChange={setCustomTiers} />
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-xl text-sm text-slate-500">
                    Platform default tiers apply. Enable custom tiers to negotiate different referral amounts per room band.
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCommissionForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                    {isUpdating ? "Saving…" : "Save Commission Settings"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === "performance" && (
        <div className="space-y-4">
          {perfLoading ? (
            <div className={`${panelClass} p-12 text-center`}><Spinner /></div>
          ) : perf ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total Referrals", value: perf.total_referrals ?? 0, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                  { label: "Verified Businesses", value: perf.verified_businesses ?? perf.active_businesses ?? 0, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                  { label: "Referral Commission", value: formatCurrency(perf.referral_commission_earned ?? 0), icon: kpiIcon },
                  { label: "Conversion Rate", value: `${perf.conversion_rate ?? 0}%`, icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
                ].map((s) => (
                  <div key={s.label} className={`${panelClass} px-5 py-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 pt-0.5">
                        {s.label}
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={s.icon} />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {perf.growth_analysis?.length > 0 && (
                <div className={`${panelClass} p-5 overflow-x-auto`}>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Referral Activity — Last 30 Days</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">New Referrals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {perf.growth_analysis.filter((d: any) => d.referrals > 0).length === 0 ? (
                        <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">No referral activity in the last 30 days.</td></tr>
                      ) : (
                        perf.growth_analysis.filter((d: any) => d.referrals > 0).map((d: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/90 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-900">{d.date}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-2">
                                <span className="font-semibold text-slate-900 tabular-nums">{d.referrals}</span>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden" style={{ width: `${Math.min(d.referrals * 20, 120)}px` }}>
                                  <div className="h-full bg-slate-400 rounded-full" style={{ width: "100%" }} />
                                </div>
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className={`${panelClass} p-12 text-center text-slate-500`}>No performance data available.</div>
          )}
        </div>
      )}

      {activeTab === "team" && marketer.account_type === "agency" && (
        <div className="space-y-4">
          {marketer.agency_summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Pool Balance", value: formatCurrency(marketer.agency_summary.commission_balance ?? 0), icon: kpiIcon },
                { label: "Team Members", value: marketer.agency_summary.team_members_count ?? 0, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
                { label: "Team Referrals", value: marketer.agency_summary.total_referrals ?? 0, icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
                { label: "Total Allocated", value: formatCurrency(marketer.agency_summary.total_allocated ?? 0), icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
              ].map((s) => (
                <div key={s.label} className={`${panelClass} px-5 py-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 pt-0.5">
                      {s.label}
                    </p>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={s.icon} />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className={`${panelClass} p-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Team Members</h3>
                <p className="text-sm text-slate-500 mt-1">Sub-marketers under this agency. Referral commissions pay into the agency pool.</p>
              </div>
              {can("marketers", "manage") && (
                <div className="flex gap-2">
                  <button onClick={() => setShowAllocate(true)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Release Funds
                  </button>
                  <button onClick={() => setShowAddMember(true)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                    Add Member
                  </button>
                </div>
              )}
            </div>

            {(marketer.agency_members ?? []).length === 0 ? (
              <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl text-sm">
                No team members yet. Add sub-marketers to start building the agency team.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Member</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ref Code</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Referrals</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Verified</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Commission Earned</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Wallets</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marketer.agency_members.map((member: any) => (
                      <tr key={member.id} className="hover:bg-slate-50/90">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900">{member.full_name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{member.referrer_code}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-900">{member.total_referrals ?? 0}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-900">{member.verified_businesses ?? 0}</td>
                        <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">{formatCurrency(member.referral_commission_earned ?? 0)}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <p>Salary: {formatCurrency(member.balance ?? 0)}</p>
                          <p>Commission: {formatCurrency(member.commission_balance ?? 0)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${member.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className={`${panelClass} p-5`}>
          <div className="mb-5">
            <select
              className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={txFilter}
              onChange={(e) => { setTxFilter(e.target.value); setTxPage(1); }}
            >
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
            <div className="py-12 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Type</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Description</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Method</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((txn: any) => {
                      const isCredit = ["salary", "commission", "bonus"].includes(txn.transaction_type);
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="px-4 py-3 text-slate-700">{formatDate(txn.created_at)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">{txn.transaction_type?.replace(/_/g, " ")}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{txn.description || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">{txn.payment_method || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold tabular-nums ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                              {isCredit ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${txn.status === "completed" ? "bg-emerald-50 text-emerald-700" : txn.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
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
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">Page {txMeta.current_page} of {txMeta.total_pages} ({txMeta.total_count} total)</p>
                  <div className="flex gap-2">
                    <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txMeta.current_page === 1} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50">Previous</button>
                    <button onClick={() => setTxPage(p => Math.min(txMeta.total_pages, p + 1))} disabled={txMeta.current_page === txMeta.total_pages} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddMember(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Add Team Member</h3>
              <p className="text-sm text-slate-500 mt-1">Create a sub-marketer under {marketer.agency_name || marketer.full_name}.</p>
            </div>
            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Full Name</label>
                <input className="input mt-1.5" value={memberForm.full_name} onChange={e => setMemberForm({ ...memberForm, full_name: e.target.value })} required />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
                <input className="input mt-1.5" type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Phone (optional)</label>
                <input className="input mt-1.5" value={memberForm.phone_number} onChange={e => setMemberForm({ ...memberForm, phone_number: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isCreatingMember} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {isCreatingMember ? "Creating…" : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAllocate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAllocate(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Release Funds</h3>
              <p className="text-sm text-slate-500 mt-1">
                Pool balance: {formatCurrency(marketer.commission_balance ?? 0)}
              </p>
            </div>
            <form onSubmit={handleAllocate} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Team Member</label>
                <select className="input mt-1.5" value={allocateForm.member_id} onChange={e => setAllocateForm({ ...allocateForm, member_id: e.target.value })} required>
                  <option value="">Select member…</option>
                  {(marketer.agency_members ?? []).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Amount (₦)</label>
                <input className="input mt-1.5" type="number" min="0" step="0.01" value={allocateForm.amount} onChange={e => setAllocateForm({ ...allocateForm, amount: e.target.value })} required />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Wallet</label>
                <select className="input mt-1.5" value={allocateForm.wallet_type} onChange={e => setAllocateForm({ ...allocateForm, wallet_type: e.target.value })}>
                  <option value="commission_balance">Commission wallet</option>
                  <option value="balance">Salary wallet</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Notes (optional)</label>
                <input className="input mt-1.5" value={allocateForm.notes} onChange={e => setAllocateForm({ ...allocateForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAllocate(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isAllocating} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {isAllocating ? "Processing…" : "Release Funds"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowModal(false); setSelectedReason(""); }}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">{action.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {action.type === "inactive" && "The marketer will be notified via email."}
                {action.type === "active" && "The marketer will be notified via email."}
                {action.type === "verify_bank" && "This will allow the marketer to withdraw funds."}
              </p>
            </div>
            {action.reasons && (
              <div className="px-5 pt-4">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 block mb-1.5">Reason (Required)</label>
                <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 text-sm" value={selectedReason} onChange={e => setSelectedReason(e.target.value)}>
                  {action.reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {selectedReason && (
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-xl">
                    <p className="text-xs font-semibold text-slate-800 mb-1">Email will say:</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{selectedReason}</p>
                  </div>
                )}
              </div>
            )}
            <div className="p-5 flex gap-3">
              <button onClick={() => { setShowModal(false); setSelectedReason(""); }} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleAction}
                disabled={isUpdating || (!!action.reasons && action.type !== "verify_bank" && !selectedReason)}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 ${action.variant === "red" ? "bg-red-600" : "bg-green-600"}`}
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
