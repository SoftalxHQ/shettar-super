"use client";

import { useState } from "react";
import Link from "next/link";

export default function UserAccountsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - will be replaced with API calls
  const users = [
    {
      id: 1,
      name: "John Okafor",
      email: "john@grandroyale.com",
      phone: "+234 801 234 5678",
      role: "Business Owner",
      businesses: ["Grand Royale Hotel"],
      status: "active",
      joined: "2025-11-15",
      last_login: "2026-02-09",
      total_bookings: 342,
    },
    {
      id: 2,
      name: "Sarah Ibrahim",
      email: "sarah@skyline.com",
      phone: "+234 802 345 6789",
      role: "Business Owner",
      businesses: ["Skyline Apartments"],
      status: "active",
      joined: "2025-12-03",
      last_login: "2026-02-08",
      total_bookings: 156,
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@oceanbreeze.com",
      phone: "+27 83 456 7890",
      role: "Business Owner",
      businesses: ["Ocean Breeze Resort"],
      status: "pending",
      joined: "2026-01-08",
      last_login: "2026-02-10",
      total_bookings: 428,
    },
    {
      id: 4,
      name: "Grace Mwangi",
      email: "grace@urbanstay.com",
      phone: "+254 701 234 567",
      role: "Business Owner",
      businesses: ["Urban Stay Inn"],
      status: "active",
      joined: "2025-10-22",
      last_login: "2026-02-07",
      total_bookings: 98,
    },
    {
      id: 5,
      name: "David Chen",
      email: "david@customer.com",
      phone: "+1 555 123 4567",
      role: "Customer",
      businesses: [],
      status: "active",
      joined: "2026-01-15",
      last_login: "2026-02-10",
      total_bookings: 12,
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Manage all user accounts on the platform
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: users.length, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
          { label: "Business Owners", value: users.filter(u => u.role === "Business Owner").length, icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "text-blue-600" },
          { label: "Customers", value: users.filter(u => u.role === "Customer").length, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "text-green-600" },
          { label: "Pending Approval", value: users.filter(u => u.status === "pending").length, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-orange-600" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 bg-primary/10 rounded-2xl ${stat.color || "text-primary"}`}>
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
                placeholder="Search by name, email, or phone..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="Business Owner">Business Owners</option>
              <option value="Customer">Customers</option>
            </select>
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground border-b border-border">
              <th className="pb-4 font-medium">User</th>
              <th className="pb-4 font-medium">Role & Businesses</th>
              <th className="pb-4 font-medium">Activity</th>
              <th className="pb-4 font-medium">Status</th>
              <th className="pb-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-lg">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="space-y-1">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 inline-block">
                      {user.role}
                    </span>
                    {user.businesses.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {user.businesses.map((business, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{business}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4">
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Joined:</span> {new Date(user.joined).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Last login: {new Date(user.last_login).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{user.total_bookings} total bookings</p>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === "active" ? "bg-green-100 text-green-600" :
                      user.status === "pending" ? "bg-orange-100 text-orange-600" :
                        "bg-red-100 text-red-600"
                    }`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-muted-foreground mt-4">No users found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
