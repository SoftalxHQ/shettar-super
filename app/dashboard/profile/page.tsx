"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function ProfilePage() {
  const { admin } = useAuth();

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
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {admin?.role || "Global Administrator"}
            </p>
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
              <Link href="/dashboard/configurations" className="text-xs text-primary font-bold hover:underline">Manage</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Account Activity Section */}
      <div className="glass p-8 rounded-[2.5rem] space-y-6">
        <h3 className="text-xl font-bold px-2">Administrative Logs</h3>
        <div className="divide-y divide-border/50">
          {[
            { action: "Platform Configuration Update", date: "Oct 24, 2024 - 09:24 AM", result: "Success" },
            { action: "Bulk Business Verification", date: "Oct 22, 2024 - 14:12 PM", result: "Success" },
            { action: "Admin Portal Sign-in", date: "Oct 20, 2024 - 11:45 AM", result: "IP: 192.168.1.1" },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between py-4 px-2 hover:bg-slate-50 dark:hover:bg-zinc-800/30 rounded-2xl transition-colors">
              <div>
                <p className="font-bold text-sm">{log.action}</p>
                <p className="text-xs text-muted-foreground">{log.date}</p>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">{log.result}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
