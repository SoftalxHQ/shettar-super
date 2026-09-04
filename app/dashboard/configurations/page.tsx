"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAppSelector } from "@/lib/store/hooks";
import { selectToken } from "@/lib/store/slices/authSlice";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { toast } from "sonner";
import {
  MarketerCommissionTiersEditor,
  DEFAULT_MARKETER_TIERS,
  type CommissionTier,
} from "@/components/marketer-commission-tiers-editor";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

const DEFAULT_AD_SETTINGS = {
  default_cpm_rate: 500,
  default_cpc_rate: 50,
  max_sponsored_ratio: 0.25,
  min_campaign_budget: 1000,
  attribution_window_hours: 168,
  ads_system_enabled: true,
  paystack_fee_passthrough: true,
  auto_approve_verified_businesses: true,
};

type AdSettings = typeof DEFAULT_AD_SETTINGS;

type PlatformConfig = {
  withdrawal_commission_rate: number;
  withdrawal_flat_fee: number;
  minimum_withdrawal_amount: number;
  maximum_withdrawal_commission: number | null;
  cancellation_fee_percentage: number;
  business_cancellation_credit_percentage: number;
  marketer_commission_tiers: CommissionTier[];
  agency_commission_tiers: CommissionTier[];
  ai_monthly_free_points: number;
  ai_point_price_naira: number;
  ai_points_per_request: number;
  unverified_sales_block_after_days: number;
  ad_settings: AdSettings;
};

export default function ConfigurationPage() {
  const { admin } = useAuth();
  const token = useAppSelector(selectToken);
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };
  const canEdit = can("configurations", "edit");

  const [config, setConfig] = useState<PlatformConfig>({
    withdrawal_commission_rate: 0,
    withdrawal_flat_fee: 100,
    minimum_withdrawal_amount: 10000,
    maximum_withdrawal_commission: null,
    cancellation_fee_percentage: 10,
    business_cancellation_credit_percentage: 22.22,
    marketer_commission_tiers: DEFAULT_MARKETER_TIERS as CommissionTier[],
    agency_commission_tiers: DEFAULT_MARKETER_TIERS as CommissionTier[],
    ai_monthly_free_points: 5,
    ai_point_price_naira: 50,
    ai_points_per_request: 1,
    unverified_sales_block_after_days: 7,
    ad_settings: DEFAULT_AD_SETTINGS,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const normalizeCommissionTiers = (raw: unknown): CommissionTier[] => {
    const tiers = Array.isArray(raw) ? raw : DEFAULT_MARKETER_TIERS;
    return tiers.map((t) => {
      const tier = t as CommissionTier;
      return {
        min_rooms: tier.min_rooms ?? 0,
        max_rooms: tier.max_rooms ?? null,
        amount: Number(tier.amount) || 0,
      };
    });
  };

  const applyConfiguration = (data: Record<string, unknown>) => {
    const ad = (data.ad_settings as Record<string, unknown> | undefined) ?? {};
    setConfig({
      withdrawal_commission_rate:              Number(data.withdrawal_commission_rate ?? 0),
      withdrawal_flat_fee:                     Number(data.withdrawal_flat_fee ?? 100),
      minimum_withdrawal_amount:               Number(data.minimum_withdrawal_amount ?? 10000),
      maximum_withdrawal_commission:
        data.maximum_withdrawal_commission == null || data.maximum_withdrawal_commission === ""
          ? null
          : Number(data.maximum_withdrawal_commission),
      cancellation_fee_percentage:             Number(data.cancellation_fee_percentage ?? 10),
      business_cancellation_credit_percentage: Number(data.business_cancellation_credit_percentage ?? 22.22),
      marketer_commission_tiers: normalizeCommissionTiers(data.marketer_commission_tiers),
      agency_commission_tiers: normalizeCommissionTiers(data.agency_commission_tiers),
      ai_monthly_free_points: Number(data.ai_monthly_free_points ?? 5),
      ai_point_price_naira: Number(data.ai_point_price_naira ?? 50),
      ai_points_per_request: Number(data.ai_points_per_request ?? 1),
      unverified_sales_block_after_days: Math.max(
        1,
        Number(data.unverified_sales_block_after_days ?? 7) || 7
      ),
      ad_settings: {
        default_cpm_rate: Number(ad.default_cpm_rate ?? DEFAULT_AD_SETTINGS.default_cpm_rate),
        default_cpc_rate: Number(ad.default_cpc_rate ?? DEFAULT_AD_SETTINGS.default_cpc_rate),
        max_sponsored_ratio: Number(ad.max_sponsored_ratio ?? DEFAULT_AD_SETTINGS.max_sponsored_ratio),
        min_campaign_budget: Number(ad.min_campaign_budget ?? DEFAULT_AD_SETTINGS.min_campaign_budget),
        attribution_window_hours: Number(ad.attribution_window_hours ?? DEFAULT_AD_SETTINGS.attribution_window_hours),
        ads_system_enabled: ad.ads_system_enabled !== false,
        paystack_fee_passthrough: ad.paystack_fee_passthrough !== false,
        auto_approve_verified_businesses: ad.auto_approve_verified_businesses !== false,
      },
    });
  };

  const updateAdSettings = (patch: Partial<AdSettings>) => {
    if (!canEdit) return;
    setConfig((prev) => ({ ...prev, ad_settings: { ...prev.ad_settings, ...patch } }));
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/configurations`, {
          headers: { Authorization: `Bearer ${token}`, "X-Client-Platform": "web-super" },
        });
        if (res.ok) {
          applyConfiguration(await res.json());
        }
      } catch {
        // silent — use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [API_URL, token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/configurations`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Client-Platform": "web-super",
        },
        body: JSON.stringify({ configuration: config }),
      });
      if (res.ok) {
        const refresh = await fetch(`${API_URL}/api/v1/configurations`, {
          headers: { Authorization: `Bearer ${token}`, "X-Client-Platform": "web-super" },
        });
        if (refresh.ok) {
          applyConfiguration(await refresh.json());
        }
        toast.success("Configuration updated successfully");
      } else {
        toast.error("Failed to update configuration");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (!can("configurations", "view") && !can("configurations", "edit")) {
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

  if (loading) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">Platform Configuration</h1>
        <p className="text-sm text-slate-500 mt-2">Global financial parameters and transaction rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Withdrawal Commission */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Withdrawal Commission Rate</h3>
                  <p className="text-xs text-slate-500">Percentage deducted from each business withdrawal</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={config.withdrawal_commission_rate}
                  onChange={(e) => canEdit && setConfig({ ...config, withdrawal_commission_rate: parseFloat(e.target.value) || 0 })}
                  readOnly={!canEdit}
                  className="input pr-10 text-lg font-semibold tabular-nums rounded-xl border-slate-200 read-only:opacity-70 read-only:cursor-default"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
              </div>
              <p className="text-xs text-slate-500">
                This percentage is automatically deducted when a business initiates a withdrawal.
              </p>
            </div>

            {/* Withdrawal Flat Fee */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Withdrawal Flat Fee</h3>
                  <p className="text-xs text-slate-500">Fixed naira amount added to the commission on every withdrawal</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₦</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={config.withdrawal_flat_fee}
                  onChange={(e) => canEdit && setConfig({ ...config, withdrawal_flat_fee: parseFloat(e.target.value) || 0 })}
                  readOnly={!canEdit}
                  className="input pl-8 text-lg font-semibold tabular-nums rounded-xl border-slate-200 read-only:opacity-70 read-only:cursor-default"
                  placeholder="100"
                />
              </div>
              <p className="text-xs text-slate-500">
                Total commission = (rate% × amount) + flat fee. Default ₦100 covers Paystack&apos;s fixed transfer charge.
              </p>
            </div>

            {/* Maximum Withdrawal Commission */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Maximum Withdrawal Commission</h3>
                  <p className="text-xs text-slate-500">Naira ceiling on the platform percentage fee</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₦</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={config.maximum_withdrawal_commission ?? ""}
                  onChange={(e) => {
                    if (!canEdit) return;
                    const raw = e.target.value;
                    setConfig({
                      ...config,
                      maximum_withdrawal_commission: raw === "" ? null : Math.max(0, parseFloat(raw) || 0),
                    });
                  }}
                  readOnly={!canEdit}
                  className="input pl-8 text-lg font-semibold tabular-nums rounded-xl border-slate-200 read-only:opacity-70 read-only:cursor-default"
                  placeholder="No limit"
                />
              </div>
              <p className="text-xs text-slate-500">
                Caps the platform % fee on large withdrawals. Leave blank for no limit. Paystack transfer fee is not capped.
              </p>
            </div>

            {/* Minimum Withdrawal */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Minimum Withdrawal Amount</h3>
                  <p className="text-xs text-slate-500">Businesses cannot withdraw below this amount</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₦</span>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={config.minimum_withdrawal_amount}
                  onChange={(e) => canEdit && setConfig({ ...config, minimum_withdrawal_amount: parseFloat(e.target.value) || 0 })}
                  readOnly={!canEdit}
                  className="input pl-8 text-lg font-semibold tabular-nums rounded-xl border-slate-200 read-only:opacity-70 read-only:cursor-default"
                  placeholder="10000"
                />
              </div>
              <p className="text-xs text-slate-500">
                Prevents unprofitable micro-withdrawals where Paystack&apos;s flat fees exceed your commission.
              </p>
            </div>

            {/* Cancellation Fee */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Cancellation Fee</h3>
                  <p className="text-xs text-slate-500">Platform fee retained on reservation cancellations</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={config.cancellation_fee_percentage}
                  onChange={(e) => canEdit && setConfig({ ...config, cancellation_fee_percentage: parseFloat(e.target.value) || 0 })}
                  readOnly={!canEdit}
                  className="input pr-10 text-lg font-semibold tabular-nums rounded-xl border-slate-200 read-only:opacity-70 read-only:cursor-default"
                  placeholder="10.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
              </div>
              <p className="text-xs text-slate-500">
                The fixed percentage of the refundable amount the platform retains as a service fee on cancellation.
              </p>
              <p className="text-xs text-slate-500">
                This rate applies to businesses that do not have a per-business override set.
              </p>
            </div>

            {/* Marketer referral commission tiers */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Marketer Referral Commission</h3>
                  <p className="text-xs text-slate-500">One-time flat payout when a referred business is fully verified, based on room count</p>
                </div>
              </div>
              <MarketerCommissionTiersEditor
                tiers={config.marketer_commission_tiers}
                onChange={(tiers) => canEdit && setConfig({ ...config, marketer_commission_tiers: tiers })}
                readOnly={!canEdit}
              />
              <p className="text-xs text-slate-500">
                Marketers only earn after the business is fully verified. Per-marketer custom tiers can override these defaults.
              </p>
            </div>

            {/* Agency referral commission tiers */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Agency Referral Commission</h3>
                  <p className="text-xs text-slate-500">One-time payout to agency pool when a team member&apos;s referred business is verified</p>
                </div>
              </div>
              <MarketerCommissionTiersEditor
                tiers={config.agency_commission_tiers}
                onChange={(tiers) => canEdit && setConfig({ ...config, agency_commission_tiers: tiers })}
                readOnly={!canEdit}
              />
            </div>

            {/* Business Cancellation Credit */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Business Cancellation Credit</h3>
                  <p className="text-xs text-slate-500">Percentage of the refundable amount credited to the business when a guest cancels</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={config.business_cancellation_credit_percentage}
                  onChange={(e) => canEdit && setConfig({ ...config, business_cancellation_credit_percentage: parseFloat(e.target.value) || 0 })}
                  readOnly={!canEdit}
                  className="input pr-10 text-lg font-semibold tabular-nums rounded-xl border-slate-200 read-only:opacity-70 read-only:cursor-default"
                  placeholder="22.22"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
              </div>
              <p className="text-xs text-slate-500">
                When a guest cancels, the refundable amount (after the platform fee) is split between the guest and the business. This sets the business&apos;s share. The remainder goes to the guest&apos;s wallet.
              </p>
              <p className="text-xs text-slate-500">
                Default is 22.22% (2/9 of the refundable amount). The guest receives the remaining {(100 - config.business_cancellation_credit_percentage).toFixed(2)}%.
              </p>
            </div>

            {/* Business verification */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div>
                <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Business verification</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unverified businesses stay active but cannot take new walk-in, POS, cash, transfer, or restaurant sales after this many days from signup. Approval clears the block immediately. Suspended businesses cannot process sales regardless of verification.
                </p>
              </div>
              <label className="space-y-1 text-sm">
                <span className="text-slate-500">Block unverified sales after (days)</span>
                <input
                  type="number"
                  min={1}
                  className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                  value={config.unverified_sales_block_after_days}
                  onChange={(e) =>
                    canEdit &&
                    setConfig({
                      ...config,
                      unverified_sales_block_after_days: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  readOnly={!canEdit}
                />
              </label>
            </div>

            {/* Business AI Analyzer points */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div>
                <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Business AI Analyzer</h3>
                <p className="text-xs text-slate-500 mt-1">
                  One-time welcome free points for new business registrations. Businesses buy more after free points are used. Spend free points first.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="text-slate-500">Welcome free points (one-time)</span>
                  <input
                    type="number"
                    min={0}
                    className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                    value={config.ai_monthly_free_points}
                    onChange={(e) => canEdit && setConfig({ ...config, ai_monthly_free_points: parseInt(e.target.value, 10) || 0 })}
                    readOnly={!canEdit}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-slate-500">Price per point (₦)</span>
                  <input
                    type="number"
                    min={1}
                    className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                    value={config.ai_point_price_naira}
                    onChange={(e) => canEdit && setConfig({ ...config, ai_point_price_naira: parseInt(e.target.value, 10) || 0 })}
                    readOnly={!canEdit}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-slate-500">Points per analyzer request</span>
                  <input
                    type="number"
                    min={1}
                    className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                    value={config.ai_points_per_request}
                    onChange={(e) => canEdit && setConfig({ ...config, ai_points_per_request: parseInt(e.target.value, 10) || 1 })}
                    readOnly={!canEdit}
                  />
                </label>
              </div>
            </div>

            {/* Sponsored ads platform settings */}
            <div className={`${panelClass} p-5 space-y-4`}>
              <div>
                <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Sponsored ads</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Businesses can pay to promote listings in search and on the homepage. These defaults apply when a campaign does not set its own bid or budget rules.
                </p>
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={config.ad_settings.ads_system_enabled}
                  disabled={!canEdit}
                  onChange={(e) => updateAdSettings({ ads_system_enabled: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>
                  <span className="font-semibold">Ads system enabled</span>
                  <span className="block text-xs text-slate-500">When off, search/homepage fall back to organic listings only (no sponsored placements).</span>
                </span>
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="text-slate-500">Default CPM (₦ / 1,000 impressions)</span>
                  <input
                    type="number"
                    className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                    value={config.ad_settings.default_cpm_rate}
                    onChange={(e) => updateAdSettings({ default_cpm_rate: parseFloat(e.target.value) || 0 })}
                    readOnly={!canEdit}
                  />
                  <span className="text-xs text-slate-500 block">Charged per impression when a campaign uses CPM billing and has no custom max bid.</span>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-slate-500">Default CPC (₦ / click)</span>
                  <input
                    type="number"
                    className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                    value={config.ad_settings.default_cpc_rate}
                    onChange={(e) => updateAdSettings({ default_cpc_rate: parseFloat(e.target.value) || 0 })}
                    readOnly={!canEdit}
                  />
                  <span className="text-xs text-slate-500 block">Charged per ad click when a campaign uses CPC billing and has no custom max bid.</span>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-slate-500">Min campaign budget (₦)</span>
                  <input
                    type="number"
                    className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                    value={config.ad_settings.min_campaign_budget}
                    onChange={(e) => updateAdSettings({ min_campaign_budget: parseFloat(e.target.value) || 0 })}
                    readOnly={!canEdit}
                  />
                  <span className="text-xs text-slate-500 block">Minimum total budget a business must set when creating a paid campaign.</span>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-slate-500">Max sponsored ratio in search</span>
                  <input
                    type="number"
                    step="0.01"
                    max="1"
                    className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                    value={config.ad_settings.max_sponsored_ratio}
                    onChange={(e) => updateAdSettings({ max_sponsored_ratio: parseFloat(e.target.value) || 0 })}
                    readOnly={!canEdit}
                  />
                  <span className="text-xs text-slate-500 block">Cap on sponsored slots vs organic results (0.25 = up to 25% of a search page can be ads).</span>
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-slate-500">Attribution window (hours)</span>
                  <input
                    type="number"
                    className="input w-full rounded-xl border-slate-200 read-only:opacity-70"
                    value={config.ad_settings.attribution_window_hours}
                    onChange={(e) => updateAdSettings({ attribution_window_hours: parseInt(e.target.value, 10) || 168 })}
                    readOnly={!canEdit}
                  />
                  <span className="text-xs text-slate-500 block">How long after an ad click/view a booking can still be credited to that campaign (168h = 7 days).</span>
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={config.ad_settings.auto_approve_verified_businesses}
                  disabled={!canEdit}
                  onChange={(e) => updateAdSettings({ auto_approve_verified_businesses: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>
                  <span className="font-semibold">Auto-approve campaigns for verified businesses</span>
                  <span className="block text-xs text-slate-500">Verified businesses with ad wallet balance can launch repeat campaigns without manual review.</span>
                </span>
              </label>
            </div>

            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : "Save Configuration"}
              </button>
            )}
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Impact preview */}
          <div className={`${panelClass} p-5 space-y-4`}>
            <h4 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Impact Preview
            </h4>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-xs text-slate-500 mb-1">Est. Commission on ₦1M withdrawal</p>
                {(() => {
                  const sampleAmount = 1000000;
                  const uncappedPlatform = Math.round(sampleAmount * config.withdrawal_commission_rate / 100);
                  const maxCap = config.maximum_withdrawal_commission;
                  const platformFee =
                    maxCap != null ? Math.min(uncappedPlatform, maxCap) : uncappedPlatform;
                  const capped = maxCap != null && uncappedPlatform > maxCap;
                  const total = platformFee + config.withdrawal_flat_fee;
                  const net = sampleAmount - total;
                  return (
                    <>
                      <p className="text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums">
                        ₦{total.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {config.withdrawal_commission_rate}% (₦{platformFee.toLocaleString()}
                        {capped ? ` capped from ₦${uncappedPlatform.toLocaleString()}` : ""}
                        ) + ₦{config.withdrawal_flat_fee} flat fee
                      </p>
                      <p className="text-xs text-slate-500">
                        Business receives ₦{net.toLocaleString()}
                      </p>
                      {maxCap != null && (
                        <p className="text-xs text-indigo-600 mt-1">
                          Platform fee capped at ₦{maxCap.toLocaleString()}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-xs text-slate-500 mb-2">₦100K cancellation split</p>
                {(() => {
                  const total = 100000;
                  const platformFee = Math.round(total * config.cancellation_fee_percentage / 100);
                  const refundable = total - platformFee;
                  const businessCredit = Math.round(refundable * config.business_cancellation_credit_percentage / 100);
                  const guestRefund = refundable - businessCredit;
                  return (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Platform fee ({config.cancellation_fee_percentage}%)</span>
                        <span className="font-semibold text-rose-600 tabular-nums">₦{platformFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Business credit ({config.business_cancellation_credit_percentage}% of ₦{refundable.toLocaleString()})</span>
                        <span className="font-semibold text-blue-600 tabular-nums">₦{businessCredit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1.5">
                        <span className="text-slate-500">Guest refund</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">₦{guestRefund.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-semibold">Important</p>
            </div>
            <p className="text-xs text-amber-800">
              Changes take immediate effect on all new transactions. Existing pending withdrawals are not affected.
            </p>
          </div>

          {!canEdit && can("configurations", "view") && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-xs text-slate-500 text-center">You have read-only access to this section.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
