"use client";

import { useState } from "react";
import Link from "next/link";

export default function BusinessesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  // Mock data - will be replaced with API calls
  const businesses = [
    {
      id: 1,
      business_unique_id: "GRHBLH8A9C",
      name: "Grand Royale Hotel",
      category: "Hotel",
      location: "Lagos, Nigeria",
      owner: { name: "John Okafor", email: "john@grandroyale.com" },
      revenue: 12500000,
      reservations: 342,
      rooms: 48,
      verified: true,
      bank_verified: true,
      created_at: "2025-11-15",
      status: "active",
      withdrawable_balance: 2800000,
      pending_balance: 450000,
    },
    {
      id: 2,
      business_unique_id: "SLYNEBF9D2",
      name: "Skyline Apartments",
      category: "Apartment",
      location: "Abuja, Nigeria",
      owner: { name: "Sarah Ibrahim", email: "sarah@skyline.com" },
      revenue: 8200000,
      reservations: 156,
      rooms: 24,
      verified: true,
      bank_verified: false,
      created_at: "2025-12-03",
      status: "active",
      withdrawable_balance: 1200000,
      pending_balance: 180000,
    },
    {
      id: 3,
      business_unique_id: "OCNBRZE1F4",
      name: "Ocean Breeze Resort",
      category: "Resort",
      location: "Cape Town, South Africa",
      owner: { name: "Mike Johnson", email: "mike@oceanbreeze.com" },
      revenue: 15800000,
      reservations: 428,
      rooms: 72,
      verified: false,
      bank_verified: false,
      created_at: "2026-01-08",
      status: "pending",
      withdrawable_balance: 0,
      pending_balance: 3200000,
    },
    {
      id: 4,
      business_unique_id: "URBSTN4A7E",
      name: "Urban Stay Inn",
      category: "Inn",
      location: "Nairobi, Kenya",
      owner: { name: "Grace Mwangi", email: "grace@urbanstay.com" },
      revenue: 4500000,
      reservations: 98,
      rooms: 18,
      verified: true,
      bank_verified: true,
      created_at: "2025-10-22",
      status: "active",
      withdrawable_balance: 850000,
      pending_balance: 95000,
    },
  ];

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.business_unique_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.owner.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || business.status === statusFilter;
    const matchesVerification =
      verificationFilter === "all" ||
      (verificationFilter === "verified" && business.verified) ||
      (verificationFilter === "unverified" && !business.verified);

    return matchesSearch && matchesStatus && matchesVerification;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Business Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all registered businesses on the platform
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Businesses", value: businesses.length, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          { label: "Pending Verification", value: businesses.filter(b => !b.verified).length, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-orange-600" },
          { label: "Active Businesses", value: businesses.filter(b => b.status === "active").length, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600" },
          { label: "Total Revenue", value: formatCurrency(businesses.reduce((sum, b) => sum + b.revenue, 0)), icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z", color: "text-primary" },
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
                placeholder="Search by name, ID, or owner..."
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Verification Filter */}
          <div>
            <label className="label">Verification</label>
            <select
              className="input"
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground border-b border-border">
              <th className="pb-4 font-medium">Business</th>
              <th className="pb-4 font-medium">Owner</th>
              <th className="pb-4 font-medium">Performance</th>
              <th className="pb-4 font-medium">Balances</th>
              <th className="pb-4 font-medium">Status</th>
              <th className="pb-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredBusinesses.map((business) => (
              <tr key={business.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold">
                      {business.name.charAt(0)}
                    </div>
                    <div>
                      <Link href={`/dashboard/businesses/${business.id}`} className="font-semibold hover:text-primary transition-colors">
                        {business.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{business.business_unique_id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-muted-foreground">
                          {business.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{business.location}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <p className="text-sm font-medium">{business.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{business.owner.email}</p>
                </td>
                <td className="py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{formatCurrency(business.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{business.reservations} bookings • {business.rooms} rooms</p>
                  </div>
                </td>
                <td className="py-4">
                  <div className="space-y-1">
                    <p className="text-xs"><span className="font-medium">Available:</span> {formatCurrency(business.withdrawable_balance)}</p>
                    <p className="text-xs"><span className="font-medium">Pending:</span> {formatCurrency(business.pending_balance)}</p>
                  </div>
                </td>
                <td className="py-4">
                  <div className="space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block ${business.status === "active" ? "bg-green-100 text-green-600" :
                      business.status === "pending" ? "bg-orange-100 text-orange-600" :
                        "bg-red-100 text-red-600"
                      }`}>
                      {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      {business.verified ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="text-orange-600">Unverified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {business.bank_verified ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                          </svg>
                          Bank OK
                        </span>
                      ) : (
                        <span className="text-orange-600">Bank Pending</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <Link
                    href={`/dashboard/businesses/${business.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
                  >
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-muted-foreground mt-4">No businesses found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
