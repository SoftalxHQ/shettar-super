"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useGetSupportTicketsQuery,
  useGetSupportTicketStatsQuery,
  useAssignSupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
  type SupportTicket,
} from "@/lib/store/services/api";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";

export default function SupportPage() {
  const adminId = useSelector((state: RootState) => state.auth.admin?.id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inFlightTicketId, setInFlightTicketId] = useState<number | null>(null);

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
    search: search || undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useGetSupportTicketStatsQuery();

  const [assignTicket] = useAssignSupportTicketMutation();
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

  const handleAssignTicket = async (id: number) => {
    if (!adminId) return;
    setInFlightTicketId(id);
    try {
      await assignTicket({ id, admin_id: adminId }).unwrap();
      toast.success("Ticket assigned successfully");
    } catch {
      toast.error("Failed to assign ticket");
    } finally {
      setInFlightTicketId(null);
    }
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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">
          Manage and respond to support requests from businesses and users
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Open Tickets", value: statsLoading ? dash : statsData?.open ?? dash, icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", color: "text-orange-600" },
          { label: "In Progress", value: statsLoading ? dash : statsData?.in_progress ?? dash, icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "text-blue-600" },
          { label: "Resolved", value: statsLoading ? dash : statsData?.resolved ?? dash, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600" },
          { label: "High Priority", value: statsLoading ? dash : statsData?.high_priority ?? dash, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-red-600" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 bg-primary/10 rounded-2xl ${stat.color}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="glass p-6 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="label">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Ticket ID, subject, or user name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="label">Status</label>
            <select
              className="input"
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
            <label className="label">Priority</label>
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
        {isError && (
          <div className="xl:col-span-2 text-center py-12 text-red-500 glass p-6 rounded-3xl">
            Failed to load tickets. Please try again.
          </div>
        )}

        {(isLoading || isFetching) && !isError && (
          <div className="xl:col-span-2 text-center py-12 glass p-6 rounded-3xl">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">Loading tickets...</p>
          </div>
        )}

        {!isLoading && !isFetching && !isError && tickets.map((ticket: SupportTicket) => {
          const isInFlight = inFlightTicketId === ticket.id;
          return (
            <div key={ticket.id} className="glass p-6 rounded-3xl hover:shadow-xl transition-shadow space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono font-bold text-muted-foreground">{ticket.ticket_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ticket.priority === "high" ? "bg-red-100 text-red-600" :
                        ticket.priority === "medium" ? "bg-orange-100 text-orange-600" :
                          "bg-blue-100 text-blue-600"
                      }`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ticket.status === "open" ? "bg-orange-100 text-orange-600" :
                        ticket.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                          ticket.status === "closed" ? "bg-gray-100 text-gray-600" :
                          "bg-green-100 text-green-600"
                      }`}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{ticket.subject}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
                  <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
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
                        <span className="text-primary font-medium">Assigned to: {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {ticket.status !== "resolved" && ticket.status !== "closed" && !ticket.assigned_to && (
                    <button
                      onClick={() => handleAssignTicket(ticket.id)}
                      disabled={isInFlight}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap disabled:opacity-50"
                    >
                      Assign to me
                    </button>
                  )}
                  {ticket.status !== "resolved" && ticket.status !== "closed" && (
                    <button
                      onClick={() => handleResolveTicket(ticket.id)}
                      disabled={isInFlight}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}
                  {ticket.status !== "closed" && (
                    <button
                      onClick={() => handleCloseTicket(ticket.id)}
                      disabled={isInFlight}
                      className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap disabled:opacity-50"
                    >
                      Close
                    </button>
                  )}
                  <Link
                    href={`/dashboard/support/${ticket.id}`}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap text-center block"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {!isLoading && !isFetching && !isError && tickets.length === 0 && (
          <div className="xl:col-span-2 glass p-12 rounded-3xl text-center">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-muted-foreground mt-4">No support tickets found matching your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.total_pages} ({meta.total_count} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page === 1}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
              disabled={meta.current_page === meta.total_pages}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
