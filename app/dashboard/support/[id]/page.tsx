"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useGetSupportTicketQuery,
  useReplyToSupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
  type SupportMessage,
} from "@/lib/store/services/api";
import {
  subscribeSupportTicketChannel,
  type SupportTicketCableEvent,
  type SupportTicketChannelHandle,
} from "@/lib/support-tickets-cable";
import {
  hydrateNotificationSoundEnabled,
  isNotificationSoundEnabled,
  playNotificationTone,
} from "@/lib/notification-sound";
import AssignTicketDialog from "@/components/support/AssignTicketDialog";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

/** Chat-style timestamp: time only for today's messages, date + time otherwise. */
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}

export default function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;
  const adminId = useSelector((state: RootState) => state.auth.admin?.id);
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const { data, isLoading, isError, refetch } = useGetSupportTicketQuery(ticketId);
  const [replyMessage, setReplyMessage] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [liveMessages, setLiveMessages] = useState<SupportMessage[]>([]);
  const [userTyping, setUserTyping] = useState<string | null>(null);

  const token = useSelector((state: RootState) => state.auth.token);
  const channelRef = useRef<SupportTicketChannelHandle | null>(null);
  const typingClearTimer = useRef<number | null>(null);
  const lastTypingSentAt = useRef(0);

  const [replyToTicket, { isLoading: isReplying }] = useReplyToSupportTicketMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateSupportTicketStatusMutation();

  const ticket = data?.ticket;
  const fetchedMessages = data?.messages;

  const messages = useMemo(() => {
    const base = fetchedMessages ?? [];
    const seen = new Set(base.map((m) => m.id));
    return [...base, ...liveMessages.filter((m) => !seen.has(m.id))];
  }, [fetchedMessages, liveMessages]);

  // Live per-ticket room: new messages, status/assignment changes, typing.
  useEffect(() => {
    const cableTicketId = ticket?.ticket_id;
    if (!token || !cableTicketId) return;

    hydrateNotificationSoundEnabled();

    const handle = subscribeSupportTicketChannel(token, cableTicketId, {
      received: (event: SupportTicketCableEvent) => {
        if (event.type === "new_message" && event.message) {
          if (event.message.sender_type === "User") {
            setUserTyping(null);
            if (isNotificationSoundEnabled()) void playNotificationTone();
          }
          setLiveMessages((prev) =>
            prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]
          );
        } else if (event.type === "status_changed" || event.type === "assigned") {
          refetch();
        } else if (event.type === "typing" && event.sender_role === "business") {
          setUserTyping(event.sender_name || "User");
          if (typingClearTimer.current) window.clearTimeout(typingClearTimer.current);
          typingClearTimer.current = window.setTimeout(() => setUserTyping(null), 3000);
        }
      },
    });
    channelRef.current = handle;

    return () => {
      handle.unsubscribe();
      channelRef.current = null;
      if (typingClearTimer.current) window.clearTimeout(typingClearTimer.current);
    };
  }, [token, ticket?.ticket_id, refetch]);

  const isClosedOrResolved = ticket?.status === "resolved" || ticket?.status === "closed";

  const handleReplyChange = (value: string) => {
    setReplyMessage(value);
    const now = Date.now();
    if (value.trim() && now - lastTypingSentAt.current > 2000) {
      lastTypingSentAt.current = now;
      channelRef.current?.sendTyping();
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      await replyToTicket({ id: ticketId, body: replyMessage }).unwrap();
      setReplyMessage("");
      toast.success("Reply sent");
      refetch();
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === ticket?.status) return;
    try {
      await updateStatus({ id: ticketId, status: newStatus }).unwrap();
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-background min-h-screen pt-24">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-8 bg-background min-h-screen">
        <p className="text-red-500">Error loading ticket.</p>
        <Link href="/dashboard/support" className="text-primary hover:underline mt-4 inline-block">
          &larr; Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Link
        href="/dashboard/support"
        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Support Tickets
      </Link>

      {/* Ticket Header */}
      <div className="glass p-6 rounded-3xl flex flex-col md:flex-row md:justify-between items-start gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono font-bold text-muted-foreground">{ticket.ticket_id}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ticket.priority === "high" ? "bg-red-100 text-red-600" :
                ticket.priority === "medium" ? "bg-orange-100 text-orange-600" :
                  "bg-blue-100 text-blue-600"
              }`}>
              {ticket.priority.toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ticket.status === "open" ? "bg-orange-100 text-orange-600" :
                ticket.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                  ticket.status === "closed" ? "bg-gray-100 text-gray-600" :
                  "bg-green-100 text-green-600"
              }`}>
              {ticket.status.replace("_", " ").toUpperCase()}
            </span>
            {ticket.category === "business_verification" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                VERIFICATION
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-muted-foreground mt-2">{ticket.description}</p>
          {ticket.category === "business_verification" && (ticket.business?.business_unique_id || ticket.business?.id) && (
            <Link
              href={`/dashboard/businesses/${ticket.business.business_unique_id || ticket.business.id}`}
              className="inline-flex mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Review business profile →
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3 min-w-[180px]">
          {/* Status dropdown */}
          {can("support_tickets", "update_status") && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="input text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").charAt(0).toUpperCase() + s.replace("_", " ").slice(1)}
                </option>
              ))}
            </select>
          </div>
          )}

          {ticket.status === "open" && can("support_tickets", "assign") && (
            <button
              onClick={() => setAssignDialogOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
            >
              Assign
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages / Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold">Conversation</h3>

            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No messages yet. Send a reply below.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {messages.map((msg) => {
                  const isAdmin = msg.sender_type === "Admin";
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${isAdmin ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                        <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                          <span className="font-bold">{msg.sender?.first_name || "System"}</span>
                          <span>•</span>
                          <span>{formatMessageTime(msg.created_at)}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {userTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                </span>
                {userTyping} is typing…
              </div>
            )}

            {/* Reply block */}
            {can("support_tickets", "reply") && (
            <form onSubmit={handleReplySubmit} className="mt-6 border-t border-border pt-6">
              <textarea
                value={replyMessage}
                onChange={(e) => handleReplyChange(e.target.value)}
                placeholder={isClosedOrResolved ? "Replies are not available for resolved or closed tickets." : "Type your reply to the user..."}
                className="w-full input min-h-[100px] resize-y mb-3"
                disabled={isReplying || isClosedOrResolved}
              />
              {isClosedOrResolved ? (
                <p className="text-sm text-muted-foreground italic">
                  This ticket is {ticket.status}. Replies are disabled.
                </p>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isReplying || !replyMessage.trim()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
                  >
                    {isReplying ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              )}
            </form>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold">Details</h3>

            <div>
              <p className="text-sm text-muted-foreground">User</p>
              <p className="font-semibold">{ticket.user?.first_name} {ticket.user?.last_name}</p>
              <p className="text-sm">{ticket.user?.email}</p>
            </div>

            {ticket.business && (
              <div>
                <p className="text-sm text-muted-foreground">Business</p>
                <p className="font-semibold">{ticket.business.name}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              {ticket.assigned_to ? (
                <p className="font-semibold">{ticket.assigned_to.first_name} {ticket.assigned_to.last_name}</p>
              ) : (
                <p className="text-sm italic text-muted-foreground">Unassigned</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-semibold">{new Date(ticket.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <AssignTicketDialog
        open={assignDialogOpen}
        ticketId={ticketId}
        ticketLabel={ticket.subject}
        currentAdminId={adminId}
        onClose={() => setAssignDialogOpen(false)}
        onAssigned={() => refetch()}
      />
    </div>
  );
}
