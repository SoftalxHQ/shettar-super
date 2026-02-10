"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BusinessDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("overview");

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
    check_in: "14:00",
    check_out: "11:00",
    owner: { name: "John Okafor", email: "john@grandroyale.com", phone: "+234 801 234 5678" },
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
            <span>Registered {new Date(business.created_at).toLocaleDateString()}</span>
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Total Revenue", value: formatCurrency(business.revenue), icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z", color: "text-primary" },
                { label: "Reservations", value: business.reservations_count, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-blue-600" },
                { label: "Total Rooms", value: business.rooms_count, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "text-green-600" },
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

          {/* Right Column - Owner Info */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl space-y-4">
              <h3 className="text-xl font-bold">Business Owner</h3>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {business.owner.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold">{business.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{business.owner.email}</p>
                  <p className="text-xs text-muted-foreground">{business.owner.phone}</p>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl space-y-3">
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold">
                Send Notification
              </button>
              <button className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold">
                View Full Analytics
              </button>
              <button className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold">
                Export Data
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
                  <td className="py-4 text-sm text-muted-foreground">{new Date(reservation.check_in).toLocaleDateString()}</td>
                  <td className="py-4 text-sm text-muted-foreground">{new Date(reservation.check_out).toLocaleDateString()}</td>
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
                  <span className="text-xs text-muted-foreground">{new Date(business.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">Business successfully verified by Admin Team</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600">Business Registered</span>
                  <span className="text-xs text-muted-foreground">{new Date(business.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">Business account created by {business.owner.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
