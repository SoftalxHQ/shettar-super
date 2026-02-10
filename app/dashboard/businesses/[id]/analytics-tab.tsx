{
  activeTab === "analytics" && (
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
        <div className="space-y-4">
          {business.analytics.monthly_revenue.map((month, i) => {
            const maxRevenue = Math.max(...business.analytics.monthly_revenue.map(m => m.revenue));
            const maxBookings = Math.max(...business.analytics.monthly_revenue.map(m => m.bookings));
            const revenueWidth = (month.revenue / maxRevenue) * 100;
            const bookingsWidth = (month.bookings / maxBookings) * 100;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold w-24">{month.month}</span>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 bg-primary rounded-lg transition-all duration-500" style={{ width: `${revenueWidth}%` }}></div>
                        <span className="text-xs font-bold text-primary min-w-[90px]">{formatCurrency(month.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 bg-green-500 rounded-lg transition-all duration-500" style={{ width: `${bookingsWidth}%` }}></div>
                        <span className="text-xs font-semibold text-green-600 min-w-[90px]">{month.bookings} bookings</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
          <h3 className="text-xl font-bold mb-6">Booking Sources & Insights</h3>
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
  )
}
