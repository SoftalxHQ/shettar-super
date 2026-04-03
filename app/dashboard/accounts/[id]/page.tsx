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
} from "@/lib/store/services/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";

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

  const tabs = [
    { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id: "bookings", label: "Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "transactions", label: "Transactions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  ];

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading account...</p>
        </div>
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Account not found</p>
          <Link href="/dashboard/accounts" className="text-sm text-primary mt-2 inline-block">
            Back to accounts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accounts" className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{account.first_name} {account.last_name}</h1>
            <p className="text-muted-foreground mt-1">Account ID: {account.account_unique_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
            account.status === "active" ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
            account.status === "suspended" ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
            "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
          }`}>
            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
          </span>
          {account.email_verified && (
            <span className="px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30">
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
              className="px-4 py-2 rounded-full text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
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
              className="px-4 py-2 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Suspend
            </button>
            )
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Wallet Balance", value: formatCurrency(account.wallet_balance), icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", color: "bg-green-100 text-green-600 dark:bg-green-900/30" },
          { label: "Total Bookings", value: account.total_bookings, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" },
          { label: "Sign-in Count", value: account.sign_in_count, icon: "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
          { label: "Last Login", value: account.last_sign_in_at ? formatDate(account.last_sign_in_at) : "Never", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className={`inline-flex p-3 rounded-2xl mb-3 ${stat.color}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="glass rounded-3xl p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                    <p className="font-semibold">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "First Name", value: account.emer_first_name || "—" },
                  { label: "Last Name", value: account.emer_last_name || "—" },
                  { label: "Phone Number", value: account.emer_phone_number || "—" },
                ].map((field, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                    <p className="font-semibold">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {(account.dva_account_number || account.paystack_customer_code) && (
              <div className="glass p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "DVA Account Number", value: account.dva_account_number || "—" },
                    { label: "DVA Bank Name", value: account.dva_bank_name || "—" },
                    { label: "DVA Account Name", value: account.dva_account_name || "—" },
                    { label: "DVA Bank Code", value: account.dva_bank_code || "—" },
                    { label: "Paystack Customer Code", value: account.paystack_customer_code || "—" },
                  ].map((field, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                      <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                      <p className="font-semibold font-mono text-sm">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-4">Account Activity</h3>
              <div className="space-y-3">
                {[
                  { label: "Last Login", value: account.last_sign_in_at ? formatDate(account.last_sign_in_at) : "Never" },
                  { label: "Total Logins", value: account.sign_in_count },
                  { label: "Email Verified", value: account.email_verified ? "Yes" : "No" },
                  { label: "Phone Verified", value: account.phone_verified ? "Yes" : "No" },
                ].map((field, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="font-semibold text-sm">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className="glass p-6 rounded-3xl">
          <div className="mb-6">
            <select
              className="input max-w-xs"
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
            <div className="text-center py-12 text-muted-foreground">
              <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No bookings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-4 font-medium">Booking ID</th>
                      <th className="pb-4 font-medium">Business & Room</th>
                      <th className="pb-4 font-medium">Dates</th>
                      <th className="pb-4 font-medium">Guests</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Payment</th>
                      <th className="pb-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reservations.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-4">
                          <span className="font-mono text-sm font-bold">{r.booking_id}</span>
                        </td>
                        <td className="py-4">
                          <p className="font-semibold text-sm">{r.business_name}</p>
                          <p className="text-xs text-muted-foreground">{r.room_type}{r.room_number ? ` · Room ${r.room_number}` : ""}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm">{formatDate(r.start_date)}</p>
                          <p className="text-xs text-muted-foreground">to {formatDate(r.end_date)}</p>
                        </td>
                        <td className="py-4 text-sm">{r.guests}</td>
                        <td className="py-4 font-bold text-sm">{formatCurrency(r.total_amount)}</td>
                        <td className="py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 capitalize">
                            {r.payment_method}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                            r.status === "upcoming" ? "bg-blue-100 text-blue-600" :
                            r.status === "active"   ? "bg-green-100 text-green-600" :
                            r.status === "past"     ? "bg-slate-100 text-slate-600" :
                            "bg-red-100 text-red-600"
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
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Page {reservationsMeta.current_page} of {reservationsMeta.total_pages} ({reservationsMeta.total_count} total)
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setReservationPage(p => Math.max(1, p - 1))} disabled={reservationsMeta.current_page === 1} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Previous</button>
                    <button onClick={() => setReservationPage(p => Math.min(reservationsMeta.total_pages, p + 1))} disabled={reservationsMeta.current_page === reservationsMeta.total_pages} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="glass p-6 rounded-3xl">
          <div className="mb-6">
            <select
              className="input max-w-xs"
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
            <div className="text-center py-12 text-muted-foreground">
              <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Type</th>
                      <th className="pb-4 font-medium">Description</th>
                      <th className="pb-4 font-medium">Payment</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((txn) => {
                      const isCredit = ["income", "refund"].includes(txn.transaction_type);
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-4 text-sm">{formatDate(txn.created_at)}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 capitalize">
                              {txn.transaction_type.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground max-w-xs truncate">{txn.description || "—"}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 capitalize">
                              {txn.payment_method || "—"}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`font-bold text-sm ${isCredit ? "text-green-600" : "text-red-600"}`}>
                              {isCredit ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                              txn.status === "completed" ? "bg-green-100 text-green-600" :
                              txn.status === "pending"   ? "bg-orange-100 text-orange-600" :
                              "bg-red-100 text-red-600"
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
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Page {transactionsMeta.current_page} of {transactionsMeta.total_pages} ({transactionsMeta.total_count} total)
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setTransactionPage(p => Math.max(1, p - 1))} disabled={transactionsMeta.current_page === 1} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Previous</button>
                    <button onClick={() => setTransactionPage(p => Math.min(transactionsMeta.total_pages, p + 1))} disabled={transactionsMeta.current_page === transactionsMeta.total_pages} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Next</button>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold">{statusAction.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {statusAction.type === "suspend" && "You are about to suspend this customer account. They will no longer be able to sign in or make bookings."}
                {statusAction.type === "activate" && "You are about to reactivate this customer account."}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  Reason / Notes {statusAction.type === "suspend" ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors resize-none h-32 text-sm"
                  placeholder="Enter reason for this action..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusAction}
                disabled={(isSuspending || isActivating) || (statusAction.type === "suspend" && !statusReason.trim()) || (statusAction.type === "suspend" ? !can("accounts", "suspend") : !can("accounts", "activate"))}
                className={`flex-1 px-4 py-3 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 ${
                  statusAction.variant === "red" ? "bg-red-500" : "bg-green-600"
                }`}
              >
                {(isSuspending || isActivating) ? "Processing..." : statusAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
