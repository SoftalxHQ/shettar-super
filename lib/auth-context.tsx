"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getAuthToken, setAuthToken, getAdminData, setAdminData, logout as storageLogout } from "./storage"
import { api } from "./api-client"
import { toast } from "sonner"

interface Admin {
  id: number
  email: string
  name?: string
  first_name?: string
  last_name?: string
  other_name?: string
  phone_number?: string
  address?: string
  zip_code?: string
  gender?: string
  date_of_birth?: string
  admin_unique_id?: string
  role?: string
  avatar_url?: string
}

interface AuthContextType {
  admin: Admin | null
  login: (token: string, adminData: Admin) => void
  updateAdmin: (adminData: Admin) => void
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Initial check for stored data
    const token = getAuthToken()
    const adminData = getAdminData()

    if (token && adminData) {
      setAdmin(adminData)
    }
    
    setIsLoading(false)
  }, [])

  // Redirect logic: If not authenticated and not on sign-in pages, go to login
  useEffect(() => {
    if (isLoading) return

    const token = getAuthToken()
    const isPublicPath = pathname === "/" || pathname === "/auth/forgot-password"

    if (!token && !isPublicPath) {
      router.push("/")
    } else if (token && isPublicPath) {
      router.push("/dashboard")
    }
  }, [isLoading, pathname, router, admin])

  const login = useCallback((token: string, adminData: Admin) => {
    setAuthToken(token)
    setAdminData(adminData)
    setAdmin(adminData)
    router.push("/dashboard")
  }, [router])
  
  const updateAdmin = useCallback((adminData: Admin) => {
    setAdminData(adminData)
    setAdmin(adminData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      storageLogout();
      setAdmin(null);
      toast.success("Disconnected", {
        description: "You have been securely signed out of Shettar Super.",
      });
      router.push("/");
    }
  }, [router]);

  const contextValue = useMemo(() => ({
    admin,
    login,
    updateAdmin,
    logout,
    isLoading,
    isAuthenticated: !!admin
  }), [admin, login, updateAdmin, logout, isLoading])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
