import { logout as storageLogout, setAdminData } from "./storage"
import { logout as logoutAction } from "./store/slices/authSlice"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

interface ErrorResponse {
  status?: { message?: string }
  message?: string
  [key: string]: unknown
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getHeaders(_options: RequestOptions = {}): HeadersInit {
    return {
      "Content-Type": "application/json",
      "X-Client-Platform": "web-super",
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options

    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders({ requiresAuth })

    const response = await fetch(url, {
      ...fetchOptions,
      credentials: "include",
      headers: {
        ...headers,
        ...(fetchOptions.headers || {}),
      },
    })

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({}))

      // Auto-logout on 401 Unauthorized (Expired/Invalid session cookie)
      if (response.status === 401) {
        storageLogout()
        void import("./store/store").then(({ persistor, store }) => {
          store.dispatch(logoutAction())
          void persistor.purge()
        })
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      }

      throw new ApiError(
        response.status,
        errorData.status?.message || errorData.message || response.statusText,
        errorData
      )
    }

    return response.json()
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/admins/sign_in`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "web-super",
      },
      body: JSON.stringify({
        admin: { email, password },
      }),
    })

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        errorData.status?.message || errorData.message || "Login failed",
        errorData,
      )
    }

    const data: Record<string, unknown> = await response.json()
    if (data.data) {
      setAdminData(data.data)
    }

    return { ...data, token: "" }
  }

  async logout() {
    return fetch(`${this.baseUrl}/admins/sign_out`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "web-super",
      },
    })
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  async post<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    })
  }
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, message: string, data: unknown = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export const api = new ApiClient(API_BASE_URL)
export default api
