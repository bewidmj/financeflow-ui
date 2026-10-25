import axios from 'axios'
import { readToken, unauthorizedEvent } from '../lib/auth-token'

const financeBaseUrl = import.meta.env.VITE_FINANCEFLOW_API_URL || '/finance'
const identityBaseUrl = import.meta.env.VITE_IDENTITY_API_URL || '/identity'

export const financeApi = axios.create({
  baseURL: financeBaseUrl,
  timeout: 12_000,
  headers: { Accept: 'application/json' },
})

export const identityApi = axios.create({
  baseURL: identityBaseUrl,
  timeout: 12_000,
  headers: { Accept: 'application/json' },
})

for (const client of [financeApi, identityApi]) {
  client.interceptors.request.use((config) => {
    const token = readToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error)
          && error.response?.status === 401
          && error.config?.headers?.Authorization) {
        window.dispatchEvent(new Event(unauthorizedEvent))
      }
      return Promise.reject(error)
    },
  )
}
