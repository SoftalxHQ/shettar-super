"use client";

import { useState } from "react";
import { 
  useGetMarketersQuery, 
  useCreateMarketerMutation,
  useUpdateMarketerMutation
} from "@/lib/store/services/api";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function MarketersPage() {
  const { data, isLoading } = useGetMarketersQuery();
  const [createMarketer, { isLoading: isCreating }] = useCreateMarketerMutation();
  const [updateMarketer, { isLoading: isUpdating }] = useUpdateMarketerMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarketer, setEditingMarketer] = useState<any>(null);
  
  const [form, setForm] = useState({ 
    full_name: "", 
    email: "", 
    phone_number: "", 
  });

  const marketers = data?.marketers || [];
  const portalUrl = (process.env.NEXT_PUBLIC_MARKETER_PORTAL_URL || "http://localhost:3005").replace(/\/$/, "");

  const handleOpenModal = (marketer: any = null) => {
    if (marketer) {
      setEditingMarketer(marketer);
      setForm({
        full_name: marketer.full_name,
        email: marketer.email,
        phone_number: marketer.phone_number || "",
      });
    } else {
      setEditingMarketer(null);
      setForm({
        full_name: "",
        email: "",
        phone_number: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMarketer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMarketer) {
        const payload = {
          full_name: form.full_name,
          phone_number: form.phone_number,
        };
        await updateMarketer({ id: editingMarketer.id, marketer: payload }).unwrap();
        toast.success("Marketer updated successfully");
      } else {
        await createMarketer(form).unwrap();
        toast.success("Marketer invited! An email with their login credentials has been sent.");
      }
      handleCloseModal();
    } catch (err: any) {
      toast.error(err?.data?.errors?.join?.(", ") || err?.data?.message || err?.data?.error || "Failed to save marketer");
    }
  };

  const toggleStatus = async (marketer: any) => {
    const newStatus = marketer.status === "active" ? "inactive" : "active";
    try {
      await updateMarketer({ id: marketer.id, marketer: { status: newStatus } }).unwrap();
      toast.success(`Marketer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Marketers</h1>
          <p className="text-muted-foreground mt-1">Manage platform affiliates and track their referral performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass hidden lg:flex px-4 py-2 rounded-xl items-center gap-2 text-sm border-primary/20">
            <span className="font-medium text-muted-foreground">Portal:</span>
            <a href={portalUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline truncate max-w-[150px]">
              {portalUrl.replace(/^https?:\/\//, '')}
            </a>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary px-6 py-3 shadow-lg shadow-primary/20"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Invite Marketer
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Marketers", value: marketers.length, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
          { label: "Active", value: marketers.filter(m => m.status === 'active').length, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600" },
          { label: "Referrals (MTD)", value: "—", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { label: "Payouts Pending", value: "—", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-blue-600" },
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
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Marketer</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Ref Code</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Status</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Joined</th>
                <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {marketers.map((m) => (
                <tr key={m.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="p-5">
                    <Link href={`/dashboard/marketers/${m.id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black">
                        {(m.full_name?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-base group-hover:text-primary transition-colors">{m.full_name}</span>
                        <span className="text-xs text-muted-foreground">{m.email}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="p-5">
                    <span className="font-mono font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded border border-border text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      {m.referrer_code}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                      m.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${m.status === 'active' ? "bg-green-500" : "bg-red-500"}`} />
                      {m.status}
                    </span>
                  </td>
                  <td className="p-5 text-muted-foreground font-medium">
                    {formatDate(m.created_at)}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(m)}
                        className={`p-2 rounded-lg transition-colors ${
                          m.status === 'active' 
                          ? 'text-red-600 hover:bg-red-50' 
                          : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={m.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {m.status === 'active' ? (
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
                        onClick={() => handleOpenModal(m)}
                        className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <Link 
                        href={`/dashboard/marketers/${m.id}`}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors inline-flex"
                        title="View Details"
                      >
                        <svg className="w-5 h-5 text-muted-foreground hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {marketers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="font-bold">No marketers found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">{editingMarketer ? "Edit Marketer" : "Invite Marketer"}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {editingMarketer ? "Update affiliate details." : "Create a new affiliate account."}
                  </p>
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
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input 
                    className="input" 
                    placeholder="John Doe" 
                    value={form.full_name} 
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input 
                    className="input disabled:opacity-50" 
                    type="email" 
                    placeholder="john@example.com" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    disabled={!!editingMarketer}
                    required 
                  />
                  {editingMarketer && <p className="text-[10px] text-muted-foreground">Email cannot be changed after creation.</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                  <input 
                    className="input" 
                    placeholder="+234..." 
                    value={form.phone_number} 
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })} 
                  />
                </div>

                {!editingMarketer && (
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-xs font-medium text-primary flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      A secure password will be automatically generated and sent to the marketer via email.
                    </p>
                  </div>
                )}

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
                    ) : editingMarketer ? "Update Marketer" : "Send Invitation"}
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
