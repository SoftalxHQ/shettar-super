"use client";

import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    { label: "Total Revenue", value: "₦12.5M", change: "+12.5%", icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z M12 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" },
    { label: "Active Businesses", value: "1,284", change: "+4.3%", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { label: "Support Tickets", value: "24", change: "-12%", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
    { label: "Pending Payouts", value: "₦2.8M", change: "+8.1%", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-border hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <img src="/logo.svg" alt="Abri Logo" className="w-6 h-6 invert" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">
              Abri<span className="text-primary">Super</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { id: "businesses", label: "Businesses", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
            { id: "accounts", label: "User Accounts", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
            { id: "payouts", label: "Payouts", icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" },
            { id: "support", label: "Support", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
            { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="glass p-4 rounded-2xl space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage Usage</p>
            <div className="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[65%]" />
            </div>
            <p className="text-xs text-muted-foreground">6.5 GB of 10 GB used</p>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl mt-4 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 gap-2 border border-border">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search data..." className="bg-transparent border-none text-sm outline-none w-64" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">Alex Johnson</p>
                <p className="text-xs text-muted-foreground">Platform Admin</p>
              </div>
              <div className="w-10 h-10 bg-indigo-500 rounded-full overflow-hidden border-2 border-primary/20 flex items-center justify-center text-white font-black text-sm shadow-md">
                AJ
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Welcome Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Good morning, Alex.</h1>
              <p className="text-muted-foreground">Here&apos;s what&apos;s happening with Abri network today.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-secondary px-4 py-2 text-sm">Download Reports</button>
              <button className="btn-primary px-4 py-2 text-sm shadow-indigo-500/20">Manage Alerts</button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="glass p-6 rounded-3xl hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Registrations */}
            <div className="glass p-6 rounded-3xl lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Recently Registered Businesses</h3>
                <button className="text-sm font-bold text-primary hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-4 font-medium">Business Name</th>
                      <th className="pb-4 font-medium">Location</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: "Grand Royale Hotel", loc: "Lagos, NG", date: "Jan 12, 2026", status: "Active" },
                      { name: "Skyline Apartments", loc: "Abuja, NG", date: "Jan 10, 2026", status: "Active" },
                      { name: "Ocean Breeze Resort", loc: "Cape Town, SA", date: "Jan 08, 2026", status: "Pending" },
                      { name: "Urban Stay Inn", loc: "Nairobi, KE", date: "Jan 05, 2026", status: "Active" },
                    ].map((row, i) => (
                      <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-4 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {row.name.charAt(0)}
                          </div>
                          <span className="font-semibold">{row.name}</span>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">{row.loc}</td>
                        <td className="py-4 text-sm text-muted-foreground">{row.date}</td>
                        <td className="py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support Overview */}
            <div className="glass p-6 rounded-3xl space-y-6">
              <h3 className="text-xl font-bold">Active Support Tickets</h3>
              <div className="space-y-4">
                {[
                  { id: "#TK-2041", title: "Payout Delayed", priority: "High", user: "John Doe" },
                  { id: "#TK-2039", title: "Business Verification", priority: "Medium", user: "Sarah Smith" },
                  { id: "#TK-2038", title: "API Integration Help", priority: "Low", user: "Mike Ross" },
                ].map((ticket, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-border group hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">{ticket.id}</span>
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${ticket.priority === 'High' ? 'bg-red-500 text-white' :
                        ticket.priority === 'Medium' ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'
                        }`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Requested by {ticket.user}</p>
                  </div>
                ))}
              </div>
              <button className="w-full text-center text-sm font-bold text-primary hover:underline pt-2">
                Open Support Center
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
