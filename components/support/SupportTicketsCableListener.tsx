"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { Consumer, Subscription } from "@rails/actioncable";
import { useAuth } from "@/lib/auth-context";
import {
  apiService,
  type SupportTicket,
} from "@/lib/store/services/api";
import type { RootState } from "@/lib/store/store";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  subscribeSupportAdminChannel,
  type SupportAdminCableEvent,
} from "@/lib/support-tickets-cable";
import {
  hydrateNotificationSoundEnabled,
  isNotificationSoundEnabled,
  playNotificationTone,
} from "@/lib/notification-sound";

function canViewSupport(admin: {
  admin_role?: string;
  permissions?: AdminPermissions;
} | null): boolean {
  if (!admin) return false;
  if (admin.admin_role === "super_admin" || !admin.admin_role) return true;
  return admin.permissions?.support_tickets?.view === true;
}

function ticketPath(id: number | string): string {
  return `/dashboard/support/${id}`;
}

function ticketLabel(ticket: Pick<SupportTicket, "id" | "ticket_id">): string {
  return ticket.ticket_id || `#${ticket.id}`;
}

/**
 * Dashboard-wide ActionCable listener for support tickets.
 * Shows sonner toasts and refreshes SupportTicket RTK Query cache.
 */
export default function SupportTicketsCableListener() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { admin } = useAuth();
  const token = useSelector((state: RootState) => state.auth.token);
  const canView = canViewSupport(admin);
  const adminId = admin?.id;
  const pathnameRef = useRef(pathname);
  const adminIdRef = useRef(adminId);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    adminIdRef.current = adminId;
  }, [adminId]);

  useEffect(() => {
    if (!token || !canView) return;

    hydrateNotificationSoundEnabled();

    let consumer: Consumer | null = null;
    let subscription: Subscription | null = null;

    const invalidateSupport = (ticketId?: number | string | null) => {
      const tags: Array<
        "SupportTicket" | "SupportTicketStats" | { type: "SupportTicket"; id: number | string }
      > = ["SupportTicket", "SupportTicketStats"];
      if (ticketId != null) {
        tags.push({ type: "SupportTicket", id: ticketId });
      }
      dispatch(apiService.util.invalidateTags(tags));
    };

    const invalidateSupportStats = () => {
      dispatch(apiService.util.invalidateTags(["SupportTicketStats"]));
    };

    const isViewingTicket = (numericId?: number | string | null) => {
      if (numericId == null) return false;
      return pathnameRef.current === ticketPath(numericId);
    };

    const playNoticeSound = () => {
      if (isNotificationSoundEnabled()) void playNotificationTone();
    };

    const handleEvent = (data: SupportAdminCableEvent) => {
      switch (data.type) {
        case "ticket_created": {
          invalidateSupport(data.ticket.id);
          if (isViewingTicket(data.ticket.id)) break;

          playNoticeSound();
          toast("New support ticket", {
            description: `${ticketLabel(data.ticket)} — ${data.ticket.subject}`,
            action: {
              label: "View",
              onClick: () => router.push(ticketPath(data.ticket.id)),
            },
            duration: 10_000,
          });
          break;
        }
        case "ticket_updated": {
          invalidateSupport(data.ticket.id);
          if (isViewingTicket(data.ticket.id)) break;

          playNoticeSound();
          toast.info("Support ticket updated", {
            description: `${ticketLabel(data.ticket)} is now ${data.ticket.status?.replace("_", " ")}`,
            action: {
              label: "View",
              onClick: () => router.push(ticketPath(data.ticket.id)),
            },
          });
          break;
        }
        case "new_message": {
          const numericId = data.support_ticket_id;
          invalidateSupport(numericId);

          // Skip toast for own admin replies / when already on the ticket
          const fromSelf =
            data.message?.sender_type === "Admin" &&
            data.message?.sender_id === adminIdRef.current;
          if (fromSelf || isViewingTicket(numericId)) break;

          playNoticeSound();
          toast("New support message", {
            description: data.ticket_id
              ? `Ticket ${data.ticket_id}`
              : "A ticket received a new reply",
            action:
              numericId != null
                ? {
                    label: "View",
                    onClick: () => router.push(ticketPath(numericId)),
                  }
                : undefined,
          });
          break;
        }
        case "stats_changed": {
          // Marking a ticket as viewed — refresh unread badge/stats without refetching detail.
          invalidateSupportStats();
          break;
        }
        default:
          break;
      }
    };

    try {
      const conn = subscribeSupportAdminChannel(token, {
        received: handleEvent,
        rejected: () => {
          console.warn("[SupportCable] subscription rejected");
        },
      });
      consumer = conn.consumer;
      subscription = conn.subscription;
    } catch (error) {
      console.error("[SupportCable] failed to connect", error);
    }

    return () => {
      try {
        subscription?.unsubscribe();
        consumer?.disconnect();
      } catch {
        // ignore disconnect errors
      }
    };
  }, [token, canView, dispatch, router]);

  return null;
}
