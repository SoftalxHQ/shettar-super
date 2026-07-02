"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { PushNotificationAiModal } from "@/components/push-notification-ai-modal";
import { Pagination } from "@/components/ui/pagination";
import {
  useGetAccountsQuery,
  useGetPushDevicesQuery,
  useSendAccountNotificationMutation,
  type PushNotificationSuggestion,
} from "@/lib/store/services/api";

const SEGMENTS = [
  { value: "verified", label: "Verified customers" },
  { value: "unverified", label: "Unverified customers" },
  { value: "has_booking", label: "Customers with bookings" },
  { value: "suspended", label: "Suspended customers" },
] as const;

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All customers" },
  { value: "segment", label: "Segment" },
  { value: "account_id", label: "Single customer" },
  { value: "guests", label: "Anonymous (not signed up)" },
  { value: "all_devices", label: "Everyone (accounts + guests)" },
] as const;

const PLATFORM_LABELS: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  web: "Web",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

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
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const [devicePage, setDevicePage] = useState(1);
  const [deviceKind, setDeviceKind] = useState<"all" | "account" | "guest">("all");
  const [devicePlatform, setDevicePlatform] = useState<"all" | "ios" | "android" | "web">("all");
  const [deviceStatus, setDeviceStatus] = useState<"all" | "active" | "disabled">("active");

  const [sendNotification, { isLoading }] = useSendAccountNotificationMutation();
  const { data: searchResults } = useGetAccountsQuery(
    { page: 1, search: accountSearch },
    { skip: targetType !== "account_id" || accountSearch.length < 2 }
  );
  const { data: pushDevices, isLoading: devicesLoading } = useGetPushDevicesQuery(
    { page: devicePage, kind: deviceKind, platform: devicePlatform, status: deviceStatus },
    { skip: !canNotify }
  );

  const audienceLabel = useMemo(() => {
    if (targetType === "segment") {
      const match = SEGMENTS.find((s) => s.value === segment);
      return match ? `Segment · ${match.label}` : "Segment";
    }
    const match = AUDIENCE_OPTIONS.find((o) => o.value === targetType);
    return match?.label ?? targetType;
  }, [targetType, segment]);

  const aiContext = useMemo(
    () => ({
      target_type: targetType,
      segment: targetType === "segment" ? segment : null,
      audience_label: audienceLabel,
    }),
    [targetType, segment, audienceLabel]
  );

  const handleInsertSuggestion = (suggestion: PushNotificationSuggestion) => {
    setTitle(suggestion.title);
    setMessage(suggestion.message);
  };

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

  const stats = pushDevices?.stats;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Push Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Signed-up customers receive in-app history and push. Anonymous visitors receive push only
          (local device history where supported).
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active devices</p>
            <p className="text-3xl font-bold mt-2">{stats.active.total.toLocaleString()}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Signed-up accounts</p>
            <p className="text-3xl font-bold mt-2">{stats.active.account.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              iOS {stats.active.account.ios} · Android {stats.active.account.android} · Web {stats.active.account.web}
            </p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Guest devices</p>
            <p className="text-3xl font-bold mt-2">{stats.active.guest.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              iOS {stats.active.guest.ios} · Android {stats.active.guest.android} · Web {stats.active.guest.web}
            </p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Web push (active)</p>
            <p className="text-3xl font-bold mt-2">{stats.active.web.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.disabled.total} disabled total</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 pb-2">
          <h2 className="text-lg font-bold">Compose notification</h2>
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold"
            title="Generate with AI"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.847-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
            AI
          </button>
        </div>

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
            {AUDIENCE_OPTIONS.map(({ value, label }) => (
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

        {(targetType === "guests" || targetType === "all_devices") && (
          <p className="text-sm text-muted-foreground bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3">
            {targetType === "guests"
              ? "Anonymous visitors receive push notifications only. They will not get server-side in-app history."
              : "Accounts receive in-app history and push. Guest devices receive push only."}
          </p>
        )}

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

      <div className="glass rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50 space-y-4">
          <div>
            <h2 className="text-xl font-bold">Registered devices</h2>
            <p className="text-sm text-muted-foreground mt-1">Active and disabled push tokens for signed-up accounts and guests.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "All kinds" },
                { value: "account", label: "Signed-up" },
                { value: "guest", label: "Guest" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setDeviceKind(value); setDevicePage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  deviceKind === value ? "bg-primary text-primary-foreground" : "bg-slate-100 dark:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
            {(
              [
                { value: "all", label: "All platforms" },
                { value: "ios", label: "iOS" },
                { value: "android", label: "Android" },
                { value: "web", label: "Web" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setDevicePlatform(value); setDevicePage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  devicePlatform === value ? "bg-primary/15 text-primary border border-primary/30" : "bg-slate-100 dark:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
            {(
              [
                { value: "active", label: "Active" },
                { value: "disabled", label: "Disabled" },
                { value: "all", label: "All statuses" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setDeviceStatus(value); setDevicePage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  deviceStatus === value ? "bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-slate-100 dark:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4 font-bold">Kind</th>
                <th className="px-6 py-4 font-bold">Platform</th>
                <th className="px-6 py-4 font-bold">Owner</th>
                <th className="px-6 py-4 font-bold">Token</th>
                <th className="px-6 py-4 font-bold">Last seen</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {devicesLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Loading devices…</td>
                </tr>
              )}
              {!devicesLoading && pushDevices?.devices?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No devices match these filters.</td>
                </tr>
              )}
              {pushDevices?.devices?.map((device) => (
                <tr key={device.id} className="border-b border-border/30 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-6 py-4 capitalize">{device.kind}</td>
                  <td className="px-6 py-4">{PLATFORM_LABELS[device.platform] ?? device.platform}</td>
                  <td className="px-6 py-4">
                    {device.kind === "account" && device.account ? (
                      <div>
                        <Link href={`/dashboard/accounts/${device.account.id}`} className="font-semibold hover:text-primary">
                          {device.account.first_name} {device.account.last_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{device.account.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground font-mono text-xs">{device.guest_id || "—"}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{device.token_preview}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(device.last_seen_at)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                        device.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {device.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pushDevices?.meta && pushDevices.meta.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-border/50">
            <Pagination
              currentPage={pushDevices.meta.current_page}
              totalPages={pushDevices.meta.total_pages}
              totalCount={pushDevices.meta.total_count}
              onPageChange={setDevicePage}
            />
          </div>
        )}
      </div>

      <PushNotificationAiModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        audienceLabel={audienceLabel}
        context={aiContext}
        onInsert={handleInsertSuggestion}
      />
    </div>
  );
}
