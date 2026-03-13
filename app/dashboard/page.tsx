"use client";

export default function DashboardPage() {
  const stats = [
    { label: "Total Revenue", value: "₦12.5M", change: "+12.5%", trend: "up", icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z M12 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" },
    { label: "Active Businesses", value: "1,284", change: "+4.3%", trend: "up", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { label: "Support Tickets", value: "24", change: "-12%", trend: "down", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
    { label: "Pending Payouts", value: "₦2.8M", change: "+8.1%", trend: "up", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const recentBusinesses = [
    { name: "Grand Royale Hotel", location: "Lagos, Nigeria", status: "verified", date: "2 days ago" },
    { name: "Skyline Apartments", location: "Abuja, Nigeria", status: "pending", date: "5 days ago" },
    { name: "Ocean Breeze Resort", location: "Cape Town, SA", status: "pending", date: "1 week ago" },
  ];

  const supportTickets = [
    { id: "#SUP-1284", business: "Grand Royale Hotel", subject: "Payout delay issue", priority: "high", status: "open" },
    { id: "#SUP-1283", business: "Urban Stay Inn", subject: "Account verification", priority: "medium", status: "in-progress" },
    { id: "#SUP-1282", business: "Beach Paradise", subject: "Feature request", priority: "low", status: "resolved" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with the Shettar platform.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <span className={`text-sm font-bold flex items-center gap-1 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {stat.trend === "up" ? "↗" : "↘"} {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Registered Businesses */}
        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Recently Registered Businesses</h3>
            <button className="text-sm text-primary hover:underline font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {recentBusinesses.map((business, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    {business.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{business.name}</p>
                    <p className="text-xs text-muted-foreground">{business.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${business.status === "verified"
                      ? "bg-green-100 text-green-600"
                      : "bg-orange-100 text-orange-600"
                    }`}>
                    {business.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{business.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Support Tickets */}
        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Active Support Tickets</h3>
            <button className="text-sm text-primary hover:underline font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {supportTickets.map((ticket, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-muted-foreground">{ticket.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ticket.priority === "high" ? "bg-red-100 text-red-600" :
                      ticket.priority === "medium" ? "bg-orange-100 text-orange-600" :
                        "bg-blue-100 text-blue-600"
                    }`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="font-semibold text-sm mb-1">{ticket.subject}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{ticket.business}</p>
                  <span className={`text-xs font-medium ${ticket.status === "open" ? "text-red-600" :
                      ticket.status === "in-progress" ? "text-orange-600" :
                        "text-green-600"
                    }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
