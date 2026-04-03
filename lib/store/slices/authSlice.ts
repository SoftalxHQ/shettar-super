import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export interface AdminPermissions {
  accounts?: { view?: boolean; suspend?: boolean; activate?: boolean };
  businesses?: { view?: boolean; verify?: boolean; suspend?: boolean; activate?: boolean; set_commission?: boolean };
  support_tickets?: { view?: boolean; reply?: boolean; assign?: boolean; update_status?: boolean };
  finance?: { view?: boolean; manage_payouts?: boolean };
  configurations?: { view?: boolean; edit?: boolean };
  staff?: { view?: boolean; invite?: boolean; edit?: boolean; deactivate?: boolean };
  activities?: { view?: boolean };
}

export interface Admin {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  other_name?: string;
  phone_number?: string;
  address?: string;
  zip_code?: string;
  gender?: string;
  date_of_birth?: string;
  admin_unique_id?: string;
  role?: string;
  avatar_url?: string;
  admin_role?: "super_admin" | "admin_staff";
  title?: string | null;
  permissions?: AdminPermissions;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  admin: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string; admin: Admin }>) => {
      state.token = action.payload.token;
      state.admin = action.payload.admin;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.admin = null;
      state.isAuthenticated = false;
    },
    updateAdmin: (state, action: PayloadAction<Admin>) => {
      state.admin = action.payload;
    },
  },
});

export const { login, logout, updateAdmin } = authSlice.actions;

// Selectors
export const selectAdmin = (state: RootState) => state.auth.admin;
export const selectToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export default authSlice.reducer;
