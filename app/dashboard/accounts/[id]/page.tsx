"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useGetAccountQuery,
  useGetAccountReservationsQuery,
  useGetAccountTransactionsQuery,
  useSuspendAccountMutation,
  useActivateAccountMutation,
  useSendAccountNotificationMutation,
  type PushNotificationSuggestion,
} from "@/lib/store/services/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import ImageLightbox from "@/components/ImageLightbox";
import { PushNotificationAiModal } from "@/components/push-notification-ai-modal";
import { normalizeApiMediaUrl } from "@/lib/media-url";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

export default function AccountDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };
  const [activeTab, setActiveTab] = useState("overview");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [reservationPage, setReservationPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);

  const { data, isLoading, isError } = useGetAccountQuery(id);
  const [suspendAccount, { isLoading: isSuspending }] = useSuspendAccountMutation();
  const [activateAccount, { isLoading: isActivating }] = useActivateAccountMutation();

  // Status reason modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState<{
    type: "activate" | "suspend";
    title: string;
    confirmText: string;
    variant: "green" | "red";
  } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyRoute, setNotifyRoute] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const [sendNotification, { isLoading: isSendingNotification }] = useSendAccountNotificationMutation();

  const { data: reservationsData, isLoading: reservationsLoading } = useGetAccountReservationsQuery(
    { id, page: reservationPage, status: bookingStatusFilter },
    { skip: activeTab !== "bookings" }
  );

  const { data: transactionsData, isLoading: transactionsLoading } = useGetAccountTransactionsQuery(
    { id, page: transactionPage, transaction_type: transactionFilter },
    { skip: activeTab !== "transactions" }
  );

  const account = data?.account;
  const reservations = reservationsData?.reservations ?? [];
  const reservationsMeta = reservationsData?.meta;
  const transactions = transactionsData?.transactions ?? [];
  const transactionsMeta = transactionsData?.meta;

  const handleStatusAction = async () => {
    if (!statusAction) return;

    try {
      if (statusAction.type === "suspend") {
        await suspendAccount({ id, reason: statusReason }).unwrap();
        toast.success("Account suspended successfully");
      } else if (statusAction.type === "activate") {
        await activateAccount({ id, reason: statusReason }).unwrap();
        toast.success("Account activated successfully");
      }
      setShowStatusModal(false);
      setStatusReason("");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || `Failed to ${statusAction.type} account`);
    }
  };

  const handleSendNotification = async () => {
    if (!notifyTitle.trim() || !notifyMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }

    try {
      await sendNotification({
        title: notifyTitle.trim(),
        message: notifyMessage.trim(),
        target_type: "account_id",
        account_id: id,
        ...(notifyRoute.trim() ? { route: notifyRoute.trim() } : {}),
      }).unwrap();
      toast.success("Notification sent");
      setShowNotifyModal(false);
      setNotifyTitle("");
      setNotifyMessage("");
      setNotifyRoute("");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to send notification");
    }
  };

  const handleInsertSuggestion = (suggestion: PushNotificationSuggestion) => {
    setNotifyTitle(suggestion.title);
    setNotifyMessage(suggestion.message);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id: "bookings", label: "Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "transactions", label: "Transactions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  ];

  if (isLoading) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading account...</p>
        </div>
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="dash-page flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Account not found</p>
          <Link href="/dashboard/accounts" className="text-sm text-indigo-600 font-semibold mt-2 inline-block hover:text-indigo-700">
            Back to accounts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accounts" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          {account.avatar_url ? (
            <button
              type="button"
              onClick={() => setAvatarPreviewOpen(true)}
              className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Preview customer avatar"
            >
              <img
                src={normalizeApiMediaUrl(account.avatar_url)}
                alt={`${account.first_name} ${account.last_name}`}
                className="w-14 h-14 rounded-full object-cover bg-slate-100 hover:opacity-90 transition-opacity cursor-zoom-in"
              />
            </button>
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-lg">
              {account.first_name[0]}{account.last_name[0]}
            </div>
          )}
          <div>
            <h1 className="font-display text-[1.75rem] md:text-[2rem] font-semibold tracking-tight text-slate-900 leading-none">
              {account.first_name} {account.last_name}
            </h1>
            <p className="text-sm text-slate-500 mt-2">Account ID: {account.account_unique_id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
            account.status === "active" ? "bg-emerald-50 text-emerald-700" :
            account.status === "suspended" ? "bg-red-50 text-red-600" :
            "bg-amber-50 text-amber-700"
          }`}>
            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
          </span>
          {account.email_verified && (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
              ✓ Verified
            </span>
          )}
          {account.status === "suspended" ? (
            can("accounts", "activate") && (
            <button
              onClick={() => {
                setStatusAction({ type: "activate", title: "Activate Account", confirmText: "Activate", variant: "green" });
                setShowStatusModal(true);
              }}
              disabled={isActivating}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Activate
            </button>
            )
          ) : (
            can("accounts", "suspend") && (
            <button
              onClick={() => {
                setStatusAction({ type: "suspend", title: "Suspend Account", confirmText: "Suspend", variant: "red" });
                setShowStatusModal(true);
              }}
              disabled={isSuspending}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Suspend
            </button>
            )
          )}
          {can("accounts", "notify") && (
            <button
              onClick={() => setShowNotifyModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Send notification
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Wallet Balance", value: formatCurrency(account.wallet_balance), icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
          { label: "Total Bookings", value: account.total_bookings, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { label: "Sign-in Count", value: account.sign_in_count, icon: "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" },
          { label: "Last Login", value: account.last_sign_in_at ? formatDate(account.last_sign_in_at) : "Never", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((stat, i) => (
          <div key={i} className={`${panelClass} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 pt-0.5">
                {stat.label}
              </p>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-[1.625rem] font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div
        className="inline-flex flex-wrap gap-1 p-1 rounded-2xl border border-slate-200/90 bg-slate-100/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold tracking-tight transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Personal Information */}
            <div className={`${panelClass} p-5`}>
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Full Name", value: [account.first_name, account.other_name, account.last_name].filter(Boolean).join(" ") },
                  { label: "Email", value: account.email },
                  { label: "Phone Number", value: account.phone_number || "—" },
                  { label: "Gender", value: account.gender || "—" },
                  { label: "Date of Birth", value: account.date_of_birth ? formatDate(account.date_of_birth) : "—" },
                  { label: "Address", value: account.address || "—" },
                  { label: "Zip Code", value: account.zip_code || "—" },
                  { label: "Account Created", value: formatDate(account.created_at) },
                ].map((field, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">{field.label}</p>
                    <p className="font-semibold text-sm text-slate-900">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className={`${panelClass} p-5`}>
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "First Name", value: account.emer_first_name || "—" },
                  { label: "Last Name", value: account.emer_last_name || "—" },
                  { label: "Phone Number", value: account.emer_phone_number || "—" },
                ].map((field, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">{field.label}</p>
                    <p className="font-semibold text-sm text-slate-900">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {(account.dva_account_number || account.paystack_customer_code) && (
              <div className={`${panelClass} p-5`}>
                <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "DVA Account Number", value: account.dva_account_number || "—" },
                    { label: "DVA Bank Name", value: account.dva_bank_name || "—" },
                    { label: "DVA Account Name", value: account.dva_account_name || "—" },
                    { label: "DVA Bank Code", value: account.dva_bank_code || "—" },
                    { label: "Paystack Customer Code", value: account.paystack_customer_code || "—" },
                  ].map((field, i) => (
                    <div key={i} className="p-3.5 bg-slate-50 rounded-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">{field.label}</p>
                      <p className="font-semibold font-mono text-sm text-slate-900">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            <div className={`${panelClass} p-5`}>
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900 mb-4">Account Activity</h3>
              <div className="space-y-1">
                {[
                  { label: "Last Login", value: account.last_sign_in_at ? formatDate(account.last_sign_in_at) : "Never" },
                  { label: "Total Logins", value: account.sign_in_count },
                  { label: "Email Verified", value: account.email_verified ? "Yes" : "No" },
                  { label: "Phone Verified", value: account.phone_verified ? "Yes" : "No" },
                ].map((field, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{field.label}</span>
                    <span className="font-semibold text-sm text-slate-900">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className={`${panelClass} p-5`}>
          <div className="mb-5">
            <select
              className="input max-w-xs rounded-xl"
              value={bookingStatusFilter}
              onChange={(e) => { setBookingStatusFilter(e.target.value); setReservationPage(1); }}
            >
              <option value="all">All Bookings</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {reservationsLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No bookings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 border-b border-slate-100">
                      <th className="pb-3 font-semibold">Booking ID</th>
                      <th className="pb-3 font-semibold">Business & Room</th>
                      <th className="pb-3 font-semibold">Dates</th>
                      <th className="pb-3 font-semibold">Guests</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Payment</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reservations.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/90 transition-colors">
                        <td className="py-3.5">
                          <span className="font-mono text-sm font-semibold text-slate-900">{r.booking_id}</span>
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-sm text-slate-900">{r.business_name}</p>
                          <p className="text-xs text-slate-500">{r.room_type}{r.room_number ? ` · Room ${r.room_number}` : ""}</p>
                        </td>
                        <td className="py-3.5">
                          <p className="text-sm text-slate-900">{formatDate(r.start_date)}</p>
                          <p className="text-xs text-slate-500">to {formatDate(r.end_date)}</p>
                        </td>
                        <td className="py-3.5 text-sm text-slate-900 tabular-nums">{r.guests}</td>
                        <td className="py-3.5 font-semibold text-sm text-slate-900 tabular-nums">{formatCurrency(r.total_amount)}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 capitalize">
                            {r.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                            r.status === "upcoming" ? "bg-blue-50 text-blue-700" :
                            r.status === "active"   ? "bg-emerald-50 text-emerald-700" :
                            r.status === "past"     ? "bg-slate-100 text-slate-600" :
                            "bg-red-50 text-red-600"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reservationsMeta && reservationsMeta.total_pages > 1 && (
                <div className="flex items-center justify-between mt-5">
                  <p className="text-sm text-slate-500">
                    Page {reservationsMeta.current_page} of {reservationsMeta.total_pages} ({reservationsMeta.total_count} total)
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setReservationPage(p => Math.max(1, p - 1))} disabled={reservationsMeta.current_page === 1} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors">Previous</button>
                    <button onClick={() => setReservationPage(p => Math.min(reservationsMeta.total_pages, p + 1))} disabled={reservationsMeta.current_page === reservationsMeta.total_pages} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className={`${panelClass} p-5`}>
          <div className="mb-5">
            <select
              className="input max-w-xs rounded-xl"
              value={transactionFilter}
              onChange={(e) => { setTransactionFilter(e.target.value); setTransactionPage(1); }}
            >
              <option value="all">All Transactions</option>
              <option value="debit">Debits</option>
              <option value="income">Income</option>
              <option value="refund">Refunds</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
          </div>

          {transactionsLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 border-b border-slate-100">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Description</th>
                      <th className="pb-3 font-semibold">Payment</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((txn) => {
                      const isCredit = ["income", "refund"].includes(txn.transaction_type);
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-3.5 text-sm text-slate-900">{formatDate(txn.created_at)}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 capitalize">
                              {txn.transaction_type.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3.5 text-sm text-slate-500 max-w-xs truncate">{txn.description || "—"}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 capitalize">
                              {txn.payment_method || "—"}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`font-semibold text-sm tabular-nums ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                              {isCredit ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                              txn.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                              txn.status === "pending"   ? "bg-amber-50 text-amber-700" :
                              "bg-red-50 text-red-600"
                            }`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {transactionsMeta && transactionsMeta.total_pages > 1 && (
                <div className="flex items-center justify-between mt-5">
                  <p className="text-sm text-slate-500">
                    Page {transactionsMeta.current_page} of {transactionsMeta.total_pages} ({transactionsMeta.total_count} total)
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setTransactionPage(p => Math.max(1, p - 1))} disabled={transactionsMeta.current_page === 1} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors">Previous</button>
                    <button onClick={() => setTransactionPage(p => Math.min(transactionsMeta.total_pages, p + 1))} disabled={transactionsMeta.current_page === transactionsMeta.total_pages} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* Status Reason Modal */}
      {showStatusModal && statusAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">{statusAction.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {statusAction.type === "suspend" && "You are about to suspend this customer account. They will no longer be able to sign in or make bookings."}
                {statusAction.type === "activate" && "You are about to reactivate this customer account."}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Reason / Notes {statusAction.type === "suspend" ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-300 transition-colors resize-none h-32 text-sm text-slate-900"
                  placeholder="Enter reason for this action..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusAction}
                disabled={(isSuspending || isActivating) || (statusAction.type === "suspend" && !statusReason.trim()) || (statusAction.type === "suspend" ? !can("accounts", "suspend") : !can("accounts", "activate"))}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 ${
                  statusAction.variant === "red" ? "bg-red-500" : "bg-green-600"
                }`}
              >
                {(isSuspending || isActivating) ? "Processing..." : statusAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowNotifyModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.12)] w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-900">Send notification</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Deliver an in-app and push notification to {account.first_name} {account.last_name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(true)}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold"
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
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Title</label>
                <input
                  type="text"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-300 transition-colors text-sm text-slate-900"
                  placeholder="Notification title"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Message</label>
                <textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-300 transition-colors resize-none h-28 text-sm text-slate-900"
                  placeholder="Notification body"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Deep link (optional)</label>
                <input
                  type="text"
                  value={notifyRoute}
                  onChange={(e) => setNotifyRoute(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-300 transition-colors text-sm text-slate-900"
                  placeholder="/bookings"
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={isSendingNotification || !notifyTitle.trim() || !notifyMessage.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSendingNotification ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PushNotificationAiModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        audienceLabel={`${account.first_name} ${account.last_name}`}
        context={{
          target_type: "account_id",
          audience_label: `${account.first_name} ${account.last_name}`,
        }}
        onInsert={handleInsertSuggestion}
      />

      {avatarPreviewOpen && (account.avatar_full_url || account.avatar_url) && (
        <ImageLightbox
          images={[normalizeApiMediaUrl(account.avatar_full_url || account.avatar_url)]}
          index={0}
          alt={`${account.first_name} ${account.last_name}`}
          onClose={() => setAvatarPreviewOpen(false)}
        />
      )}
    </div>
  );
}
