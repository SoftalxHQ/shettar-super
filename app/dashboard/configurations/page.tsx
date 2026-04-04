"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAppSelector } from "@/lib/store/hooks";
import { selectToken } from "@/lib/store/slices/authSlice";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { toast } from "sonner";

export default function ConfigurationPage() {
  const { admin } = useAuth();
  const token = useAppSelector(selectToken);
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [config, setConfig] = useState({
    withdrawal_commission_rate: 0,
    cancellation_fee_percentage: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/configurations`, {
          headers: { Authorization: `Bearer ${token}`, "X-Client-Platform": "web-super" },
        });
        if (res.ok) {
          const data = await res.json();
          setConfig({
            withdrawal_commission_rate: data.withdrawal_commission_rate ?? 0,
            cancellation_fee_percentage: data.cancellation_fee_percentage ?? 10,
          });
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

  const canEdit = can("configurations", "edit");

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Platform Configuration</h1>
        <p className="text-muted-foreground mt-1">Global financial parameters and transaction rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Withdrawal Commission */}
            <div className="glass p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold">Withdrawal Commission Rate</h3>
                  <p className="text-xs text-muted-foreground">Percentage deducted from each business withdrawal</p>
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
                  className="input pr-10 text-lg font-bold read-only:opacity-70 read-only:cursor-default"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This percentage is automatically deducted when a business initiates a withdrawal.
              </p>
            </div>

            {/* Cancellation Fee */}
            <div className="glass p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold">Cancellation Fee</h3>
                  <p className="text-xs text-muted-foreground">Platform fee retained on reservation cancellations</p>
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
                  className="input pr-10 text-lg font-bold read-only:opacity-70 read-only:cursor-default"
                  placeholder="10.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The fixed percentage of the refundable amount the platform retains as a service fee on cancellation.
              </p>
              <p className="text-xs text-muted-foreground">
                This rate applies to businesses that do not have a per-business override set.
              </p>
            </div>

            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
          <div className="glass p-6 rounded-3xl space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Impact Preview
            </h4>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-1">Est. Commission on ₦1M withdrawal</p>
                <p className="text-xl font-bold text-emerald-600">
                  ₦{((1000000 * config.withdrawal_commission_rate) / 100).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Business receives ₦{((1000000 * (1 - config.withdrawal_commission_rate / 100))).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-1">Est. Fee on ₦100K cancellation</p>
                <p className="text-xl font-bold text-rose-600">
                  ₦{((100000 * config.cancellation_fee_percentage) / 100).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Guest refunded ₦{((100000 * (1 - config.cancellation_fee_percentage / 100))).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-orange-600">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-bold">Important</p>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-400">
              Changes take immediate effect on all new transactions. Existing pending withdrawals are not affected.
            </p>
          </div>

          {!canEdit && can("configurations", "view") && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
              <p className="text-xs text-muted-foreground text-center">You have read-only access to this section.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
