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
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/admins/sign_in",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any, meta) => {
        // Extract JWT from Authorization header
        const authHeader = meta?.response?.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") || "";

        return {
          ...response,
          token,
        };
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/admins/sign_out",
        method: "DELETE",
      }),
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation } = apiService;
