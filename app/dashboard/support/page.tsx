"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useGetSupportTicketsQuery,
  useGetSupportTicketStatsQuery,
  useUpdateSupportTicketStatusMutation,
  type SupportTicket,
} from "@/lib/store/services/api";
import AssignTicketDialog from "@/components/support/AssignTicketDialog";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

export default function SupportPage() {
  const adminId = useSelector((state: RootState) => state.auth.admin?.id);
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inFlightTicketId, setInFlightTicketId] = useState<number | null>(null);
  const [assignDialogTicket, setAssignDialogTicket] = useState<SupportTicket | null>(null);

  // Debounce search input by 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const { data, isLoading, isError, isFetching } = useGetSupportTicketsQuery({
    page,
    status: statusFilter,
    priority: priorityFilter,
    category: categoryFilter,
    search: search || undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useGetSupportTicketStatsQuery();

  const [updateStatus] = useUpdateSupportTicketStatusMutation();

  const tickets = data?.tickets ?? [];
  const meta = data?.meta;

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleResolveTicket = async (id: number) => {
    setInFlightTicketId(id);
    try {
      await updateStatus({ id, status: "resolved" }).unwrap();
      toast.success("Ticket resolved");
    } catch {
      toast.error("Failed to resolve ticket");
    } finally {
      setInFlightTicketId(null);
    }
  };

  const handleCloseTicket = async (id: number) => {
    setInFlightTicketId(id);
    try {
      await updateStatus({ id, status: "closed" }).unwrap();
      toast.success("Ticket closed");
    } catch {
      toast.error("Failed to close ticket");
    } finally {
      setInFlightTicketId(null);
    }
  };

  const dash = "—";

  return (
    <div className="dash-page space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">Support Tickets</h1>
        <p className="text-sm text-slate-500 mt-2">
          Manage and respond to support requests from businesses and users
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open Tickets", value: statsLoading ? dash : statsData?.open ?? dash, icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
          { label: "In Progress", value: statsLoading ? dash : statsData?.in_progress ?? dash, icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
          { label: "Resolved", value: statsLoading ? dash : statsData?.resolved ?? dash, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "High Priority", value: statsLoading ? dash : statsData?.high_priority ?? dash, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
        ].map((stat, i) => (
          <div key={i} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
            <p className="text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums mt-2.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className={`${panelClass} p-5 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
            <input
              type="text"
              className="input rounded-xl border-slate-200"
              placeholder="Ticket ID, subject, or user name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
            <select
              className="input rounded-xl border-slate-200"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Priority</label>
            <select
              className="input rounded-xl border-slate-200"
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Category</label>
            <select
              className="input rounded-xl border-slate-200"
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="business_verification">Business verification</option>
              <option value="bank_account_verification">Bank account verification</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
        {isError && (
          <div className={`xl:col-span-2 text-center py-12 text-red-600 ${panelClass} p-6`}>
            Failed to load tickets. Please try again.
          </div>
        )}

        {(isLoading || isFetching) && !isError && (
          <div className={`xl:col-span-2 text-center py-12 ${panelClass} p-6`}>
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-4">Loading tickets...</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && tickets.map((ticket: SupportTicket) => {
          const isInFlight = inFlightTicketId === ticket.id;
          return (
            <div key={ticket.id} className={`${panelClass} p-5 space-y-4`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">{ticket.ticket_id}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${ticket.priority === "high" ? "bg-red-50 text-red-600" :
                        ticket.priority === "medium" ? "bg-amber-50 text-amber-700" :
                          "bg-blue-50 text-blue-700"
                      }`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${ticket.status === "open" ? "bg-amber-50 text-amber-700" :
                        ticket.status === "in_progress" ? "bg-blue-50 text-blue-700" :
                          ticket.status === "closed" ? "bg-slate-100 text-slate-600" :
                          "bg-emerald-50 text-emerald-700"
                      }`}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                    {(ticket.category === "business_verification" || ticket.category === "bank_account_verification") && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700">
                        VERIFICATION
                      </span>
                    )}
                    {ticket.unread && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 uppercase tracking-[0.14em]">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        Unread
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{ticket.subject}</h3>
                  <p className="text-sm text-slate-500 mb-3">{ticket.description}</p>
                  <div className="flex items-center gap-6 text-xs text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-semibold">{ticket.user?.first_name} {ticket.user?.last_name}</span>
                    </div>
                    {ticket.business && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-semibold">{ticket.business.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    {ticket.assigned_to && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-indigo-600 font-medium">Assigned to: {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {ticket.status === "open" && can("support_tickets", "assign") && (
                    <button
                      onClick={() => setAssignDialogTicket(ticket)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold whitespace-nowrap"
                    >
                      Assign
                    </button>
                  )}
                  {ticket.status !== "resolved" && ticket.status !== "closed" && can("support_tickets", "update_status") && (
                    <button
                      onClick={() => handleResolveTicket(ticket.id)}
                      disabled={isInFlight}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold whitespace-nowrap disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}
                  {ticket.status !== "closed" && can("support_tickets", "update_status") && (
                    <button
                      onClick={() => handleCloseTicket(ticket.id)}
                      disabled={isInFlight}
                      className="px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold whitespace-nowrap disabled:opacity-50"
                    >
                      Close
                    </button>
                  )}
                  <Link
                    href={`/dashboard/support/${ticket.id}`}
                    className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold whitespace-nowrap text-center block"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {!isLoading && !isFetching && !isError && tickets.length === 0 && (
          <div className={`xl:col-span-2 ${panelClass} p-12 text-center`}>
            <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm text-slate-500 mt-4">No support tickets found matching your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className={`${panelClass} mt-6 px-5 py-4 flex items-center justify-between`}>
          <p className="text-sm text-slate-500">
            Page {meta.current_page} of {meta.total_pages} ({meta.total_count} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
              disabled={meta.current_page === meta.total_pages}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
      <AssignTicketDialog
        open={assignDialogTicket !== null}
        ticketId={assignDialogTicket?.id ?? ""}
        ticketLabel={assignDialogTicket?.subject}
        currentAdminId={adminId}
        onClose={() => setAssignDialogTicket(null)}
      />
    </div>
  );
}
