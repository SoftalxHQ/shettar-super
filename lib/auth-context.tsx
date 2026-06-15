"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  login as loginAction,
  logout as logoutAction,
  updateAdmin as updateAdminAction,
  selectAdmin,
  selectIsAuthenticated,
} from "./store/slices/authSlice";
import { useLoginMutation, useLogoutMutation } from "./store/services/api";
import { persistor } from "./store/store";
import { toast } from "sonner";
import type { Admin } from "./store/slices/authSlice";

export interface LoginResult {
  requires_2fa?: boolean;
  stage?: "enroll" | "verify";
  challenge_token?: string;
  otp_secret?: string;
  otp_provisioning_uri?: string;
  qr_svg?: string;
  message?: string;
}

interface AuthContextType {
  admin: Admin | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  finalizeLogin: (token: string, adminData: Admin) => void;
  updateAdmin: (adminData: Admin) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const admin = useAppSelector(selectAdmin);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = false;
  const router = useRouter();
  const pathname = usePathname();

  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  // Redirect logic based on auth state
  useEffect(() => {
    if (isLoading) return;

    // Recover from stale sessions where isAuthenticated was set without admin data
    // (e.g. old frontend against mandatory-2FA API).
    if (isAuthenticated && !admin) {
      dispatch(logoutAction());
      void persistor.purge();
      router.replace("/");
      return;
    }

    const isPublicPath =
      pathname === "/" || pathname === "/auth/forgot-password";

    if (!isAuthenticated && !isPublicPath) {
      router.replace("/");
    } else if (isAuthenticated && isPublicPath) {
      router.replace("/dashboard");
    }
  }, [isLoading, pathname, router, isAuthenticated, admin, dispatch]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const result = await loginMutation({
        admin: { email, password },
      }).unwrap();

      // Mandatory 2FA: the backend never issues a token directly. It returns a
      // challenge that must be completed via finalizeLogin after verification.
      if (result.requires_2fa) {
        return {
          requires_2fa: true,
          stage: result.stage,
          challenge_token: result.challenge_token,
          otp_secret: result.otp_secret,
          otp_provisioning_uri: result.otp_provisioning_uri,
          qr_svg: result.qr_svg,
          message: result.message,
        };
      }

      // Fallback for the (currently unused) no-2FA path.
      if (result.token && result.data) {
        dispatch(loginAction({ token: result.token, admin: result.data }));
        router.push("/dashboard");
      }

      return {};
    },
    [loginMutation, dispatch, router],
  );

  const finalizeLogin = useCallback(
    (token: string, adminData: Admin) => {
      dispatch(loginAction({ token, admin: adminData }));
      router.push("/dashboard");
    },
    [dispatch, router],
  );

  const updateAdmin = useCallback(
    (adminData: Admin) => {
      dispatch(updateAdminAction(adminData));
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    try {
      // Fire-and-forget backend logout
      logoutMutation().catch((err) =>
        console.error("Backend logout failed:", err),
      );

      // Clear Redux state
      dispatch(logoutAction());

      // Clear persisted state
      await persistor.purge();

      toast.success("Disconnected", {
        description: "You have been securely signed out of Shettar Super.",
      });

      router.replace("/");
    } catch (error) {
      console.error("Logout process error:", error);
      window.location.href = "/";
    }
  }, [logoutMutation, dispatch, router]);

  const contextValue = useMemo(
    () => ({
      admin,
      login,
      finalizeLogin,
      updateAdmin,
      logout,
      isLoading,
      isAuthenticated,
    }),
    [admin, login, finalizeLogin, updateAdmin, logout, isLoading, isAuthenticated],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
