import { getAuthToken, logout as storageLogout } from "./storage"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getHeaders(options: RequestOptions = {}): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Client-Platform": "web-super",
    }

    if (options.requiresAuth) {
      const token = getAuthToken()
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }

    return headers
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options

    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders({ requiresAuth })

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...(fetchOptions.headers || {}),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Auto-logout on 401 Unauthorized (Expired/Invalid Token)
      if (response.status === 401) {
        storageLogout()
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
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "web-super",
      },
      body: JSON.stringify({
        admin: {
          email,
          password,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        errorData.status?.message || errorData.message || "Login failed",
        errorData,
      )
    }

    const data = await response.json()

    // Extract JWT from Authorization header
    const authHeader = response.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "") || ""

    return {
      ...data,
      token,
    }
  }

  async logout() {
    const token = getAuthToken()

    return fetch(`${this.baseUrl}/admins/sign_out`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "web-super",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  // Convenience methods
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  async post<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    })
  }
}

export class ApiError extends Error {
  status: number
  data: any

  constructor(status: number, message: string, data: any = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export const api = new ApiClient(API_BASE_URL)
export default api
