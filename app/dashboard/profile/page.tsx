"use client";

import { useAuth } from "@/lib/auth-context";
import { ADMIN_PERMISSION_LABELS } from "@/lib/admin-staff-types";
import { useChangePasswordMutation, useGetAdminActivitiesQuery } from "@/lib/store/services/api";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { admin } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [changePassword, { isLoading: isSaving }] = useChangePasswordMutation();
  const { data: activitiesData, isLoading: isLoadingActivities } = useGetAdminActivitiesQuery({ page: 1 });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.current_password) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    try {
      const result = await changePassword(passwordData).unwrap();
      toast.success(result.status?.message || "Password updated successfully");
      setIsChangingPassword(false);
      setPasswordData({ current_password: "", password: "", password_confirmation: "" });
    } catch (error: unknown) {
      const e = error as { data?: { status?: { message?: string } }; status?: number };
      toast.error(e?.data?.status?.message || "Failed to update password");
    }
  };

  const roleLabel = admin?.admin_role === "super_admin" ? "Super Admin"
    : admin?.admin_role === "admin_staff" ? "Admin Staff"
    : "Administrator";

  const roleBadgeClass = admin?.admin_role === "super_admin"
    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl border-4 border-white dark:border-zinc-900 shadow-xl flex items-center justify-center overflow-hidden">
            {admin?.avatar_url ? (
              <img src={admin.avatar_url} alt={admin.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-primary">
                {admin?.first_name?.[0] || admin?.email?.[0]?.toUpperCase() || "A"}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight italic uppercase">
              {admin?.first_name} <span className="text-primary">{admin?.last_name}</span>
            </h1>
            <div className="text-muted-foreground font-medium flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleBadgeClass}`}>
                  {roleLabel}
                </span>
                {admin?.title && (
                  <span className="text-sm text-muted-foreground">{admin.title}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Link 
          href="/dashboard/profile/edit" 
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Profile
        </Link>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details */}
        <div className="glass p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Account Details</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Email Address</p>
              <p className="font-semibold">{admin?.email}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">System Identifier</p>
              <p className="font-mono text-sm font-semibold">{admin?.admin_unique_id ? `#ADM-${admin.admin_unique_id}` : `#ADM-${admin?.id?.toString().padStart(4, '0')}`}</p>
            </div>
          </div>
        </div>

        {/* Personal Profile */}
        <div className="glass p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Personal Profile</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Phone Number</p>
              <p className="font-semibold text-sm">{admin?.phone_number || "Not set"}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Gender</p>
              <p className="font-semibold text-sm capitalize">{admin?.gender || "Not set"}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50 col-span-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Primary Address</p>
              <p className="font-semibold text-sm">{admin?.address || "Not set"}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Zip Code</p>
              <p className="font-semibold text-sm">{admin?.zip_code || "N/A"}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Other Name</p>
              <p className="font-semibold text-sm">{admin?.other_name || "N/A"}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Date of Birth</p>
              <p className="font-semibold text-sm">{admin?.date_of_birth || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Security Summary */}
        <div className="glass p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Security Status</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <div>
                <p className="text-sm font-bold">Two-Factor Auth</p>
                <p className="text-xs text-muted-foreground">Extra layer of security</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <div>
                <p className="text-sm font-bold">Session Activity</p>
                <p className="text-xs text-muted-foreground">Last active: Just now</p>
              </div>
              {(admin?.admin_role === "super_admin" || !admin?.admin_role || admin?.permissions?.configurations?.view === true) && (
                <Link href="/dashboard/configurations" className="text-xs text-primary font-bold hover:underline">Manage</Link>
              )}
            </div>
          </div>
        </div>

        {/* Role & Permissions */}
        <div className="glass p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Role & Permissions</h3>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Role</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleBadgeClass}`}>{roleLabel}</span>
            </div>
            {admin?.title && (
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Title</p>
                <p className="font-semibold text-sm">{admin.title}</p>
              </div>
            )}
            {admin?.admin_role === "admin_staff" && admin?.permissions && (
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Permissions</p>
                <div className="space-y-2">
                  {Object.entries(ADMIN_PERMISSION_LABELS).map(([section, sectionData]) => {
                    const sectionPerms = (admin.permissions as Record<string, Record<string, boolean>>)?.[section] ?? {};
                    const enabledActions = Object.entries(sectionData.actions)
                      .filter(([action]) => sectionPerms[action] === true)
                      .map(([, label]) => label);
                    if (enabledActions.length === 0) return null;
                    return (
                      <div key={section} className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-muted-foreground w-28 shrink-0 pt-0.5">{sectionData.title}:</span>
                        <span className="text-xs text-foreground">{enabledActions.join(", ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {admin?.admin_role === "super_admin" && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Full access to all sections and actions</p>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="glass p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Change Password</h3>
            </div>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="text-sm font-bold text-primary hover:underline"
              >
                Start Update
              </button>
            )}
          </div>

          {isChangingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors"
                    placeholder="Enter existing password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.password_confirmation}
                    onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isSaving ? "Updating..." : "Confirm Update"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      current_password: "",
                      password: "",
                      password_confirmation: "",
                    });
                  }}
                  className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground pl-1">
              Regularly changing your password helps secure your account access from unauthorized users.
            </p>
          )}
        </div>
      </div>

      {/* Account Activity Section */}
      <div className="glass p-8 rounded-[2.5rem] space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold">Administrative Logs</h3>
          <Link href="/dashboard/activities" className="text-sm font-bold text-primary hover:underline">View All</Link>
        </div>

        <div className="divide-y divide-border/50">
          {isLoadingActivities ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Retrieving logs...</p>
            </div>
          ) : activitiesData?.activities && activitiesData.activities.length > 0 ? (
            activitiesData.activities.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-5 px-3 hover:bg-slate-50 dark:hover:bg-zinc-800/30 rounded-2xl transition-all group">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-2 h-10 rounded-full shrink-0" 
                    style={{ backgroundColor: log.color || "#6b7280" }}
                  />
                  <div>
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {new Date(log.occurred_at).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {log.actor && (
                        <>
                          <span className="w-1 h-1 bg-border rounded-full" />
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                            By {log.actor.name}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {log.action_type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto opacity-50">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No activity recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
