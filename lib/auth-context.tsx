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

interface AuthContextType {
  admin: Admin | null;
  login: (email: string, password: string) => Promise<void>;
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

    const isPublicPath =
      pathname === "/" || pathname === "/auth/forgot-password";

    if (!isAuthenticated && !isPublicPath) {
      router.replace("/");
    } else if (isAuthenticated && isPublicPath) {
      router.replace("/dashboard");
    }
  }, [isLoading, pathname, router, isAuthenticated]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({
        admin: { email, password },
      }).unwrap();

      dispatch(
        loginAction({
          token: result.token,
          admin: result.data,
        }),
      );

      router.push("/dashboard");
    },
    [loginMutation, dispatch, router],
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
      updateAdmin,
      logout,
      isLoading,
      isAuthenticated,
    }),
    [admin, login, updateAdmin, logout, isLoading, isAuthenticated],
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
