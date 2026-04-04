"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useGetBusinessQuery,
  useGetBusinessTransactionsQuery,
  useGetBusinessReservationsQuery,
  useGetBusinessAnalyticsQuery,
  useSuspendBusinessMutation,
  useActivateBusinessMutation,
  useVerifyBusinessMutation,
  useVerifyBankAccountMutation,
  useRejectBankAccountMutation,
  useBanBankAccountMutation,
  useUnbanBankAccountMutation,
  useSetBusinessCommissionMutation,
  useSetBusinessCancellationFeeMutation,
} from "@/lib/store/services/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { admin } = useAuth();
  const can = (section: keyof AdminPermissions, action: string): boolean => {
    if (admin?.admin_role === "super_admin") return true;
    return (admin?.permissions?.[section] as Record<string, boolean> | undefined)?.[action] === true;
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  // Transactions tab state
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [transactionPage, setTransactionPage] = useState(1);

  // Bookings tab state
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [reservationPage, setReservationPage] = useState(1);

  // Reject flow state — removed (now handled by status modal)

  // RTK Query hooks
  const { data, isLoading, isError, refetch } = useGetBusinessQuery(id, { refetchOnMountOrArgChange: true });
  const [suspendBusiness, { isLoading: isSuspending }] = useSuspendBusinessMutation();
  const [activateBusiness, { isLoading: isActivating }] = useActivateBusinessMutation();
  const [verifyBusiness, { isLoading: isVerifying }] = useVerifyBusinessMutation();
  const [verifyBankAccount, { isLoading: isVerifyingBank }] = useVerifyBankAccountMutation();
  const [rejectBankAccount, { isLoading: isRejectingBank }] = useRejectBankAccountMutation();
  const [banBankAccount, { isLoading: isBanningBank }] = useBanBankAccountMutation();
  const [unbanBankAccount, { isLoading: isUnbanningBank }] = useUnbanBankAccountMutation();
  const [setBusinessCommission, { isLoading: isSettingCommission }] = useSetBusinessCommissionMutation();
  const [setBusinessCancellationFee, { isLoading: isSettingCancellationFee }] = useSetBusinessCancellationFeeMutation();

  // Commission state
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [commissionInput, setCommissionInput] = useState("");

  // Cancellation fee state
  const [showCancellationFeeForm, setShowCancellationFeeForm] = useState(false);
  const [cancellationFeeInput, setCancellationFeeInput] = useState("");

  // Bank account reject modal state
  const [rejectingBankId, setRejectingBankId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Bank account ban modal state
  const [banningBankId, setBanningBankId] = useState<number | null>(null);
  const [banReason, setBanReason] = useState("");

  // Bank account unban modal state
  const [unbanningBankId, setUnbanningBankId] = useState<number | null>(null);
  const [unbanReason, setUnbanReason] = useState("");

  // Status reason modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState<{
    type: "activate" | "suspend" | "verify" | "reject";
    title: string;
    confirmText: string;
    variant: "green" | "red" | "orange";
  } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const { data: transactionsData, isLoading: transactionsLoading } = useGetBusinessTransactionsQuery(
    { id, page: transactionPage, transaction_type: transactionTypeFilter },
    { skip: activeTab !== "transactions" }
  );

  const { data: reservationsData, isLoading: reservationsLoading } = useGetBusinessReservationsQuery(
    { id, page: reservationPage, status: bookingStatusFilter },
    { skip: activeTab !== "bookings" }
  );

  const { data: analyticsData, isLoading: analyticsLoading } = useGetBusinessAnalyticsQuery(id, {
    skip: activeTab !== "analytics",
  });

  const business = data?.business;
  const transactions = transactionsData?.transactions ?? [];
  const transactionsMeta = transactionsData?.meta;
  const reservations = reservationsData?.reservations ?? [];
  const reservationsMeta = reservationsData?.meta;

  // Mutation handlers
  const handleStatusAction = async () => {
    if (!statusAction) return;

    try {
      if (statusAction.type === "suspend") {
        await suspendBusiness({ id, reason: statusReason }).unwrap();
        toast.success("Business suspended successfully");
      } else if (statusAction.type === "activate") {
        await activateBusiness({ id, reason: statusReason }).unwrap();
        toast.success("Business activated successfully");
      } else if (statusAction.type === "verify") {
        await verifyBusiness({ id, status: "approved", reason: statusReason }).unwrap();
        toast.success("Business verified successfully");
      } else if (statusAction.type === "reject") {
        await verifyBusiness({ id, status: "rejected", reason: statusReason }).unwrap();
        toast.success("Business rejected");
      }
      setShowStatusModal(false);
      setStatusReason("");
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || `Failed to ${statusAction.type} business`);
    }
  };

  const handleVerifyBank = async (bankAccountId: number) => {
    try {
      await verifyBankAccount({ businessId: id, id: bankAccountId }).unwrap();
      toast.success("Bank account verified successfully");
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to verify bank account");
    }
  };

  const handleRejectBank = async () => {
    if (!rejectingBankId || !rejectReason.trim()) return;
    try {
      await rejectBankAccount({ businessId: id, id: rejectingBankId, reason: rejectReason.trim() }).unwrap();
      toast.success("Bank account rejected");
      setRejectingBankId(null);
      setRejectReason("");
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to reject bank account");
    }
  };

  const handleBanBank = async () => {
    if (!banningBankId || !banReason.trim()) return;
    try {
      await banBankAccount({ businessId: id, id: banningBankId, reason: banReason.trim() }).unwrap();
      toast.success("Bank account banned");
      setBanningBankId(null);
      setBanReason("");
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to ban bank account");
    }
  };

  const handleUnbanBank = async () => {
    if (!unbanningBankId || !unbanReason.trim()) return;
    try {
      await unbanBankAccount({ businessId: id, id: unbanningBankId, reason: unbanReason.trim() }).unwrap();
      toast.success("Bank account unbanned");
      setUnbanningBankId(null);
      setUnbanReason("");
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to unban bank account");
    }
  };

  const handleSetCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rate = commissionInput.trim() === "" ? null : parseFloat(commissionInput);
      await setBusinessCommission({ id, commission_rate: rate }).unwrap();
      toast.success(rate === null ? "Commission rate cleared" : `Commission rate set to ${rate}%`);
      setShowCommissionForm(false);
      setCommissionInput("");
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to update commission rate");
    }
  };

  const handleSetCancellationFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fee = cancellationFeeInput.trim() === "" ? null : parseFloat(cancellationFeeInput);
      await setBusinessCancellationFee({ id, cancellation_fee_percentage: fee }).unwrap();
      toast.success(fee === null ? "Cancellation fee cleared" : `Cancellation fee set to ${fee}%`);
      setShowCancellationFeeForm(false);
      setCancellationFeeInput("");
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error || "Failed to update cancellation fee");
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return "M7 11l5-5m0 0l5 5m-5-5v12";
      case "withdrawal":
        return "M17 13l-5 5m0 0l-5-5m5 5V6";
      case "refund":
        return "M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z";
      default:
        return "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading business...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !business) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Business not found</p>
          <Link href="/dashboard/businesses" className="text-sm text-primary mt-2 inline-block">
            Back to businesses
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = business.verification_status === "approved";
  const isMutationLoading = isSuspending || isActivating || isVerifying || isVerifyingBank;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/businesses" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold">{business.name}</h1>
            {isVerified && (
              <svg className="w-7 h-7 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{business.business_unique_id}</span>
            <span>•</span>
            <span>{business.city}, {business.state}</span>
            <span>•</span>
            <span>Registered {formatDate(business.created_at)}</span>
          </div>
          {business.latitude && business.longitude && (
            <button
              onClick={() => setShowMapModal(true)}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              View Location on Map
            </button>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            {/* Verify button — only when pending */}
            {business.verification_status === "pending" && can("businesses", "verify") && (
              <button
                onClick={() => {
                  setStatusAction({ type: "verify", title: "Verify Business", confirmText: "Verify", variant: "green" });
                  setShowStatusModal(true);
                }}
                disabled={isMutationLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verify Business
              </button>
            )}
            {/* Reject button — only when pending */}
            {business.verification_status === "pending" && can("businesses", "verify") && (
              <button
                onClick={() => {
                  setStatusAction({ type: "reject", title: "Reject Business", confirmText: "Reject", variant: "orange" });
                  setShowStatusModal(true);
                }}
                disabled={isMutationLoading}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold disabled:opacity-50"
              >
                Reject
              </button>
            )}
            {/* Suspend / Activate */}
            {business.suspended ? (
              can("businesses", "activate") && (
              <button
                onClick={() => {
                  setStatusAction({ type: "activate", title: "Activate Business", confirmText: "Activate", variant: "green" });
                  setShowStatusModal(true);
                }}
                disabled={isMutationLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold disabled:opacity-50"
              >
                Activate
              </button>
              )
            ) : (
              can("businesses", "suspend") && (
              <button
                onClick={() => {
                  setStatusAction({ type: "suspend", title: "Suspend Business", confirmText: "Suspend", variant: "red" });
                  setShowStatusModal(true);
                }}
                disabled={isMutationLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold disabled:opacity-50"
              >
                Suspend
              </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass p-2 rounded-2xl flex gap-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
          { id: "financials", label: "Financials", icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" },
          { id: "transactions", label: "Transactions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
          { id: "analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
          { id: "rooms", label: "Rooms & Types", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          { id: "bookings", label: "Recent Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { id: "verification", label: "Verification", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Total Revenue", value: formatCurrency(business.total_revenue ?? 0), icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z", color: "text-primary" },
                { label: "Reservations", value: business.reservations_count, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-blue-600" },
                { label: "Total Rooms", value: business.rooms_count, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "text-green-600" },
              ].map((stat, i) => (
                <div key={i} className="glass p-6 rounded-3xl">
                  <div className={`p-3 bg-primary/10 rounded-2xl w-fit mb-3 ${stat.color}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Business Information */}
            <div className="glass p-6 rounded-3xl space-y-4">
              <h3 className="text-xl font-bold">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Category", value: business.category || "—" },
                  { label: "Check-in Time", value: business.check_in },
                  { label: "Check-out Time", value: business.check_out },
                  { label: "City", value: business.city },
                  { label: "State", value: business.state },
                  { label: "ZIP Code", value: business.zip_code || "—" },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
              {business.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{business.description}</p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {business.amenities && Object.keys(business.amenities).length > 0 && (
              <div className="glass p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(business.amenities)
                    .filter(([, value]) => value)
                    .map(([key]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="capitalize">{key.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Owners */}
            <div className="glass p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Business Owners</h3>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                  {business.owners.length} Owner{business.owners.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-3">
                {business.owners.map((owner) => (
                  <div key={owner.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0">
                      {owner.first_name[0]}{owner.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{owner.first_name} {owner.last_name}</p>
                        {owner.is_primary && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-bold">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
                      {owner.phone_number && <p className="text-xs text-muted-foreground">{owner.phone_number}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-3xl space-y-3">
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <button
                onClick={() => setActiveTab("transactions")}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
              >
                View Transactions
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
              >
                View Bookings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Financials Tab ── */}
      {activeTab === "financials" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balances */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold">Account Balances</h3>
            {[
              { label: "Withdrawable Balance", amount: business.withdrawable_balance, color: "text-green-600" },
              { label: "Pending Balance", amount: business.pending_balance, color: "text-orange-600" },
              { label: "Refund Balance", amount: business.refund_balance, color: "text-blue-600" },
              { label: "Cash Balance", amount: business.cash_balance, color: "text-purple-600" },
              { label: "POS Balance", amount: business.pos_balance, color: "text-indigo-600" },
              { label: "Onsite Payment Balance", amount: business.onsite_payment_balance, color: "text-pink-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <span className="text-sm font-medium">{item.label}</span>
                <span className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>

          {/* Bank Accounts */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold">Bank Accounts</h3>
            {business.bank_accounts.length === 0 && (
              <p className="text-sm text-muted-foreground">No bank accounts registered.</p>
            )}
            {business.bank_accounts.map((bank) => (
              <div key={bank.id} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{bank.bank_name}</p>
                    <p className="text-sm text-muted-foreground">{bank.account_number}</p>
                    <p className="text-xs text-muted-foreground">{bank.account_name}</p>
                  </div>
                  {bank.status === "verified" ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                      {can("businesses", "verify") && (
                      <button
                        onClick={() => { setBanningBankId(bank.id); setBanReason(""); }}
                        disabled={isBanningBank || isMutationLoading}
                        className="px-3 py-1 bg-slate-500 text-white rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        Ban
                      </button>
                      )}
                    </div>
                  ) : bank.status === "banned" ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">Banned</span>
                      {can("businesses", "verify") && (
                      <button
                        onClick={() => { setUnbanningBankId(bank.id); setUnbanReason(""); }}
                        disabled={isUnbanningBank || isMutationLoading}
                        className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        Unban
                      </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">Pending</span>
                      {can("businesses", "verify") && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyBank(bank.id)}
                          disabled={isVerifyingBank || isRejectingBank || isMutationLoading}
                          className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-50"
                        >
                          {isVerifyingBank ? "..." : "Verify"}
                        </button>
                        <button
                          onClick={() => { setRejectingBankId(bank.id); setRejectReason(""); }}
                          disabled={isVerifyingBank || isRejectingBank || isMutationLoading}
                          className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                      )}
                    </div>
                  )}
                </div>
                {bank.status === "banned" && bank.ban_reason && (
                  <p className="text-xs text-slate-500 mt-1">Ban reason: {bank.ban_reason}</p>
                )}
              </div>
            ))}
          </div>

          {/* Commission Rate */}
          <div className="glass p-6 rounded-3xl space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Withdrawal Commission Rate</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Override the global commission rate for this business. Leave blank to use the platform default.
                </p>
              </div>
              {!showCommissionForm && can("businesses", "set_commission") && (
                <button
                  onClick={() => {
                    setCommissionInput(business.commission_rate != null ? String(business.commission_rate) : "");
                    setShowCommissionForm(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {business.commission_rate != null ? "Edit Rate" : "Set Custom Rate"}
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
              <span className="text-sm font-medium">Current Rate</span>
              {business.commission_rate != null ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-indigo-600">{business.commission_rate}%</span>
                  <span className="text-xs text-muted-foreground">(custom)</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Using platform default</span>
              )}
            </div>

            {showCommissionForm && can("businesses", "set_commission") && (
              <form onSubmit={handleSetCommission} className="space-y-3">
                <div>
                  <label className="label">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="input"
                    placeholder="e.g. 2.5 — leave blank to use platform default"
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter a value between 0–100, or leave blank to clear the custom rate.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowCommissionForm(false); setCommissionInput(""); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSettingCommission}
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isSettingCommission ? "Saving..." : "Save Rate"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Cancellation Fee */}
          <div className="glass p-6 rounded-3xl space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Cancellation Fee</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Override the global cancellation fee for this business. Leave blank to use the global rate.
                </p>
              </div>
              {!showCancellationFeeForm && can("businesses", "set_cancellation_fee") && (
                <button
                  onClick={() => {
                    setCancellationFeeInput(business.cancellation_fee_percentage != null ? String(business.cancellation_fee_percentage) : "");
                    setShowCancellationFeeForm(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {business.cancellation_fee_percentage != null ? "Edit Rate" : "Set Custom Rate"}
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
              <span className="text-sm font-medium">Current Rate</span>
              {business.cancellation_fee_percentage != null ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-indigo-600">{business.cancellation_fee_percentage}%</span>
                  <span className="text-xs text-muted-foreground">(custom)</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Using global rate</span>
              )}
            </div>

            {showCancellationFeeForm && can("businesses", "set_cancellation_fee") && (
              <form onSubmit={handleSetCancellationFee} className="space-y-3">
                <div>
                  <label className="label">Cancellation Fee (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="input"
                    placeholder="e.g. 15 — leave blank to use global rate"
                    value={cancellationFeeInput}
                    onChange={(e) => setCancellationFeeInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter a value between 0–100, or leave blank to clear the custom rate.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowCancellationFeeForm(false); setCancellationFeeInput(""); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSettingCancellationFee}
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isSettingCancellationFee ? "Saving..." : "Save Rate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Bank Account Reject Modal ── */}
      {rejectingBankId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Reject Bank Account</h2>
            <p className="text-muted-foreground text-sm mb-4">Provide a reason for rejection. This will be emailed to the business owner.</p>
            <textarea
              className="input w-full h-24 resize-none"
              placeholder="e.g. Account number does not match the provided account name..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectingBankId(null); setRejectReason(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleRejectBank} disabled={!rejectReason.trim() || isRejectingBank} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isRejectingBank ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bank Account Ban Modal ── */}
      {banningBankId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Ban Bank Account</h2>
            <p className="text-muted-foreground text-sm mb-4">This will deactivate the bank account. Provide a reason.</p>
            <textarea
              className="input w-full h-24 resize-none"
              placeholder="e.g. Suspicious activity detected..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setBanningBankId(null); setBanReason(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleBanBank} disabled={!banReason.trim() || isBanningBank} className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
                {isBanningBank ? "Banning..." : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bank Account Unban Modal ── */}
      {unbanningBankId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Unban Bank Account</h2>
            <p className="text-muted-foreground text-sm mb-4">This will reactivate the bank account. Provide a reason.</p>
            <textarea
              className="input w-full h-24 resize-none"
              placeholder="e.g. Issue resolved, account cleared..."
              value={unbanReason}
              onChange={(e) => setUnbanReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setUnbanningBankId(null); setUnbanReason(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleUnbanBank} disabled={!unbanReason.trim() || isUnbanningBank} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                {isUnbanningBank ? "Unbanning..." : "Confirm Unban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="glass p-6 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Transaction Type</label>
                <select
                  className="input"
                  value={transactionTypeFilter}
                  onChange={(e) => { setTransactionTypeFilter(e.target.value); setTransactionPage(1); }}
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="refund">Refund</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="glass p-6 rounded-3xl overflow-x-auto">
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
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-4 font-medium">ID</th>
                      <th className="pb-4 font-medium">Type</th>
                      <th className="pb-4 font-medium">Description</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Method</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((txn) => {
                      const isCredit = ["income", "refund"].includes(txn.transaction_type);
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-4 font-mono text-sm font-semibold">#{txn.id}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${txn.transaction_type === "income" ? "bg-green-100 text-green-600" :
                                  txn.transaction_type === "withdrawal" ? "bg-blue-100 text-blue-600" :
                                    txn.transaction_type === "refund" ? "bg-orange-100 text-orange-600" :
                                      "bg-purple-100 text-purple-600"
                                }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTransactionIcon(txn.transaction_type)} />
                                </svg>
                              </div>
                              <span className="text-sm font-medium capitalize">{txn.transaction_type}</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm max-w-xs truncate">{txn.description || "—"}</td>
                          <td className="py-4">
                            <span className={`font-bold text-sm ${isCredit ? "text-green-600" : "text-red-600"}`}>
                              {isCredit ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="text-xs bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded capitalize">
                              {txn.payment_method || "—"}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">{formatDate(txn.created_at)}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${txn.status === "completed" ? "bg-green-100 text-green-600" :
                                txn.status === "pending" ? "bg-orange-100 text-orange-600" :
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
                {transactionsMeta && transactionsMeta.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Page {transactionsMeta.current_page} of {transactionsMeta.total_pages} ({transactionsMeta.total_count} total)
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setTransactionPage((p) => Math.max(1, p - 1))} disabled={transactionsMeta.current_page === 1} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Previous</button>
                      <button onClick={() => setTransactionPage((p) => Math.min(transactionsMeta.total_pages, p + 1))} disabled={transactionsMeta.current_page === transactionsMeta.total_pages} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="glass p-12 rounded-3xl flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : analyticsData ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Revenue", value: formatCurrency(analyticsData.total_revenue), sub: "all time", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
                  { label: "Total Bookings", value: analyticsData.total_bookings, sub: `${analyticsData.cancelled_bookings} cancelled`, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
                  { label: "Avg Booking Value", value: formatCurrency(analyticsData.avg_booking_value), sub: "per booking", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
                  { label: "Cancellation Rate", value: analyticsData.total_bookings > 0 ? `${((analyticsData.cancelled_bookings / analyticsData.total_bookings) * 100).toFixed(1)}%` : "0%", sub: `${analyticsData.cancelled_bookings} of ${analyticsData.total_bookings}`, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
                ].map((stat, i) => (
                  <div key={i} className="glass p-6 rounded-3xl">
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3 ${stat.bg} ${stat.color}`}>
                      {stat.label}
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Revenue & Bookings area chart */}
              <div className="glass p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-6">Revenue & Bookings — Last 6 Months</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analyticsData.monthly_data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="rev" orientation="left" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="book" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue"
                          ? [formatCurrency(Number(value ?? 0)), "Revenue"]
                          : [value, name === "bookings" ? "Bookings" : "Cancelled"]
                      }
                    />
                    <Legend />
                    <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} name="revenue" />
                    <Area yAxisId="book" type="monotone" dataKey="bookings" stroke="#22c55e" fill="url(#bookGrad)" strokeWidth={2} name="bookings" />
                    <Area yAxisId="book" type="monotone" dataKey="cancelled" stroke="#f97316" fill="none" strokeWidth={2} strokeDasharray="4 2" name="cancelled" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment method pie chart */}
                <div className="glass p-6 rounded-3xl">
                  <h3 className="text-xl font-bold mb-6">Revenue by Payment Method</h3>
                  {analyticsData.payment_breakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No payment data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={analyticsData.payment_breakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {analyticsData.payment_breakdown.map((_, i) => (
                            <Cell key={i} fill={["#6366f1", "#22c55e", "#f97316", "#3b82f6", "#a855f7"][i % 5]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                        <Legend
                          formatter={(value) => <span className="text-sm font-medium">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Room availability bar chart */}
                <div className="glass p-6 rounded-3xl">
                  <h3 className="text-xl font-bold mb-6">Room Availability by Type</h3>
                  {analyticsData.room_availability.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No room data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={analyticsData.room_availability} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="available" name="Available" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="occupied" name="Occupied" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glass p-12 rounded-3xl text-center text-muted-foreground">
              No analytics data available
            </div>
          )}
        </div>
      )}

      {/* ── Rooms & Types Tab ── */}
      {activeTab === "rooms" && (
        <div className="space-y-4">
          {business.room_types.length === 0 ? (
            <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
              <svg className="w-16 h-16 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-muted-foreground">No room types configured yet</p>
            </div>
          ) : (
            business.room_types.map((rt) => (
              <div key={rt.id} className="glass p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{rt.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatCurrency(rt.price)} / night · {rt.rooms_count} room{rt.rooms_count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                    {rt.rooms_count} rooms
                  </span>
                </div>
                {rt.rooms.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {rt.rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-3 rounded-xl text-center text-xs font-semibold border ${room.status === "available"
                            ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                            : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-zinc-800/50 dark:border-zinc-700"
                          }`}
                      >
                        <p className="text-base font-bold">#{room.number}</p>
                        <p className="capitalize mt-0.5">{room.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Recent Bookings Tab ── */}
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
                      <th className="pb-4 font-medium">Guest</th>
                      <th className="pb-4 font-medium">Room</th>
                      <th className="pb-4 font-medium">Check-in</th>
                      <th className="pb-4 font-medium">Check-out</th>
                      <th className="pb-4 font-medium">Guests</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reservations.map((r) => {
                      const status = r.cancelled ? "cancelled" : r.occupied ? "active" : r.processed ? "past" : "upcoming";
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-4 font-mono text-sm font-semibold">{r.booking_id}</td>
                          <td className="py-4 text-sm">{r.first_name} {r.last_name}</td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {r.room_type || "—"}{r.room_number ? ` · Room ${r.room_number}` : ""}
                          </td>
                          <td className="py-4 text-sm">{formatDate(r.start_date)}</td>
                          <td className="py-4 text-sm text-muted-foreground">{formatDate(r.end_date)}</td>
                          <td className="py-4 text-sm">{r.guests}</td>
                          <td className="py-4 font-bold text-sm">{formatCurrency(r.total_amount)}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${status === "upcoming" ? "bg-blue-100 text-blue-600" :
                                status === "active" ? "bg-green-100 text-green-600" :
                                  status === "past" ? "bg-slate-100 text-slate-600" :
                                    "bg-red-100 text-red-600"
                              }`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {reservationsMeta && reservationsMeta.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Page {reservationsMeta.current_page} of {reservationsMeta.total_pages} ({reservationsMeta.total_count} total)
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setReservationPage((p) => Math.max(1, p - 1))} disabled={reservationsMeta.current_page === 1} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Previous</button>
                    <button onClick={() => setReservationPage((p) => Math.min(reservationsMeta.total_pages, p + 1))} disabled={reservationsMeta.current_page === reservationsMeta.total_pages} className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Verification Tab ── */}
      {activeTab === "verification" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold">Business Verification</h3>
            <div className="space-y-3">
              {/* Verification status row */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div>
                  <p className="font-semibold">Verification Status</p>
                  <p className="text-xs text-muted-foreground">Current verification state</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${business.verification_status === "approved" ? "bg-green-100 text-green-600" :
                    business.verification_status === "rejected" ? "bg-red-100 text-red-600" :
                      "bg-orange-100 text-orange-600"
                  }`}>
                  {business.verification_status}
                </span>
              </div>

              {/* Suspension status row */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div>
                  <p className="font-semibold">Suspension Status</p>
                  <p className="text-xs text-muted-foreground">Whether the business is suspended</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${business.suspended ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                  }`}>
                  {business.suspended ? "Suspended" : "Active"}
                </span>
              </div>

              {/* Bank accounts verification */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div>
                  <p className="font-semibold">Bank Verification</p>
                  <p className="text-xs text-muted-foreground">Bank account verification status</p>
                </div>
                {business.bank_accounts.some((b) => b.status === "verified") ? (
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">Pending</span>
                )}
              </div>

              {/* Verify / Reject actions */}
              {business.verification_status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setStatusAction({ type: "verify", title: "Verify Business", confirmText: "Verify", variant: "green" });
                      setShowStatusModal(true);
                    }}
                    disabled={isMutationLoading}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold disabled:opacity-50"
                  >
                    {isVerifying ? "Verifying..." : "Verify Now"}
                  </button>
                  <button
                    onClick={() => {
                      setStatusAction({ type: "reject", title: "Reject Business", confirmText: "Reject", variant: "orange" });
                      setShowStatusModal(true);
                    }}
                    disabled={isMutationLoading}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold">Verification Details</h3>
            <div className="space-y-3">
              {business.verified_at && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-green-600">Business Verified</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(business.verified_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verified by {business.verified_by_admin_name ?? `Admin #${business.verified_by_admin_id}`}
                  </p>
                </div>
              )}
              {business.verification_notes && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                  <p className="text-xs font-bold text-orange-600 mb-1">Rejection Notes</p>
                  <p className="text-sm text-muted-foreground">{business.verification_notes}</p>
                </div>
              )}
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600">Business Registered</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(business.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Business account created
                  {business.owners.length > 0 ? ` by ${business.owners[0].first_name} ${business.owners[0].last_name}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Map Modal ── */}
      {showMapModal && business.latitude && business.longitude && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => { setShowMapModal(false); setMapLoading(true); }}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{business.name} - Location</h3>
                <p className="text-sm text-muted-foreground mt-1">{business.address}, {business.city}, {business.state}</p>
              </div>
              <button
                onClick={() => { setShowMapModal(false); setMapLoading(true); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Latitude</p>
                    <p className="text-sm font-semibold">{business.latitude}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Longitude</p>
                    <p className="text-sm font-semibold">{business.longitude}</p>
                  </div>
                </div>
                <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-border relative bg-slate-100 dark:bg-zinc-800">
                  {mapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 z-10">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">Loading map...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${business.latitude},${business.longitude}&hl=en&z=15&output=embed`}
                    allowFullScreen
                    onLoad={() => setMapLoading(false)}
                  />
                </div>
                <div className="flex gap-3">
                  <a
                    href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold text-center"
                  >
                    Open in Google Maps
                  </a>
                  <a
                    href={`https://maps.apple.com/?q=${business.latitude},${business.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold text-center"
                  >
                    Open in Apple Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
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
                {statusAction.type === "suspend" && "You are about to suspend this business. It will no longer be visible to customers."}
                {statusAction.type === "activate" && "You are about to reactivate this business."}
                {statusAction.type === "verify" && "Confirm verification of this business."}
                {statusAction.type === "reject" && "Provide the reason for rejecting this business."}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  Reason / Notes {statusAction.type === "suspend" || statusAction.type === "reject" ? "(Required)" : "(Optional)"}
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
                disabled={isMutationLoading || ((statusAction.type === "suspend" || statusAction.type === "reject") && !statusReason.trim())}
                className={`flex-1 px-4 py-3 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 ${statusAction.variant === "red" ? "bg-red-500" :
                    statusAction.variant === "orange" ? "bg-orange-500" :
                      "bg-green-600"
                  }`}
              >
                {isMutationLoading ? "Processing..." : statusAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
