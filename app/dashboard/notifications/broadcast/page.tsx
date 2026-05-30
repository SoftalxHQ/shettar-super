"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  useGetAccountsQuery,
  useSendAccountNotificationMutation,
} from "@/lib/store/services/api";

const SEGMENTS = [
  { value: "verified", label: "Verified customers" },
  { value: "unverified", label: "Unverified customers" },
  { value: "has_booking", label: "Customers with bookings" },
  { value: "suspended", label: "Suspended customers" },
] as const;

export default function BroadcastNotificationsPage() {
  const { admin } = useAuth();
  const canNotify = admin?.admin_role === "super_admin" || admin?.permissions?.accounts?.notify === true;

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [route, setRoute] = useState("");
  const [targetType, setTargetType] = useState<"all" | "segment" | "account_id" | "guests" | "all_devices">("all");
  const [segment, setSegment] = useState<string>("verified");
  const [accountSearch, setAccountSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [sendNotification, { isLoading }] = useSendAccountNotificationMutation();
  const { data: searchResults } = useGetAccountsQuery(
    { page: 1, search: accountSearch },
    { skip: targetType !== "account_id" || accountSearch.length < 2 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canNotify) {
      toast.error("You do not have permission to send notifications");
      return;
    }
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (targetType === "account_id" && !selectedAccountId) {
      toast.error("Select a customer account");
      return;
    }

    try {
      const result = await sendNotification({
        title: title.trim(),
        message: message.trim(),
        target_type: targetType,
        ...(targetType === "segment" ? { segment } : {}),
        ...(targetType === "account_id" && selectedAccountId ? { account_id: selectedAccountId } : {}),
        ...(route.trim() ? { route: route.trim() } : {}),
      }).unwrap();

      if (result.broadcast_id) {
        toast.success(`Broadcast queued (ID ${result.broadcast_id})`);
      } else {
        toast.success("Notification sent");
      }

      setTitle("");
      setMessage("");
      setRoute("");
      setSelectedAccountId(null);
      setAccountSearch("");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to send notification");
    }
  };

  if (!canNotify) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Access denied</p>
          <p className="text-sm text-muted-foreground mt-2">You need the &quot;Send Push Notifications&quot; permission.</p>
          <Link href="/dashboard" className="text-sm text-primary mt-4 inline-block">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Push Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Send in-app and push notifications to customers, anonymous visitors, or everyone.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors text-sm"
            placeholder="Notification title"
            maxLength={120}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors resize-none h-32 text-sm"
            placeholder="Notification body"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Deep link (optional)</label>
          <input
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors text-sm"
            placeholder="/bookings or /(tabs)/bookings"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Audience</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "All customers" },
                { value: "segment", label: "Segment" },
                { value: "account_id", label: "Single customer" },
                { value: "guests", label: "Anonymous (not signed up)" },
                { value: "all_devices", label: "Everyone (accounts + guests)" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTargetType(value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  targetType === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {targetType === "segment" && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Segment</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors text-sm"
            >
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {targetType === "account_id" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Search customer</label>
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => {
                  setAccountSearch(e.target.value);
                  setSelectedAccountId(null);
                }}
                className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors text-sm"
                placeholder="Name, email, or account ID"
              />
            </div>
            {searchResults?.accounts && searchResults.accounts.length > 0 && (
              <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border max-h-48 overflow-y-auto">
                {searchResults.accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${
                      selectedAccountId === account.id ? "bg-primary/10" : ""
                    }`}
                  >
                    <span className="font-semibold">{account.first_name} {account.last_name}</span>
                    <span className="text-muted-foreground ml-2">{account.email}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedAccountId && (
              <p className="text-sm text-green-600 font-medium">Selected account ID: {selectedAccountId}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading
            ? "Sending..."
            : targetType === "account_id"
              ? "Send notification"
              : "Queue broadcast"}
        </button>
      </form>
    </div>
  );
}
