"use client";

import { useState, useEffect } from "react";

export default function ConfigurationPage() {
  const [config, setConfig] = useState({
    withdrawal_commission_rate: 0,
    cancellation_fee_percentage: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // In a real app, this would fetch from the API
    // fetch("/api/v1/configurations")
    setTimeout(() => {
      setConfig({
        withdrawal_commission_rate: 2.5,
        cancellation_fee_percentage: 10.0,
      });
      setLoading(false);
    }, 800);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: "success", text: "Global configurations updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            System Settings
          </div>
          <h1 className="text-4xl font-black tracking-tight">Platform Configuration</h1>
          <p className="text-muted-foreground text-lg mt-1">Global financial parameters and transaction rules for Shettar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden relative">
            {/* Background decorative blob */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
            
            <form onSubmit={handleSave} className="relative space-y-10">
              <div className="space-y-8">
                {/* Withdrawal Commission Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Withdrawal Settings</h3>
                      <p className="text-xs text-muted-foreground">Define commission rates for business fund withdrawals.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground/70 ml-1">Commission Rate (%)</label>
                    <div className="relative group">
                      <input
                        type="number"
                        step="0.01"
                        value={config.withdrawal_commission_rate}
                        onChange={(e) => setConfig({ ...config, withdrawal_commission_rate: parseFloat(e.target.value) })}
                        className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border border-border rounded-3xl p-5 pl-7 text-xl font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none group-hover:bg-white dark:group-hover:bg-zinc-800"
                        placeholder="0.00"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground/30">%</div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-1">
                      This percentage will be automatically deducted from the total amount requested by a business during withdrawal.
                    </p>
                  </div>
                </div>

                {/* Cancellation Fee Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Cancellation Rules</h3>
                      <p className="text-xs text-muted-foreground">Manage platform fees for reservation cancellations.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground/70 ml-1">Platform Cancellation Fee (%)</label>
                    <div className="relative group">
                      <input
                        type="number"
                        step="0.01"
                        value={config.cancellation_fee_percentage}
                        onChange={(e) => setConfig({ ...config, cancellation_fee_percentage: parseFloat(e.target.value) })}
                        className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border border-border rounded-3xl p-5 pl-7 text-xl font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none group-hover:bg-white dark:group-hover:bg-zinc-800"
                        placeholder="10.00"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground/30">%</div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-1">
                      The fixed percentage of the refundable amount that the platform retains as a service fee upon cancellation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border flex items-center justify-between gap-4">
                <div className="flex-1">
                  {message.text && (
                    <div className={`flex items-center gap-2 p-3 rounded-2xl animate-in fade-in slide-in-from-left-2 ${
                      message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600"
                    }`}>
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-bold">{message.text}</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-10 py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:translate-y-[-2px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0"
                >
                  {saving ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Updating...
                    </div>
                  ) : "Update Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Analytics/Info */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-[2rem] border border-white/20 shadow-xl space-y-6 bg-gradient-to-br from-primary/5 to-transparent">
            <h4 className="font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Impact Analysis
            </h4>
            
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-border">
                <p className="text-muted-foreground mb-1 font-medium">Est. Monthly Commission</p>
                <p className="text-2xl font-black">₦{((12500000 * config.withdrawal_commission_rate) / 100).toLocaleString()}</p>
                <div className="mt-2 w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[45%]" />
                </div>
              </div>

              <div className="p-4 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-border">
                <p className="text-muted-foreground mb-1 font-medium">Est. Cancellation Revenue</p>
                <p className="text-2xl font-black">₦{((2800000 * config.cancellation_fee_percentage) / 100).toLocaleString()}</p>
                <div className="mt-2 w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[30%]" />
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground px-2 italic">
              * Calculations based on current month's transaction volume of ₦12.5M.
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] space-y-3">
            <div className="flex items-center gap-3 text-amber-600">
              <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="font-bold">Important Notice</h4>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-500/80 leading-relaxed">
              Updates to these configurations are <strong>permanent</strong> and take <strong>immediate effect</strong> on all new transactions. Existing pending withdrawals will not be affected. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
