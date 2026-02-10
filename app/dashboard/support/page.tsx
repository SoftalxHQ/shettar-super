"use client";

import { useState } from "react";

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - will be replaced with API calls
  const tickets = [
    {
      id: 1,
      ticket_id: "#SUP-1284",
      business: "Grand Royale Hotel",
      business_id: "GRHBLH8A9C",
      subject: "Payout delay issue",
      description: "Our payout has been pending for 5 days without any update.",
      priority: "high",
      status: "open",
      created_date: "2026-02-08",
      last_updated: "2026-02-10",
      assigned_to: null,
    },
    {
      id: 2,
      ticket_id: "#SUP-1283",
      business: "Urban Stay Inn",
      business_id: "URBSTN4A7E",
      subject: "Account verification issue",
      description: "Unable to complete bank account verification process.",
      priority: "medium",
      status: "in-progress",
      created_date: "2026-02-07",
      last_updated: "2026-02-09",
      assigned_to: "Admin Team",
    },
    {
      id: 3,
      ticket_id: "#SUP-1282",
      business: "Beach Paradise Resort",
      business_id: "BPRST5F9D2",
      subject: "Feature request - Multi-currency support",
      description: "Requesting support for USD and EUR currencies.",
      priority: "low",
      status: "resolved",
      created_date: "2026-02-05",
      last_updated: "2026-02-08",
      assigned_to: "Tech Team",
    },
    {
      id: 4,
      ticket_id: "#SUP-1281",
      business: "Skyline Apartments",
      business_id: "SLYNEBF9D2",
      subject: "Cannot access dashboard",
      description: "Getting 500 error when trying to log in to business dashboard.",
      priority: "high",
      status: "in-progress",
      created_date: "2026-02-09",
      last_updated: "2026-02-10",
      assigned_to: "Tech Support",
    },
    {
      id: 5,
      ticket_id: "#SUP-1280",
      business: "Ocean Breeze Resort",
      business_id: "OCNBRZE1F4",
      subject: "Booking cancellation refund",
      description: "Customer refund not processed after booking cancellation.",
      priority: "medium",
      status: "open",
      created_date: "2026-02-10",
      last_updated: "2026-02-10",
      assigned_to: null,
    },
  ];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.business_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAssignTicket = (id: number) => {
    alert(`Assigning ticket ${id}`);
  };

  const handleResolveTicket = (id: number) => {
    if (confirm("Mark this ticket as resolved?")) {
      alert(`Ticket ${id} resolved`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">
          Manage and respond to support requests from businesses
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Open Tickets", value: tickets.filter(t => t.status === "open").length, icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", color: "text-orange-600" },
          { label: "In Progress", value: tickets.filter(t => t.status === "in-progress").length, icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "text-blue-600" },
          { label: "Resolved Today", value: tickets.filter(t => t.status === "resolved").length, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600" },
          { label: "High Priority", value: tickets.filter(t => t.priority === "high").length, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-red-600" },
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

      {/* Filters */}
      <div className="glass p-6 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="label">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tickets..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
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
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map((ticket) => (
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
                      ticket.status === "in-progress" ? "bg-blue-100 text-blue-600" :
                        "bg-green-100 text-green-600"
                    }`}>
                    {ticket.status.replace("-", " ").toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{ticket.subject}</h3>
                <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold">{ticket.business}</span>
                    <span className="font-mono">({ticket.business_id})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Created {new Date(ticket.created_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Updated {new Date(ticket.last_updated).toLocaleDateString()}</span>
                  </div>
                  {ticket.assigned_to && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Assigned to {ticket.assigned_to}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                {ticket.status !== "resolved" && !ticket.assigned_to && (
                  <button
                    onClick={() => handleAssignTicket(ticket.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap"
                  >
                    Assign
                  </button>
                )}
                {ticket.status !== "resolved" && (
                  <button
                    onClick={() => handleResolveTicket(ticket.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap"
                  >
                    Resolve
                  </button>
                )}
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="glass p-12 rounded-3xl text-center">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-muted-foreground mt-4">No support tickets found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
