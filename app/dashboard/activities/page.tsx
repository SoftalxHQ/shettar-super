"use client";

import { useGetAdminActivitiesQuery } from "@/lib/store/services/api";
import { useState } from "react";
import Link from "next/link";

const ACTION_LABELS: Record<string, string> = {
  account_suspended: "Account Suspended",
  account_activated: "Account Activated",
  business_verified: "Business Verified",
  business_rejected: "Business Rejected",
  business_suspended: "Business Suspended",
  business_activated: "Business Activated",
  staff_invited: "Staff Invited",
  staff_updated: "Staff Permissions Updated",
  staff_deactivated: "Staff Deactivated",
  staff_reactivated: "Staff Reactivated",
  staff_removed: "Staff Removed",
  admin_signed_in: "Sign In",
  admin_signed_out: "Sign Out",
  profile_updated: "Profile Updated",
  password_changed: "Password Changed",
  ticket_replied: "Ticket Replying",
  ticket_assigned: "Ticket Assigned",
  ticket_status_updated: "Ticket Status Changed",
  bank_account_verified: "Bank Account Verified",
  configuration_updated: "Configuration Updated",
};

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  
  const { data, isLoading } = useGetAdminActivitiesQuery({ 
    page, 
    action_type: actionFilter === "all" ? "" : actionFilter 
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight italic uppercase">
            Platform <span className="text-primary">Audit Logs</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Comprehensive record of all administrative actions</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-white dark:bg-zinc-900 border border-border rounded-xl px-4 py-2 outline-none focus:border-primary/50 text-sm font-bold shadow-sm"
          >
            <option value="all">All Actions</option>
            <optgroup label="Authentication">
              <option value="admin_signed_in">Sign Ins</option>
              <option value="admin_signed_out">Sign Outs</option>
              <option value="password_changed">Password Changes</option>
            </optgroup>
            <optgroup label="Entities">
              <option value="business_verified">Business Verification</option>
              <option value="bank_account_verified">Bank Account Verification</option>
              <option value="account_suspended">Account Suspension</option>
            </optgroup>
            <optgroup label="System">
              <option value="configuration_updated">Configuration Updates</option>
              <option value="staff_invited">Staff Invitations</option>
              <option value="staff_deactivated">Staff Deactivation</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-800/30 border-b border-border/50">
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground w-48">Occurred At</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action & Description</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actor</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground w-32">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-6"><div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-6 py-6"><div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-full mb-2"></div><div className="h-3 bg-slate-100 dark:bg-zinc-900 rounded w-1/2"></div></td>
                    <td className="px-6 py-6"><div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-20"></div></td>
                    <td className="px-6 py-6 text-right"><div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded-full w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : data?.activities && data.activities.length > 0 ? (
                data.activities.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-6 align-top">
                      <p className="text-sm font-bold whitespace-nowrap">
                        {new Date(log.occurred_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                        {new Date(log.occurred_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-6 align-top">
                      <p className="text-sm font-black text-foreground mb-1 group-hover:text-primary transition-colors">
                        {ACTION_LABELS[log.action_type] || log.action_type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium max-w-md">{log.description}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(log.metadata).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-[9px] font-bold rounded uppercase tracking-tighter text-muted-foreground border border-border/50">
                              {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6 align-top">
                      {log.actor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm">
                            {log.actor.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{log.actor.name}</p>
                            <p className="text-[10px] font-medium text-muted-foreground">{log.actor.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground italic">System</span>
                      )}
                    </td>
                    <td className="px-6 py-6 align-top text-right">
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                        style={{ backgroundColor: log.color || "#6b7280" }}
                      >
                        {log.action_type.split('_')[0] === 'account' || log.action_type.split('_')[0] === 'business' ? 'Record' : 'Action'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No matching activities found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.last > 1 && (
          <div className="px-8 py-5 border-t border-border/30 bg-slate-50/30 dark:bg-zinc-800/10 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Page {data.pagination.page} of {data.pagination.last}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 transition-all border border-transparent hover:border-border"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={() => setPage(prev => Math.min(data.pagination.last, prev + 1))}
                disabled={page === data.pagination.last}
                className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 transition-all border border-transparent hover:border-border"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
