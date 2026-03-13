// Local storage utilities for the Shettar Super Admin platform
const AUTH_TOKEN_KEY = "shettar_super_auth_token"
const ADMIN_DATA_KEY = "shettar_super_admin_data"

// Check if we're on the client side
const isClient = typeof window !== "undefined"

export function getAuthToken(): string | null {
  if (!isClient) return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  if (!isClient) return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  if (!isClient) return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getAdminData(): any {
  if (!isClient) return null
  const data = localStorage.getItem(ADMIN_DATA_KEY)
  return data ? JSON.parse(data) : null
}

export function setAdminData(data: any): void {
  if (!isClient) return
  localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data))
}

export function clearAdminData(): void {
  if (!isClient) return
  localStorage.removeItem(ADMIN_DATA_KEY)
}

export function logout(): void {
  clearAuthToken()
  clearAdminData()
}
