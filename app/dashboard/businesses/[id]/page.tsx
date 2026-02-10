"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function BusinessDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const itemsPerPage = 10;

  // Mock data - will be replaced with API call using params.id
  const business = {
    id: params.id,
    business_unique_id: "GRHBLH8A9C",
    name: "Grand Royale Hotel",
    category: "Hotel",
    description: "A luxurious 5-star hotel in the heart of Lagos with world-class amenities and service.",
    address: "123 Victoria Island",
    city: "Lagos",
    state: "Lagos State",
    zip_code: "101241",
    location: "Lagos, Nigeria",
    latitude: 6.4281,
    longitude: 3.4219,
    check_in: "14:00",
    check_out: "11:00",
    owners: [
      { id: 1, name: "John Okafor", email: "john@grandroyale.com", phone: "+234 801 234 5678", is_primary: true },
      { id: 2, name: "Sarah Adeyemi", email: "sarah@grandroyale.com", phone: "+234 802 345 6789", is_primary: false },
    ],
    staff_count: 28,
    revenue: 12500000,
    reservations_count: 342,
    rooms_count: 48,
    verified: true,
    bank_verified: true,
    created_at: "2025-11-15",
    status: "active",
    withdrawable_balance: 2800000,
    pending_balance: 450000,
    refund_balance: 25000,
    cash_balance: 850000,
    amenities: {
      swimming_pool: true,
      gym: true,
      wifi: true,
      spa: true,
      restaurant: true,
      parking: true,
      breakfast: true,
      bar: true,
      laundry: false,
      pet_friendly: false,
      ac: true,
      heating: false,
      tv: true,
      minibar: true,
      garden: true,
      conference_facilities: true,
      business_center: true,
    },
    bank_accounts: [
      { id: 1, bank_name: "GTBank", account_number: "0123456789", account_name: "Grand Royale Hotel Ltd", is_active: true },
      { id: 2, bank_name: "Access Bank", account_number: "9876543210", account_name: "Grand Royale Hotel Ltd", is_active: false },
    ],
    room_types: [
      { id: 1, name: "Standard Room", price: 45000, rooms: 20, bookings: 156 },
      { id: 2, name: "Deluxe Suite", price: 85000, rooms: 18, bookings: 98 },
      { id: 3, name: "Presidential Suite", price: 250000, rooms: 4, bookings: 12 },
      { id: 4, name: "Executive Room", price: 65000, rooms: 6, bookings: 76 },
    ],
    recent_reservations: [
      { id: 1, booking_id: "GRH-AB12CD", guest_name: "Alice Brown", check_in: "2026-02-12", check_out: "2026-02-15", amount: 135000, status: "confirmed" },
      { id: 2, booking_id: "GRH-EF34GH", guest_name: "David Chen", check_in: "2026-02-11", check_out: "2026-02-13", amount: 90000, status: "checked_in" },
      { id: 3, booking_id: "GRH-IJ56KL", guest_name: "Emma Wilson", check_in: "2026-02-10", check_out: "2026-02-14", amount: 180000, status: "checked_out" },
    ],
    transactions: [
      { id: 1, amount: 135000, transaction_type: "income", status: "completed", description: "Booking payment for Standard Room", booking_id: "GRH-AB12CD", created_at: "2026-02-10T14:30:00Z", metadata: { payment_method: "card" } },
      { id: 2, amount: 90000, transaction_type: "income", status: "completed", description: "Booking payment for Deluxe Suite", booking_id: "GRH-EF34GH", created_at: "2026-02-09T09:15:00Z", metadata: { payment_method: "wallet" } },
      { id: 3, amount: 500000, transaction_type: "withdrawal", status: "completed", description: "Withdrawal to GTBank account", booking_id: null, created_at: "2026-02-08T16:45:00Z", metadata: { payment_method: "bank_transfer" } },
      { id: 4, amount: 180000, transaction_type: "income", status: "completed", description: "Booking payment for Presidential Suite", booking_id: "GRH-IJ56KL", created_at: "2026-02-07T11:20:00Z", metadata: { payment_method: "card" } },
      { id: 5, amount: 45000, transaction_type: "refund", status: "completed", description: "Booking cancellation refund", booking_id: "GRH-XY98ZA", created_at: "2026-02-06T13:30:00Z", metadata: { payment_method: "wallet" } },
      { id: 6, amount: 85000, transaction_type: "income", status: "pending", description: "Booking payment for Deluxe Suite", booking_id: "GRH-MN45OP", created_at: "2026-02-05T10:00:00Z", metadata: { payment_method: "card" } },
      { id: 7, amount: 250000, transaction_type: "income", status: "completed", description: "Booking payment for Presidential Suite", booking_id: "GRH-QR67ST", created_at: "2026-02-04T15:45:00Z", metadata: { payment_method: "pos" } },
      { id: 8, amount: 350000, transaction_type: "withdrawal", status: "pending", description: "Withdrawal to Access Bank account", booking_id: null, created_at: "2026-02-03T12:00:00Z", metadata: { payment_method: "bank_transfer" } },
      { id: 9, amount: 65000, transaction_type: "income", status: "completed", description: "Booking payment for Executive Room", booking_id: "GRH-UV12WX", created_at: "2026-02-02T14:15:00Z", metadata: { payment_method: "cash" } },
      { id: 10, amount: 15000, transaction_type: "refund", status: "completed", description: "Partial refund for booking modification", booking_id: "GRH-YZ34AB", created_at: "2026-02-01T09:30:00Z", metadata: { payment_method: "wallet" } },
      { id: 11, amount: 45000, transaction_type: "income", status: "completed", description: "Booking payment for Standard Room", booking_id: "GRH-CD56EF", created_at: "2026-01-31T16:20:00Z", metadata: { payment_method: "card" } },
      { id: 12, amount: 200000, transaction_type: "withdrawal", status: "failed", description: "Withdrawal to GTBank account", booking_id: null, created_at: "2026-01-30T11:45:00Z", metadata: { payment_method: "bank_transfer" } },
      { id: 13, amount: 85000, transaction_type: "income", status: "completed", description: "Booking payment for Deluxe Suite", booking_id: "GRH-GH78IJ", created_at: "2026-01-29T13:00:00Z", metadata: { payment_method: "transfer" } },
      { id: 14, amount: 5000, transaction_type: "adjustment", status: "completed", description: "Balance adjustment - Service charge correction", booking_id: null, created_at: "2026-01-28T10:30:00Z", metadata: {} },
      { id: 15, amount: 45000, transaction_type: "income", status: "completed", description: "Booking payment for Standard Room", booking_id: "GRH-KL90MN", created_at: "2026-01-27T14:45:00Z", metadata: { payment_method: "cash" } },
      { id: 16, amount: 180000, transaction_type: "income", status: "completed", description: "Booking payment for Presidential Suite", booking_id: "GRH-OP12QR", created_at: "2026-01-26T09:15:00Z", metadata: { payment_method: "card" } },
      { id: 17, amount: 25000, transaction_type: "refund", status: "pending", description: "Booking cancellation refund", booking_id: "GRH-ST34UV", created_at: "2026-01-25T16:00:00Z", metadata: { payment_method: "wallet" } },
      { id: 18, amount: 65000, transaction_type: "income", status: "completed", description: "Booking payment for Executive Room", booking_id: "GRH-WX56YZ", created_at: "2026-01-24T11:30:00Z", metadata: { payment_method: "pos" } },
      { id: 19, amount: 450000, transaction_type: "withdrawal", status: "completed", description: "Withdrawal to GTBank account", booking_id: null, created_at: "2026-01-23T15:00:00Z", metadata: { payment_method: "bank_transfer" } },
      { id: 20, amount: 90000, transaction_type: "income", status: "completed", description: "Booking payment for Deluxe Suite", booking_id: "GRH-AB78CD", created_at: "2026-01-22T10:45:00Z", metadata: { payment_method: "card" } },
    ],
    analytics: {
      monthly_revenue: [
        { month: "Aug 2025", revenue: 8200000, bookings: 245 },
        { month: "Sep 2025", revenue: 9500000, bookings: 278 },
        { month: "Oct 2025", revenue: 11200000, bookings: 312 },
        { month: "Nov 2025", revenue: 10800000, bookings: 298 },
        { month: "Dec 2025", revenue: 13500000, bookings: 365 },
        { month: "Jan 2026", revenue: 12500000, bookings: 342 },
      ],
      occupancy_rate: 78.5,
      avg_booking_value: 36550,
      revenue_growth: 15.3,
      booking_growth: 12.7,
      peak_season: "December - January",
      room_performance: [
        { type: "Standard Room", revenue: 7020000, bookings: 156, occupancy: 65 },
        { type: "Deluxe Suite", revenue: 8330000, bookings: 98, occupancy: 82 },
        { type: "Presidential Suite", revenue: 3000000, bookings: 12, occupancy: 95 },
        { type: "Executive Room", revenue: 4940000, bookings: 76, occupancy: 71 },
      ],
      booking_sources: [
        { source: "Direct Website", percentage: 45, bookings: 154 },
        { source: "Mobile App", percentage: 35, bookings: 120 },
        { source: "Phone/Walk-in", percentage: 20, bookings: 68 },
      ],
      top_months: [
        { month: "December", revenue: 13500000 },
        { month: "January", revenue: 12500000 },
        { month: "October", revenue: 11200000 },
      ],
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleVerifyBusiness = () => {
    alert("Business verification triggered");
  };

  const handleVerifyBank = (bankId: number) => {
    alert(`Bank account ${bankId} verification triggered`);
  };

  const handleSuspendBusiness = () => {
    if (confirm("Are you sure you want to suspend this business?")) {
      alert("Business suspended");
    }
  };

  // Format date consistently for server and client to avoid hydration errors
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  };

  // Filter transactions
  const getFilteredTransactions = () => {
    let filtered = [...business.transactions];

    if (transactionTypeFilter !== "all") {
      filtered = filtered.filter(t => t.transaction_type === transactionTypeFilter);
    }

    if (transactionStatusFilter !== "all") {
      filtered = filtered.filter(t => t.status === transactionStatusFilter);
    }

    if (transactionSearch) {
      const query = transactionSearch.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.id.toString().includes(query) ||
        (t.booking_id && t.booking_id.toLowerCase().includes(query)) ||
        t.amount.toString().includes(query)
      );
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return "M7 11l5-5m0 0l5 5m-5-5v12";
      case "withdrawal":
        return "M17 13l-5 5m0 0l-5-5m5 5V6";
      case "refund":
        return "M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z";
      case "adjustment":
        return "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4";
      default:
        return "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z";
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/businesses" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold">{business.name}</h1>
            {business.verified && (
              <svg className="w-7 h-7 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{business.business_unique_id}</span>
            <span>•</span>
            <span>{business.location}</span>
            <span>•</span>
            <span>Registered {formatDate(business.created_at)}</span>
          </div>
          <button
            onClick={() => setShowMapModal(true)}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            View Location on Map
          </button>
        </div>

        <div className="flex items-center gap-3">
          {!business.verified && (
            <button
              onClick={handleVerifyBusiness}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify Business
            </button>
          )}
          <button
            onClick={handleSuspendBusiness}
            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
          >
            Suspend
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass p-2 rounded-2xl flex gap-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
          { id: "financials", label: "Financials", icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" },
          { id: "transactions", label: "Transactions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
          { id: "analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
          { id: "rooms", label: "Rooms & Types", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          { id: "bookings", label: "Recent Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { id: "verification", label: "Verification", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {[
                { label: "Total Revenue", value: formatCurrency(business.revenue), icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z", color: "text-primary" },
                { label: "Reservations", value: business.reservations_count, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-blue-600" },
                { label: "Total Rooms", value: business.rooms_count, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "text-green-600" },
                { label: "Staff Members", value: business.staff_count, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "text-purple-600" },
              ].map((stat, i) => (
                <div key={i} className="glass p-6 rounded-3xl">
                  <div className={`p-3 bg-primary/10 rounded-2xl w-fit mb-3 ${stat.color}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Business Information */}
            <div className="glass p-6 rounded-3xl space-y-4">
              <h3 className="text-xl font-bold">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Category", value: business.category },
                  { label: "Check-in Time", value: business.check_in },
                  { label: "Check-out Time", value: business.check_out },
                  { label: "City", value: business.city },
                  { label: "State", value: business.state },
                  { label: "ZIP Code", value: business.zip_code },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{business.description}</p>
              </div>
            </div>

            {/* Amenities */}
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(business.amenities)
                  .filter(([_, value]) => value)
                  .map(([key, _]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="capitalize">{key.replace(/_/g, " ")}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Column - Owners & Staff Info */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Business Owners</h3>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">{business.owners.length} Owner{business.owners.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {business.owners.map((owner) => (
                  <div key={owner.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0">
                      {owner.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{owner.name}</p>
                        {owner.is_primary && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-bold">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
                      <p className="text-xs text-muted-foreground">{owner.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-3xl space-y-4">
              <h3 className="text-xl font-bold">Staff Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                      <p className="text-2xl font-bold">{business.staff_count}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Includes all active staff members and owners</p>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl space-y-3">
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold">
                Send Notification
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "financials" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balances */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold">Account Balances</h3>
            {[
              { label: "Withdrawable Balance", amount: business.withdrawable_balance, color: "text-green-600" },
              { label: "Pending Balance", amount: business.pending_balance, color: "text-orange-600" },
              { label: "Refund Balance", amount: business.refund_balance, color: "text-blue-600" },
              { label: "Cash Balance", amount: business.cash_balance, color: "text-purple-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <span className="text-sm font-medium">{item.label}</span>
                <span className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>

          {/* Bank Accounts */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold">Bank Accounts</h3>
            {business.bank_accounts.map((bank) => (
              <div key={bank.id} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{bank.bank_name}</p>
                    <p className="text-sm text-muted-foreground">{bank.account_number}</p>
                    <p className="text-xs text-muted-foreground">{bank.account_name}</p>
                  </div>
                  {bank.is_active ? (
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerifyBank(bank.id)}
                      className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold hover:opacity-90"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Occupancy Rate", value: `${business.analytics.occupancy_rate}%`, change: "+5.2%", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "text-green-600" },
              { label: "Avg Booking Value", value: formatCurrency(business.analytics.avg_booking_value), change: "+8.1%", icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z", color: "text-blue-600" },
              { label: "Revenue Growth", value: `+${business.analytics.revenue_growth}%`, change: "vs last month", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "text-purple-600" },
              { label: "Booking Growth", value: `+${business.analytics.booking_growth}%`, change: "vs last month", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "text-orange-600" },
            ].map((metric, i) => (
              <div key={i} className="glass p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 bg-primary/10 rounded-2xl ${metric.color}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={metric.icon} />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">{metric.change}</span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue & Bookings Trend */}
          <div className="glass p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Revenue & Bookings Trend</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Bookings</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={business.analytics.monthly_revenue.map(m => ({
                  name: m.month,
                  revenue: m.revenue,
                  bookings: m.bookings
                }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(34, 197, 94)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="rgb(34, 197, 94)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dx={-10}
                    tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip
                    formatter={(value?: number, name?: string) => {
                      if (value === undefined || name === undefined) return ['0', ''];
                      if (name === 'revenue') return [`₦${value.toLocaleString()}`, 'Revenue'];
                      if (name === 'bookings') return [`${value} bookings`, 'Bookings'];
                      return [value.toString(), name];
                    }}
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'white'
                    }}
                  />
                  <Area
                    name="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    name="bookings"
                    type="monotone"
                    dataKey="bookings"
                    stroke="rgb(34, 197, 94)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Data summary below chart */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
              {business.analytics.monthly_revenue.map((month, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">{month.month}</p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(month.revenue)}</p>
                  <p className="text-xs font-semibold text-green-600">{month.bookings} bookings</p>
                </div>
              ))}
            </div>
          </div>

          {/* Room Performance & Booking Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Room Performance */}
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-6">Room Type Performance</h3>
              <div className="space-y-4">
                {business.analytics.room_performance.map((room, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{room.type}</h4>
                      <span className="text-sm font-bold text-primary">{formatCurrency(room.revenue)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bookings</span>
                        <span className="font-semibold">{room.bookings}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Occupancy</span>
                          <span className="font-semibold">{room.occupancy}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-primary to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${room.occupancy}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Sources */}
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-6">Booking Sources</h3>
              <div className="space-y-4">
                {business.analytics.booking_sources.map((source, i) => {
                  const colors = [
                    { bg: "bg-primary", text: "text-primary" },
                    { bg: "bg-green-500", text: "text-green-600" },
                    { bg: "bg-orange-500", text: "text-orange-600" },
                  ];
                  const color = colors[i % colors.length];
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{source.source}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">{source.bookings} bookings</span>
                          <span className={`text-sm font-bold ${color.text}`}>{source.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-zinc-700 h-3 rounded-full overflow-hidden">
                        <div className={`${color.bg} h-full rounded-full transition-all duration-500`} style={{ width: `${source.percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}

                {/* Top Performing Months */}
                <div className="mt-6 p-4 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl border border-primary/20">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Top Performing Months
                  </h4>
                  <div className="space-y-2">
                    {business.analytics.top_months.map((month, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          <span className="font-semibold">{month.month}</span>
                        </div>
                        <span className="font-bold text-primary">{formatCurrency(month.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Peak Season Insights */}
          <div className="glass p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-primary/10 rounded-2xl flex-shrink-0">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Peak Season Insights</h3>
                <p className="text-muted-foreground mb-4">
                  Your business performs best during <span className="font-bold text-foreground">{business.analytics.peak_season}</span>,
                  with an average occupancy rate of <span className="font-bold text-foreground">{business.analytics.occupancy_rate}%</span> and
                  revenue growth of <span className="font-bold text-green-600">+{business.analytics.revenue_growth}%</span> compared to the previous period.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Best Performing Room</p>
                    <p className="font-bold text-sm">Presidential Suite</p>
                    <p className="text-xs text-green-600 font-semibold mt-1">95% occupancy</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Primary Booking Source</p>
                    <p className="font-bold text-sm">Direct Website</p>
                    <p className="text-xs text-primary font-semibold mt-1">45% of bookings</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Avg Revenue</p>
                    <p className="font-bold text-sm">{formatCurrency(business.analytics.monthly_revenue.reduce((acc, m) => acc + m.revenue, 0) / business.analytics.monthly_revenue.length)}</p>
                    <p className="text-xs text-purple-600 font-semibold mt-1">Last 6 months</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-6">
          {/* Transaction Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { label: "Total Income", value: formatCurrency(business.transactions.filter(t => t.transaction_type === "income" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0)), icon: "M7 11l5-5m0 0l5 5m-5-5v12", color: "text-green-600" },
              { label: "Total Withdrawals", value: formatCurrency(business.transactions.filter(t => t.transaction_type === "withdrawal" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0)), icon: "M17 13l-5 5m0 0l-5-5m5 5V6", color: "text-blue-600" },
              { label: "Total Refunds", value: formatCurrency(business.transactions.filter(t => t.transaction_type === "refund").reduce((sum, t) => sum + t.amount, 0)), icon: "M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z", color: "text-orange-600" },
              { label: "Total Transactions", value: business.transactions.length, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", color: "text-primary" },
            ].map((stat, i) => (
              <div key={i} className="glass p-6 rounded-3xl">
                <div className={`p-3 bg-primary/10 rounded-2xl w-fit mb-3 ${stat.color}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
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
                    placeholder="Search transactions..."
                    className="input pl-10"
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="label">Transaction Type</label>
                <select
                  className="input"
                  value={transactionTypeFilter}
                  onChange={(e) => setTransactionTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="refund">Refund</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={transactionStatusFilter}
                  onChange={(e) => setTransactionStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass p-6 rounded-3xl overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">All Transactions ({filteredTransactions.length})</h3>
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold">
                Export CSV
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                  <th className="pb-4 font-medium">ID</th>
                  <th className="pb-4 font-medium">Type</th>
                  <th className="pb-4 font-medium">Description</th>
                  <th className="pb-4 font-medium">Booking ID</th>
                  <th className="pb-4 font-medium">Amount</th>
                  <th className="pb-4 font-medium">Method</th>
                  <th className="pb-4 font-medium">Date</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-4 font-mono text-sm font-semibold">#{transaction.id}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${transaction.transaction_type === "income" ? "bg-green-100 text-green-600" :
                          transaction.transaction_type === "withdrawal" ? "bg-blue-100 text-blue-600" :
                            transaction.transaction_type === "refund" ? "bg-orange-100 text-orange-600" :
                              "bg-purple-100 text-purple-600"
                          }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTransactionIcon(transaction.transaction_type)} />
                          </svg>
                        </div>
                        <span className="text-sm font-medium capitalize">{transaction.transaction_type}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm max-w-xs truncate">{transaction.description}</td>
                    <td className="py-4">
                      {transaction.booking_id ? (
                        <span className="font-mono text-xs bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">{transaction.booking_id}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4 font-semibold">{formatCurrency(transaction.amount)}</td>
                    <td className="py-4">
                      <span className="text-xs bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded capitalize">
                        {transaction.metadata?.payment_method?.replace(/_/g, " ") || "-"}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${transaction.status === "completed" ? "bg-green-100 text-green-600" :
                        transaction.status === "pending" ? "bg-orange-100 text-orange-600" :
                          "bg-red-100 text-red-600"
                        }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-muted-foreground mt-4">No transactions found matching your filters</p>
              </div>
            )}

            {/* Pagination */}
            {filteredTransactions.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-medium px-4">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "rooms" && (
        <div className="glass p-6 rounded-3xl">
          <h3 className="text-xl font-bold mb-4">Room Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {business.room_types.map((room_type) => (
              <div key={room_type.id} className="p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold">{room_type.name}</h4>
                  <span className="text-xl font-bold text-primary">{formatCurrency(room_type.price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Rooms:</span>
                  <span className="font-semibold">{room_type.rooms}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Bookings:</span>
                  <span className="font-semibold">{room_type.bookings}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${Math.min((room_type.bookings / business.reservations_count) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="glass p-6 rounded-3xl overflow-x-auto">
          <h3 className="text-xl font-bold mb-4">Recent Reservations</h3>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-4 font-medium">Booking ID</th>
                <th className="pb-4 font-medium">Guest</th>
                <th className="pb-4 font-medium">Check-in</th>
                <th className="pb-4 font-medium">Check-out</th>
                <th className="pb-4 font-medium">Amount</th>
                <th className="pb-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {business.recent_reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4 font-mono text-sm font-semibold">{reservation.booking_id}</td>
                  <td className="py-4">{reservation.guest_name}</td>
                  <td className="py-4 text-sm text-muted-foreground">{formatDate(reservation.check_in)}</td>
                  <td className="py-4 text-sm text-muted-foreground">{formatDate(reservation.check_out)}</td>
                  <td className="py-4 font-semibold">{formatCurrency(reservation.amount)}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${reservation.status === "confirmed" ? "bg-blue-100 text-blue-600" :
                      reservation.status === "checked_in" ? "bg-green-100 text-green-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                      {reservation.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "verification" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold">Business Verification</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div>
                  <p className="font-semibold">Business Status</p>
                  <p className="text-xs text-muted-foreground">Overall business verification status</p>
                </div>
                {business.verified ? (
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <button
                    onClick={handleVerifyBusiness}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
                  >
                    Verify Now
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div>
                  <p className="font-semibold">Bank Verification</p>
                  <p className="text-xs text-muted-foreground">Bank account verification status</p>
                </div>
                {business.bank_verified ? (
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold">Verification History</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-green-600">Business Verified</span>
                  <span className="text-xs text-muted-foreground">{formatDate(business.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Business successfully verified by Admin Team</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600">Business Registered</span>
                  <span className="text-xs text-muted-foreground">{formatDate(business.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Business account created by {business.owners[0].name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowMapModal(false); setMapLoading(true); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{business.name} - Location</h3>
                <p className="text-sm text-muted-foreground mt-1">{business.address}, {business.city}, {business.state}</p>
              </div>
              <button
                onClick={() => { setShowMapModal(false); setMapLoading(true); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Latitude</p>
                    <p className="text-sm font-semibold">{business.latitude}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Longitude</p>
                    <p className="text-sm font-semibold">{business.longitude}</p>
                  </div>
                </div>
                <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-border relative bg-slate-100 dark:bg-zinc-800">
                  {mapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 z-10">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-muted-foreground">Loading map...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${business.latitude},${business.longitude}&hl=en&z=15&output=embed`}
                    allowFullScreen
                    onLoad={() => setMapLoading(false)}
                  ></iframe>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold text-center"
                  >
                    Open in Google Maps
                  </a>
                  <a
                    href={`https://maps.apple.com/?q=${business.latitude},${business.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold text-center"
                  >
                    Open in Apple Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
