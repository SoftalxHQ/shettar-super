"use client";

import { useGetSupportTicketStatsQuery } from "@/lib/store/services/api";

/**
 * Unread support-ticket count pill for the sidebar Support nav item.
 * Refreshes when SupportTicketsCableListener invalidates SupportTicketStats
 * (new messages, ticket updates, mark-viewed stats_changed).
 */
export default function SupportUnreadBadge() {
  const { data } = useGetSupportTicketStatsQuery(undefined, {
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });
  const unread = data?.unread ?? 0;

  if (unread <= 0) return null;

  return (
    <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
      {unread > 9 ? "9+" : unread}
    </span>
  );
}
