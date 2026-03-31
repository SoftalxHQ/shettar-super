import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { logout as logoutAction } from "../slices/authSlice";
import type { Admin } from "../slices/authSlice";

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

interface PaginatedResponse<T> {
  meta: AccountsMeta;
  reservations?: T[];
  transactions?: T[];
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
const baseQueryWith401Handler = async (args: any, api: any, extraOptions: any) => {
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
  tagTypes: ["Account"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/admins/sign_in",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any, meta) => {
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
} = apiService;
