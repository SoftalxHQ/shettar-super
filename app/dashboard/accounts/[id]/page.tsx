"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AccountDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");

  // Mock account data - will be replaced with API call
  const account = {
    id: params.id,
    account_unique_id: "ACC-XY4F9A",
    first_name: "David",
    last_name: "Chen",
    other_name: "Michael",
    email: "david.chen@email.com",
    phone_number: "+1 555 123 4567",
    gender: "Male",
    date_of_birth: "1990-05-15",
    address: "123 Main St, Apt 4B, Lagos, Nigeria",
    zip_code: "100001",
    wallet_balance: 125000,
    email_verified: true,
    status: "active",
    created_at: "2026-01-15",
    last_sign_in_at: "2026-02-10",
    sign_in_count: 47,
    current_sign_in_ip: "197.210.55.132",

    // Emergency contact
    emer_first_name: "Sarah",
    emer_last_name: "Chen",
    emer_phone_number: "+1 555 987 6543",

    // Statistics
    stats: {
      total_bookings: 12,
      completed_bookings: 8,
      cancelled_bookings: 2,
      upcoming_bookings: 2,
      total_spent: 890000,
      avg_booking_value: 74166,
    },

    // Recent bookings
    bookings: [
      {
        id: 1,
        booking_id: "BK-A2F4E9",
        business_name: "Grand Royale Hotel",
        room_type: "Deluxe Suite",
        check_in: "2026-02-15",
        check_out: "2026-02-18",
        guests: 2,
        total_amount: 150000,
        status: "confirmed",
        payment_method: "card",
      },
      {
        id: 2,
        booking_id: "BK-B7G3H1",
        business_name: "Ocean Breeze Resort",
        room_type: "Standard Room",
        check_in: "2026-01-20",
        check_out: "2026-01-23",
        guests: 1,
        total_amount: 75000,
        status: "completed",
        payment_method: "wallet",
      },
      {
        id: 3,
        booking_id: "BK-C9K5L2",
        business_name: "Skyline Apartments",
        room_type: "Executive Room",
        check_in: "2026-01-05",
        check_out: "2026-01-08",
        guests: 2,
        total_amount: 120000,
        status: "cancelled",
        payment_method: "card",
      },
    ],

    // Transactions
    transactions: [
      {
        id: 1,
        type: "booking_payment",
        description: "Payment for Grand Royale Hotel booking",
        amount: -150000,
        balance_after: 125000,
        status: "completed",
        created_at: "2026-02-10 14:30:00",
      },
      {
        id: 2,
        type: "wallet_topup",
        description: "Wallet top-up via bank transfer",
        amount: 200000,
        balance_after: 275000,
        status: "completed",
        created_at: "2026-02-08 10:15:00",
      },
      {
        id: 3,
        type: "refund",
        description: "Refund for cancelled Skyline booking",
        amount: 120000,
        balance_after: 75000,
        status: "completed",
        created_at: "2026-01-25 16:45:00",
      },
      {
        id: 4,
        type: "airtime_purchase",
        description: "MTN Airtime - ₦2,000",
        amount: -2000,
        balance_after: -45000,
        status: "completed",
        created_at: "2026-01-22 09:20:00",
      },
      {
        id: 5,
        type: "data_purchase",
        description: "Glo Data - 5GB",
        amount: -3000,
        balance_after: -43000,
        status: "completed",
        created_at: "2026-01-20 12:30:00",
      },
    ],
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id: "bookings", label: "Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "transactions", label: "Transactions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  ];

  const filteredBookings = account.bookings.filter(booking =>
    bookingStatusFilter === "all" || booking.status === bookingStatusFilter
  );

  const filteredTransactions = account.transactions.filter(txn =>
    transactionFilter === "all" || txn.type === transactionFilter
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accounts" className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{account.first_name} {account.last_name}</h1>
            <p className="text-muted-foreground mt-1">Account ID: {account.account_unique_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${account.status === "active" ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
              account.status === "suspended" ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
            }`}>
            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
          </span>
          {account.email_verified && (
            <span className="px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Wallet Balance", value: formatCurrency(account.wallet_balance), icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", color: "bg-green-100 text-green-600 dark:bg-green-900/30" },
          { label: "Total Bookings", value: account.stats.total_bookings, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" },
          { label: "Total Spent", value: formatCurrency(account.stats.total_spent), icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
          { label: "Avg Booking Value", value: formatCurrency(account.stats.avg_booking_value), icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className={`inline-flex p-3 rounded-2xl mb-3 ${stat.color}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="glass rounded-3xl p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: `${account.first_name} ${account.other_name} ${account.last_name}` },
                  { label: "Email", value: account.email },
                  { label: "Phone Number", value: account.phone_number },
                  { label: "Gender", value: account.gender },
                  { label: "Date of Birth", value: formatDate(account.date_of_birth) },
                  { label: "Address", value: account.address },
                  { label: "Zip Code", value: account.zip_code },
                  { label: "Account Created", value: formatDate(account.created_at) },
                ].map((field, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                    <p className="font-semibold">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "First Name", value: account.emer_first_name },
                  { label: "Last Name", value: account.emer_last_name },
                  { label: "Phone Number", value: account.emer_phone_number },
                ].map((field, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                    <p className="font-semibold">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Account Activity */}
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Account Activity</h3>
              <div className="space-y-3">
                {[
                  { label: "Last Login", value: formatDate(account.last_sign_in_at) },
                  { label: "Total Logins", value: account.sign_in_count },
                  { label: "Last IP Address", value: account.current_sign_in_ip },
                ].map((field, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="font-semibold text-sm">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Statistics */}
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Booking Stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Completed", value: account.stats.completed_bookings, color: "text-green-600" },
                  { label: "Upcoming", value: account.stats.upcoming_bookings, color: "text-blue-600" },
                  { label: "Cancelled", value: account.stats.cancelled_bookings, color: "text-red-600" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className={`font-bold text-sm ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="glass p-6 rounded-3xl">
          {/* Filter */}
          <div className="mb-6">
            <select
              className="input max-w-xs"
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Bookings Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                  <th className="pb-4 font-medium">Booking ID</th>
                  <th className="pb-4 font-medium">Business & Room</th>
                  <th className="pb-4 font-medium">Dates</th>
                  <th className="pb-4 font-medium">Guests</th>
                  <th className="pb-4 font-medium">Amount</th>
                  <th className="pb-4 font-medium">Payment</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-4">
                      <span className="font-mono text-sm font-bold">{booking.booking_id}</span>
                    </td>
                    <td className="py-4">
                      <p className="font-semibold text-sm">{booking.business_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.room_type}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{formatDate(booking.check_in)}</p>
                      <p className="text-xs text-muted-foreground">to {formatDate(booking.check_out)}</p>
                    </td>
                    <td className="py-4 text-sm">{booking.guests}</td>
                    <td className="py-4 font-bold text-sm">{formatCurrency(booking.total_amount)}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800">
                        {booking.payment_method}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === "confirmed" ? "bg-blue-100 text-blue-600" :
                          booking.status === "completed" ? "bg-green-100 text-green-600" :
                            "bg-red-100 text-red-600"
                        }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="glass p-6 rounded-3xl">
          {/* Filter */}
          <div className="mb-6">
            <select
              className="input max-w-xs"
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="booking_payment">Booking Payments</option>
              <option value="wallet_topup">Wallet Top-ups</option>
              <option value="refund">Refunds</option>
              <option value="airtime_purchase">Airtime Purchases</option>
              <option value="data_purchase">Data Purchases</option>
            </select>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                  <th className="pb-4 font-medium">Date & Time</th>
                  <th className="pb-4 font-medium">Type</th>
                  <th className="pb-4 font-medium">Description</th>
                  <th className="pb-4 font-medium">Amount</th>
                  <th className="pb-4 font-medium">Balance After</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-4 text-sm">{formatDate(txn.created_at)}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800">
                        {txn.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 text-sm">{txn.description}</td>
                    <td className="py-4">
                      <span className={`font-bold ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {txn.amount >= 0 ? "+" : ""}{formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-sm">{formatCurrency(txn.balance_after)}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
                        {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
