"use client";

import { useState } from "react";
import { 
  useGetMarketersQuery, 
  useCreateMarketerMutation,
  useUpdateMarketerMutation,
  type CreateMarketerPayload,
  type Marketer,
} from "@/lib/store/services/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { Pagination } from "@/components/ui/pagination";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

type MarketerFormState = {
  full_name: string;
  email: string;
  phone_number: string;
  account_type: "individual" | "agency";
  agency_name: string;
};

type ApiErrorBody = {
  errors?: string[];
  message?: string;
  error?: string;
};

function mutationErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "data" in err) {
    const data = (err as { data?: ApiErrorBody }).data;
    if (data?.errors?.length) return data.errors.join(", ");
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }
  return fallback;
}

function buildCreatePayload(form: MarketerFormState): CreateMarketerPayload {
  return {
    full_name: form.full_name,
    email: form.email,
    phone_number: form.phone_number || undefined,
    account_type: form.account_type,
    ...(form.account_type === "agency" ? { agency_name: form.agency_name } : {}),
  };
}

function buildUpdatePayload(
  form: MarketerFormState,
  marketer: Marketer
): Partial<Marketer> {
  const payload: Partial<Marketer> = {
    full_name: form.full_name,
    phone_number: form.phone_number || null,
  };

  if (marketer.account_type === "individual") {
    payload.account_type = form.account_type;
    payload.agency_name = form.account_type === "agency" ? form.agency_name : null;
  } else if (marketer.account_type === "agency") {
    payload.agency_name = form.agency_name;
  }

  return payload;
}

export default function MarketersPage() {
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetMarketersQuery({ page }, { skip: !can("marketers", "view") });
  const [createMarketer, { isLoading: isCreating }] = useCreateMarketerMutation();
  const [updateMarketer, { isLoading: isUpdating }] = useUpdateMarketerMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarketer, setEditingMarketer] = useState<Marketer | null>(null);
  
  const [form, setForm] = useState<MarketerFormState>({ 
    full_name: "", 
    email: "", 
    phone_number: "",
    account_type: "individual" as "individual" | "agency",
    agency_name: "",
  });

  const marketers = data?.marketers || [];
  const meta = data?.meta;
  const portalUrl = (process.env.NEXT_PUBLIC_MARKETER_PORTAL_URL || "http://localhost:3005").replace(/\/$/, "");

  const accountTypeLabel = (type?: string) => {
    if (type === "agency") return "Agency";
    if (type === "agency_member") return "Agency Member";
    return "Individual";
  };

  const accountTypeBadgeClass = (type?: string) => {
    if (type === "agency") return "bg-violet-50 text-violet-700";
    if (type === "agency_member") return "bg-slate-100 text-slate-600";
    return "bg-indigo-50 text-indigo-600";
  };

  const handleOpenModal = (marketer: Marketer | null = null) => {
    if (marketer) {
      setEditingMarketer(marketer);
      setForm({
        full_name: marketer.full_name,
        email: marketer.email,
        phone_number: marketer.phone_number || "",
        account_type: marketer.account_type === "agency" ? "agency" : "individual",
        agency_name: marketer.agency_name || "",
      });
    } else {
      setEditingMarketer(null);
      setForm({
        full_name: "",
        email: "",
        phone_number: "",
        account_type: "individual",
        agency_name: "",
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
        await updateMarketer({
          id: editingMarketer.id,
          marketer: buildUpdatePayload(form, editingMarketer),
        }).unwrap();
        toast.success("Marketer updated successfully");
      } else {
        await createMarketer(buildCreatePayload(form)).unwrap();
        toast.success("Marketer invited! An email with their login credentials has been sent.");
      }
      handleCloseModal();
    } catch (err: unknown) {
      toast.error(mutationErrorMessage(err, "Failed to save marketer"));
    }
  };

  const toggleStatus = async (marketer: Marketer) => {
    const newStatus = marketer.status === "active" ? "inactive" : "active";
    try {
      await updateMarketer({ id: marketer.id, marketer: { status: newStatus } }).unwrap();
      toast.success(`Marketer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch {
      toast.error("Failed to update status");
    }
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

  return (
    <div className="dash-page space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
            Marketers
          </h1>
          <p className="text-sm text-slate-500 mt-2">Manage platform affiliates and track their referral performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex px-3.5 py-2 rounded-xl border border-slate-200 bg-white items-center gap-2 text-sm">
            <span className="font-medium text-slate-500">Portal:</span>
            <a href={portalUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold hover:text-indigo-700 truncate max-w-[150px]">
              {portalUrl.replace(/^https?:\/\//, '')}
            </a>
          </div>
          {can("marketers", "manage") && (
          <button 
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Marketer
          </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Marketers", value: meta?.total_count ?? marketers.length, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
          { label: "Active", value: marketers.filter(m => m.status === 'active').length, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Referrals (MTD)", value: "—", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          { label: "Payouts Pending", value: "—", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((stat) => (
          <div key={stat.label} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 pt-0.5">
                {stat.label}
              </p>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {isLoading && !data ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        {(isLoading && !data) || isFetching ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-4">Loading marketers…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Marketer</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Account Type</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ref Code</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Joined</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marketers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/marketers/${m.id}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                          {(m.full_name?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{m.full_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{m.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2 py-0.5 rounded-md text-[11px] font-semibold ${accountTypeBadgeClass(m.account_type)}`}>
                          {accountTypeLabel(m.account_type)}
                        </span>
                        {m.account_type === "agency" && m.agency_name && (
                          <span className="text-xs text-slate-500">{m.agency_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold bg-slate-50 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                        {m.referrer_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                        m.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {can("marketers", "manage") && (
                          <button
                            onClick={() => handleOpenModal(m)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <Link 
                          href={`/dashboard/marketers/${m.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-[13px] font-semibold"
                        >
                          View
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {marketers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                      No marketers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && (
        <Pagination
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          totalCount={meta.total_count}
          onPageChange={setPage}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">
                  {editingMarketer ? "Edit Marketer" : "Invite Marketer"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {editingMarketer ? "Update affiliate details." : "Create a new affiliate account."}
                </p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Full Name</label>
                <input 
                  className="input" 
                  placeholder="John Doe" 
                  value={form.full_name} 
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Email Address</label>
                <input 
                  className="input disabled:opacity-50" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  disabled={!!editingMarketer}
                  required 
                />
                {editingMarketer && <p className="text-[11px] text-slate-500">Email cannot be changed after creation.</p>}
              </div>

              {!editingMarketer && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Account Type</label>
                    <select
                      className="input"
                      value={form.account_type}
                      onChange={(e) => setForm({ ...form, account_type: e.target.value as "individual" | "agency", agency_name: e.target.value === "agency" ? form.agency_name : "" })}
                    >
                      <option value="individual">Individual Marketer</option>
                      <option value="agency">Agency</option>
                    </select>
                  </div>
                  {form.account_type === "agency" && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Agency Name</label>
                      <input
                        className="input"
                        placeholder="Acme Marketing Ltd"
                        value={form.agency_name}
                        onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {editingMarketer?.account_type === "individual" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Account Type</label>
                    <select
                      className="input"
                      value={form.account_type}
                      onChange={(e) => setForm({ ...form, account_type: e.target.value as "individual" | "agency", agency_name: e.target.value === "agency" ? form.agency_name : "" })}
                    >
                      <option value="individual">Individual Marketer</option>
                      <option value="agency">Agency</option>
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Switch to Agency to enable team management and a shared commission pool in the marketer portal.
                    </p>
                  </div>
                  {form.account_type === "agency" && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Agency Name</label>
                      <input
                        className="input"
                        placeholder="Acme Marketing Ltd"
                        value={form.agency_name}
                        onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {editingMarketer?.account_type === "agency" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Agency Name</label>
                  <input
                    className="input"
                    placeholder="Acme Marketing Ltd"
                    value={form.agency_name}
                    onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Phone Number</label>
                <input 
                  className="input" 
                  placeholder="+234..." 
                  value={form.phone_number} 
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })} 
                />
              </div>

              {!editingMarketer && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    A secure password will be automatically generated and sent to the marketer via email.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
      )}
    </div>
  );
}
