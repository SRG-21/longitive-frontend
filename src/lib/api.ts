import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'
import { useAuthStore } from '../stores/authStore'
import { loginPathFor } from './redirect'

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message
    if (Array.isArray(message)) return message.join(', ')
    if (message) return message
  }
  return fallback
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) throw new Error('No refresh token')

  const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
  useAuthStore.getState().setAccessToken(data.accessToken)
  return data.accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retried?: boolean }
    if (error.response?.status === 401 && !originalRequest._retried && useAuthStore.getState().refreshToken) {
      originalRequest._retried = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const newToken = await refreshPromise
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` }
        return api(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = loginPathFor(window.location)
        return Promise.reject(error)
      }
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = loginPathFor(window.location)
    }

    return Promise.reject(error)
  },
)
