"use client";

import { useState } from "react";
import { 
  useGetPromoCodesQuery, 
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation
} from "@/lib/store/services/api";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminPromosPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetPromoCodesQuery(
    { page },
    { refetchOnMountOrArgChange: true },
  );
  const [createPromoCode, { isLoading: isCreating }] = useCreatePromoCodeMutation();
  const [updatePromoCode, { isLoading: isUpdating }] = useUpdatePromoCodeMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "10",
    usage_limit: "",
    per_customer_limit: "",
    valid_from: "",
    valid_to: "",
    status: "active",
  });

  const promoCodes = data?.promo_codes || [];
  const meta = data?.meta;
  const stats = data?.stats;

  const usageCount = (p: { usage_count?: number }) => Number(p.usage_count ?? 0);
  const usageLimit = (p: { usage_limit?: number | null }) =>
    p.usage_limit != null && p.usage_limit > 0 ? Number(p.usage_limit) : null;

  // Helper to format date for input[type="date"]
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleOpenModal = (promo: any = null) => {
    if (promo) {
      setEditingPromo(promo);
      setForm({
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value.toString(),
        usage_limit: promo.usage_limit?.toString() || "",
        per_customer_limit: promo.per_customer_limit?.toString() || "",
        valid_from: formatDateForInput(promo.valid_from),
        valid_to: formatDateForInput(promo.valid_to),
        status: promo.status,
      });
    } else {
      setEditingPromo(null);
      setForm({
        code: "",
        discount_type: "percentage",
        discount_value: "10",
        usage_limit: "",
        per_customer_limit: "",
        valid_from: "",
        valid_to: "",
        status: "active",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        status: form.status,
      };
      
      if (form.usage_limit) payload.usage_limit = parseInt(form.usage_limit, 10);
      if (form.per_customer_limit) payload.per_customer_limit = parseInt(form.per_customer_limit, 10);
      if (form.valid_from) payload.valid_from = form.valid_from;
      if (form.valid_to) payload.valid_to = form.valid_to;
      
      if (editingPromo) {
        await updatePromoCode({ id: editingPromo.id, promo_code: payload }).unwrap();
        toast.success("Promo code updated successfully");
      } else {
        await createPromoCode(payload).unwrap();
        toast.success("Promo code created successfully");
      }
      
      handleCloseModal();
    } catch (err: any) {
      toast.error(err?.data?.errors?.join?.(", ") || err?.data?.message || err?.data?.error || "Failed to save promo code");
    }
  };

  const toggleStatus = async (promo: any) => {
    const newStatus = promo.status === "active" ? "inactive" : "active";
    try {
      await updatePromoCode({ id: promo.id, promo_code: { status: newStatus } }).unwrap();
      toast.success(`Promo code ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const getEffectiveStatus = (promo: any) => {
    if (promo.status === "inactive") return { label: "Inactive", color: "bg-red-100 text-red-700", dot: "bg-red-500" };
    
    const now = new Date();
    const start = promo.valid_from ? new Date(promo.valid_from) : null;
    const end = promo.valid_to ? new Date(promo.valid_to) : null;
    
    if (usageLimit(promo) && usageCount(promo) >= usageLimit(promo)!) {
      return { label: "Limit Reached", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" };
    }
    
    if (start && now < start) {
      return { label: "Scheduled", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    }
    
    if (end && now > end) {
      return { label: "Expired", color: "bg-slate-100 text-slate-700", dot: "bg-slate-500" };
    }
    
    return { label: "Active", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* Loading Overlay for Pagination */}
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[1px] z-[40] pointer-events-none transition-all flex items-center justify-center">
          <div className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-border">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Refreshing...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Platform Promos</h1>
          <p className="text-muted-foreground mt-1">Manage global discount codes and promotional campaigns across the platform.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary w-fit px-6 py-3 shadow-lg shadow-primary/20"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create Promo
          </span>
        </button>
      </div>

      {/* Stats Overview (all platform promos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Promos", value: stats?.total_count || 0, icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
          { label: "Active Codes", value: stats?.active_count || 0, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600" },
          { label: "Total Redemptions", value: stats?.total_redemptions || 0, icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", color: "text-blue-600" },
          { label: "Avg. Discount", value: stats ? `${Math.round(stats.avg_discount)}%` : "0%", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl group hover:scale-[1.02] transition-transform">
            <div className={`p-3 bg-primary/10 rounded-2xl inline-flex mb-4 ${stat.color || "text-primary"}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">{stat.label}</p>
            <p className="text-3xl font-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Full Width Table */}
      <div className="glass rounded-3xl overflow-hidden border-border/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-border">
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Promo Details</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Discount</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Validity</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Usage Metrics</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Effective Status</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {promoCodes.map((p) => {
                const status = getEffectiveStatus(p);
                const count = usageCount(p);
                const limit = usageLimit(p);
                const usagePercent = limit
                  ? Math.min(100, Math.round((count / limit) * 100))
                  : null;
                const progressWidth = limit ? usagePercent! : count > 0 ? 100 : 0;
                return (
                  <tr key={p.id} className="hover:bg-primary/[0.01] transition-colors group">
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-bold text-base bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 self-start group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                          {p.code}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Created {formatDate(p.created_at)}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="font-black text-lg">
                          {p.discount_type === "percentage" ? `${p.discount_value}%` : formatCurrency(p.discount_value)}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{p.discount_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1 text-xs">
                        {p.valid_from || p.valid_to ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase w-8">From:</span>
                              <span className="font-medium">{p.valid_from ? formatDate(p.valid_from) : "—"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase w-8">To:</span>
                              <span className="font-medium text-orange-600">{p.valid_to ? formatDate(p.valid_to) : "—"}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">No date limits</span>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1 min-w-[120px]">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground mb-1">
                          <span>{limit ? "Progress" : "Redemptions"}</span>
                          <span>{limit ? `${usagePercent}%` : `${count} used`}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-primary transition-all ${!limit && count > 0 ? "opacity-60" : ""}`}
                            style={{ width: `${progressWidth}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium mt-1">
                          {count} / <span className="text-muted-foreground">{limit ?? "∞"}</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleStatus(p)}
                          className={`p-2 rounded-lg transition-colors ${
                            p.status === 'active' 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={p.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {p.status === 'active' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button 
                          onClick={() => handleOpenModal(p)}
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <p className="font-bold uppercase tracking-widest text-xs">No active campaigns</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between glass px-6 py-4 rounded-3xl">
          <p className="text-sm text-muted-foreground font-medium">
            Page <span className="text-foreground">{meta.current_page}</span> of <span className="text-foreground">{meta.total_pages}</span> ({meta.total_count} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page === 1}
              className="px-5 py-2 rounded-xl border border-border text-sm font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
              disabled={meta.current_page === meta.total_pages}
              className="px-5 py-2 rounded-xl border border-border text-sm font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">{editingPromo ? "Edit Promo Code" : "Create New Promo"}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Configure the discount rules and limits.</p>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Promo Code</label>
                  <input 
                    className="input uppercase font-mono font-bold tracking-widest text-primary disabled:opacity-50" 
                    placeholder="E.G. RAMADAN2024" 
                    value={form.code} 
                    onChange={(e) => setForm({ ...form, code: e.target.value })} 
                    disabled={!!editingPromo}
                    required 
                  />
                  {editingPromo && <p className="text-[10px] text-muted-foreground">Promo code string cannot be changed after creation.</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                    <select className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount (₦)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Value</label>
                    <input 
                      className="input" 
                      type="number" 
                      placeholder="10" 
                      value={form.discount_value} 
                      onChange={(e) => setForm({ ...form, discount_value: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valid From</label>
                    <input 
                      className="input" 
                      type="date" 
                      value={form.valid_from} 
                      onChange={(e) => setForm({ ...form, valid_from: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valid To</label>
                    <input 
                      className="input" 
                      type="date" 
                      value={form.valid_to} 
                      onChange={(e) => setForm({ ...form, valid_to: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usage Limit</label>
                    <input 
                      className="input" 
                      type="number" 
                      placeholder="Unlimited" 
                      value={form.usage_limit} 
                      onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Per User Limit</label>
                    <input 
                      className="input" 
                      type="number" 
                      placeholder="1" 
                      value={form.per_customer_limit} 
                      onChange={(e) => setForm({ ...form, per_customer_limit: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-border font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isCreating || isUpdating}
                    className="flex-[2] btn-primary py-4 shadow-xl shadow-primary/30"
                  >
                    {isCreating || isUpdating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : editingPromo ? "Update Promo" : "Create Promo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
