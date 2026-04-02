import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { logout as logoutAction } from "../slices/authSlice";
import type { Admin } from "../slices/authSlice";
import type { AdminStaff } from "../../admin-staff-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface LoginRequest {
  admin: {
    email: string;
    password: string;
  };
}

interface LoginResponse {
  status: {
    code: number;
    message: string;
  };
  data: Admin;
  token: string;
}

export interface Account {
  id: number;
  account_unique_id: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  email: string;
  phone_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  suspended: boolean;
  wallet_balance: number;
  sign_in_count: number;
  last_sign_in_at: string | null;
  created_at: string;
  total_bookings: number;
  status: "active" | "pending" | "suspended";
}

export interface AccountDetail extends Account {
  address: string | null;
  zip_code: string | null;
  emer_first_name: string | null;
  emer_last_name: string | null;
  emer_phone_number: string | null;
  paystack_customer_code: string | null;
  dva_account_number: string | null;
  dva_bank_name: string | null;
  dva_account_name: string | null;
  dva_bank_code: string | null;
}

export interface AccountsMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export interface GetAccountsParams {
  page?: number;
  search?: string;
  status?: string;
}

interface GetAccountsResponse {
  accounts: Account[];
  meta: AccountsMeta;
}

interface GetAccountResponse {
  account: AccountDetail;
}

interface AccountActionResponse {
  message: string;
  account: AccountDetail;
}

export interface AccountReservation {
  id: number;
  booking_id: string;
  business_name: string | null;
  room_type: string | null;
  room_number: string | null;
  start_date: string;
  end_date: string;
  guests: number;
  total_amount: number;
  payment_method: string;
  status: string;
  cancelled: boolean;
  created_at: string;
}

export interface AccountTransaction {
  id: number;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  payment_method: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PaginatedResponse<T> {
  meta: AccountsMeta;
  reservations?: T[];
  transactions?: T[];
}

// ── Business types ────────────────────────────────────────────────────────────

export interface Business {
  id: number;
  business_unique_id: string;
  name: string;
  category: string | null;
  city: string;
  state: string;
  suspended: boolean;
  verification_status: "pending" | "approved" | "rejected";
  withdrawable_balance: number;
  pending_balance: number;
  rooms_count: number;
  reservations_count: number;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
}

export interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  bank_code: string | null;
  currency: string;
  is_active: boolean;
  recipient_code: string | null;
}

export interface BusinessOwner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  is_primary: boolean;
}

export interface RoomType {
  id: number;
  name: string;
  price: number;
  rooms_count: number;
  rooms: { id: number; number: number; status: string }[];
}

export interface BusinessDetail extends Business {
  description: string | null;
  address: string;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in: string;
  check_out: string;
  star_rating: number | null;
  slug: string;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by_admin_id: number | null;
  verified_by_admin_name: string | null;
  total_revenue: number;
  refund_balance: number;
  cash_balance: number;
  pos_balance: number;
  onsite_payment_balance: number;
  amenities: Record<string, boolean>;
  room_types: RoomType[];
  owners: BusinessOwner[];
  bank_accounts: BankAccount[];
}

export interface BusinessReservation {
  id: number;
  booking_id: string;
  first_name: string | null;
  last_name: string | null;
  room_type: string | null;
  room_number: number | null;
  start_date: string;
  end_date: string;
  guests: number;
  total_amount: number;
  payment_method: string;
  cancelled: boolean;
  occupied: boolean;
  processed: boolean;
  created_at: string;
}

export interface BusinessTransaction {
  id: number;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  payment_method: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GetBusinessesParams {
  page?: number;
  search?: string;
  status?: string;
  verification?: string;
  category_id?: number;
}

interface GetBusinessesResponse {
  businesses: Business[];
  meta: AccountsMeta;
}

interface GetBusinessResponse {
  business: BusinessDetail;
}

interface BusinessActionResponse {
  message: string;
  business: BusinessDetail;
}

interface VerifyBusinessParams {
  id: number | string;
  status: "approved" | "rejected";
  notes?: string;
}

interface VerifyBankAccountParams {
  businessId: number | string;
  id: number | string;
}

interface VerifyBankAccountResponse {
  message: string;
  bank_account: BankAccount;
}

export interface BusinessAnalyticsMonth {
  month: string;
  revenue: number;
  bookings: number;
  cancelled: number;
}

export interface BusinessAnalytics {
  monthly_data: BusinessAnalyticsMonth[];
  payment_breakdown: { name: string; value: number }[];
  room_availability: { name: string; available: number; occupied: number }[];
  total_revenue: number;
  total_bookings: number;
  cancelled_bookings: number;
  avg_booking_value: number;
}

// ── Support Ticket Types ────────────────────────────────────────────────────────

export interface SupportTicket {
  id: number;
  ticket_id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  business?: {
    id: number;
    name: string;
  };
  assigned_to?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface SupportMessage {
  id: number;
  body: string;
  created_at: string;
  sender_type: string;
  sender_id: number;
  sender?: {
    id: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
  };
}

export interface GetSupportTicketsParams {
  page?: number;
  status?: string;
  priority?: string;
  business_id?: number | string;
  search?: string;
}

export interface SupportTicketStats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  high_priority: number;
}

interface GetSupportTicketsResponse {
  tickets: SupportTicket[];
  meta: AccountsMeta;
}

interface GetSupportTicketResponse {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

// ── Admin Staff Types ───────────────────────────────────────────────────────

export interface GetAdminStaffParams {
  page?: number;
  search?: string;
  role?: string;
}

interface GetAdminStaffResponse {
  staff: AdminStaff[];
  meta: AccountsMeta;
}

interface GetAdminStaffMemberResponse {
  staff: AdminStaff;
}

interface InviteAdminStaffRequest {
  admin: {
    first_name: string;
    last_name: string;
    email: string;
    admin_role: "super_admin" | "admin_staff";
    title?: string;
    permissions?: Record<string, Record<string, boolean>>;
  };
}

interface UpdateAdminStaffRequest {
  id: number | string;
  admin: {
    admin_role?: "super_admin" | "admin_staff";
    title?: string | null;
    permissions?: Record<string, Record<string, boolean>>;
  };
}

// Custom base query with auth header injection and 401 handling
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;

    headers.set("Content-Type", "application/json");
    headers.set("X-Client-Platform", "web-super");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// Wrapper to handle 401 responses
const baseQueryWith401Handler = async (
  args: Parameters<typeof baseQueryWithAuth>[0],
  api: Parameters<typeof baseQueryWithAuth>[1],
  extraOptions: Parameters<typeof baseQueryWithAuth>[2]
) => {
  const result = await baseQueryWithAuth(args, api, extraOptions);

  // Handle 401 Unauthorized
  if (result.error && result.error.status === 401) {
    // Clear auth state
    api.dispatch(logoutAction());

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  return result;
};

export const apiService = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWith401Handler,
  tagTypes: ["Account", "Business", "SupportTicket", "AdminStaff"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/admins/sign_in",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: LoginResponse, meta?: { response?: Response }) => {
        const authHeader = meta?.response?.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") || "";
        return { ...response, token };
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/admins/sign_out",
        method: "DELETE",
      }),
    }),
    getAccounts: builder.query<GetAccountsResponse, GetAccountsParams>({
      query: ({ page = 1, search, status } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("search", search);
        if (status && status !== "all") params.set("status", status);
        return `/api/v1/admin/accounts?${params.toString()}`;
      },
      providesTags: ["Account"],
    }),
    getAccount: builder.query<GetAccountResponse, number | string>({
      query: (id) => `/api/v1/admin/accounts/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Account", id }],
    }),
    suspendAccount: builder.mutation<AccountActionResponse, number | string>({
      query: (id) => ({
        url: `/api/v1/admin/accounts/${id}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _err, id) => ["Account", { type: "Account", id }],
    }),
    activateAccount: builder.mutation<AccountActionResponse, number | string>({
      query: (id) => ({
        url: `/api/v1/admin/accounts/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _err, id) => ["Account", { type: "Account", id }],
    }),
    getAccountReservations: builder.query<{ reservations: AccountReservation[]; meta: AccountsMeta }, { id: number | string; page?: number; status?: string }>({
      query: ({ id, page = 1, status }) => {
        const params = new URLSearchParams({ page: String(page) });
        if (status && status !== "all") params.set("status", status);
        return `/api/v1/admin/accounts/${id}/reservations?${params.toString()}`;
      },
    }),
    getAccountTransactions: builder.query<{ transactions: AccountTransaction[]; meta: AccountsMeta }, { id: number | string; page?: number; transaction_type?: string }>({
      query: ({ id, page = 1, transaction_type }) => {
        const params = new URLSearchParams({ page: String(page) });
        if (transaction_type && transaction_type !== "all") params.set("transaction_type", transaction_type);
        return `/api/v1/admin/accounts/${id}/transactions?${params.toString()}`;
      },
    }),

    // ── Business endpoints ──────────────────────────────────────────────────
    getBusinesses: builder.query<GetBusinessesResponse, GetBusinessesParams>({
      query: ({ page = 1, search, status, verification, category_id } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("search", search);
        if (status && status !== "all") params.set("status", status);
        if (verification && verification !== "all") params.set("verification", verification);
        if (category_id) params.set("category_id", String(category_id));
        return `/api/v1/admin/businesses?${params.toString()}`;
      },
      providesTags: ["Business"],
    }),
    getBusiness: builder.query<GetBusinessResponse, number | string>({
      query: (id) => `/api/v1/admin/businesses/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Business", id }],
    }),
    suspendBusiness: builder.mutation<BusinessActionResponse, number | string>({
      query: (id) => ({ url: `/api/v1/admin/businesses/${id}/suspend`, method: "PATCH" }),
      invalidatesTags: (_result, _err, id) => ["Business", { type: "Business", id }],
    }),
    activateBusiness: builder.mutation<BusinessActionResponse, number | string>({
      query: (id) => ({ url: `/api/v1/admin/businesses/${id}/activate`, method: "PATCH" }),
      invalidatesTags: (_result, _err, id) => ["Business", { type: "Business", id }],
    }),
    verifyBusiness: builder.mutation<BusinessActionResponse, VerifyBusinessParams>({
      query: ({ id, status, notes }) => ({
        url: `/api/v1/admin/businesses/${id}/verify`,
        method: "PATCH",
        body: { status, notes },
      }),
      invalidatesTags: (_result, _err, { id }) => ["Business", { type: "Business", id }],
    }),
    verifyBankAccount: builder.mutation<VerifyBankAccountResponse, VerifyBankAccountParams>({
      query: ({ businessId, id }) => ({
        url: `/api/v1/admin/businesses/${businessId}/bank_accounts/${id}/verify`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _err, { businessId }) => ["Business", { type: "Business", id: businessId }],
    }),
    getBusinessReservations: builder.query<{ reservations: BusinessReservation[]; meta: AccountsMeta }, { id: number | string; page?: number; status?: string }>({
      query: ({ id, page = 1, status }) => {
        const params = new URLSearchParams({ page: String(page) });
        if (status && status !== "all") params.set("status", status);
        return `/api/v1/admin/businesses/${id}/reservations?${params.toString()}`;
      },
    }),
    getBusinessTransactions: builder.query<{ transactions: BusinessTransaction[]; meta: AccountsMeta }, { id: number | string; page?: number; transaction_type?: string }>({
      query: ({ id, page = 1, transaction_type }) => {
        const params = new URLSearchParams({ page: String(page) });
        if (transaction_type && transaction_type !== "all") params.set("transaction_type", transaction_type);
        return `/api/v1/admin/businesses/${id}/transactions?${params.toString()}`;
      },
    }),
    getBusinessAnalytics: builder.query<BusinessAnalytics, number | string>({
      query: (id) => `/api/v1/admin/businesses/${id}/analytics`,
    }),

    // ── Support Tickets endpoints ───────────────────────────────────────────
    getSupportTickets: builder.query<GetSupportTicketsResponse, GetSupportTicketsParams>({
      query: ({ page = 1, status, priority, business_id, search } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (status && status !== "all") params.set("status", status);
        if (priority && priority !== "all") params.set("priority", priority);
        if (business_id) params.set("business_id", String(business_id));
        if (search) params.set("search", search);
        return `/api/v1/admin/support_tickets?${params.toString()}`;
      },
      providesTags: ["SupportTicket"],
    }),
    getSupportTicketStats: builder.query<SupportTicketStats, void>({
      query: () => '/api/v1/admin/support_tickets/stats',
      providesTags: ["SupportTicket"],
    }),
    getSupportTicket: builder.query<GetSupportTicketResponse, number | string>({
      query: (id) => `/api/v1/admin/support_tickets/${id}`,
      providesTags: (_result, _err, id) => [{ type: "SupportTicket", id }],
    }),
    assignSupportTicket: builder.mutation<{ message: string; ticket: SupportTicket }, { id: number | string; admin_id: number | string }>({
      query: ({ id, admin_id }) => ({
        url: `/api/v1/admin/support_tickets/${id}/assign`,
        method: "PATCH",
        body: { admin_id },
      }),
      invalidatesTags: (_result, _err, { id }) => ["SupportTicket", { type: "SupportTicket", id }],
    }),
    updateSupportTicketStatus: builder.mutation<{ message: string; ticket: SupportTicket }, { id: number | string; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/v1/admin/support_tickets/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _err, { id }) => ["SupportTicket", { type: "SupportTicket", id }],
    }),
    replyToSupportTicket: builder.mutation<{ message: string; support_message: SupportMessage }, { id: number | string; body: string }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/support_tickets/${id}/messages`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "SupportTicket", id }],
    }),

    // ── Admin Staff endpoints ───────────────────────────────────────────────
    getAdminStaff: builder.query<GetAdminStaffResponse, GetAdminStaffParams>({
      query: ({ page = 1, search, role } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("search", search);
        if (role && role !== "all") params.set("role", role);
        return `/api/v1/admin/staff?${params.toString()}`;
      },
      providesTags: ["AdminStaff"],
    }),
    getAdminStaffMember: builder.query<GetAdminStaffMemberResponse, number | string>({
      query: (id) => `/api/v1/admin/staff/${id}`,
      providesTags: (_result, _err, id) => [{ type: "AdminStaff", id }],
    }),
    inviteAdminStaff: builder.mutation<{ staff: AdminStaff }, InviteAdminStaffRequest>({
      query: (body) => ({
        url: "/api/v1/admin/staff",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminStaff"],
    }),
    updateAdminStaff: builder.mutation<{ staff: AdminStaff }, UpdateAdminStaffRequest>({
      query: ({ id, admin }) => ({
        url: `/api/v1/admin/staff/${id}`,
        method: "PATCH",
        body: { admin },
      }),
      invalidatesTags: (_result, _err, { id }) => ["AdminStaff", { type: "AdminStaff", id }],
    }),
    deactivateAdminStaff: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `/api/v1/admin/staff/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _err, id) => ["AdminStaff", { type: "AdminStaff", id }],
    }),
    reactivateAdminStaff: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `/api/v1/admin/staff/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _err, id) => ["AdminStaff", { type: "AdminStaff", id }],
    }),
    removeAdminStaff: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `/api/v1/admin/staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminStaff"],
    }),

    // ── Password change ─────────────────────────────────────────────────────
    changePassword: builder.mutation<{ status: { code: number; message: string } }, { current_password: string; password: string; password_confirmation: string }>({
      query: (passwords) => ({
        url: "/admin_details/change_password",
        method: "PUT",
        body: { admin: passwords },
      }),
    }),

    // ── Profile update ──────────────────────────────────────────────────────
    updateAdminProfile: builder.mutation<{ status: { code: number; message: string }; data: import("../slices/authSlice").Admin }, {
      first_name?: string; last_name?: string; other_name?: string;
      phone_number?: string; address?: string; zip_code?: string;
      gender?: string; date_of_birth?: string;
    }>({
      query: (profileData) => ({
        url: "/admin_details",
        method: "PATCH",
        body: { admin: profileData },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetAccountsQuery,
  useGetAccountQuery,
  useSuspendAccountMutation,
  useActivateAccountMutation,
  useGetAccountReservationsQuery,
  useGetAccountTransactionsQuery,
  useGetBusinessesQuery,
  useGetBusinessQuery,
  useSuspendBusinessMutation,
  useActivateBusinessMutation,
  useVerifyBusinessMutation,
  useVerifyBankAccountMutation,
  useGetBusinessReservationsQuery,
  useGetBusinessTransactionsQuery,
  useGetBusinessAnalyticsQuery,
  useGetSupportTicketsQuery,
  useGetSupportTicketStatsQuery,
  useGetSupportTicketQuery,
  useAssignSupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
  useReplyToSupportTicketMutation,
  useGetAdminStaffQuery,
  useGetAdminStaffMemberQuery,
  useInviteAdminStaffMutation,
  useUpdateAdminStaffMutation,
  useDeactivateAdminStaffMutation,
  useReactivateAdminStaffMutation,
  useRemoveAdminStaffMutation,
  useChangePasswordMutation,
  useUpdateAdminProfileMutation,
} = apiService;
