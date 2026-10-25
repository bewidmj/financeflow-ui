import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getProfile, login as loginRequest } from '../../api/auth'
import {
  isTokenExpired,
  readToken,
  removeToken,
  tokenExpiration,
  unauthorizedEvent,
  writeToken,
} from '../../lib/auth-token'
import type { UserProfile } from '../../types/api'

interface AuthContextValue {
  user: UserProfile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => {
    const existing = readToken()
    if (existing && !isTokenExpired(existing)) return existing
    removeToken()
    return null
  })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const profileToken = useRef<string | null>(null)

  const logout = useCallback(() => {
    removeToken()
    profileToken.current = null
    setToken(null)
    setUser(null)
    setIsLoading(false)
    queryClient.clear()
  }, [queryClient])

  const loadProfile = useCallback(async (accessToken: string) => {
    profileToken.current = accessToken
    try {
      if (isTokenExpired(accessToken)) throw new Error('Session has expired.')
      const profile = await getProfile()
      setUser(profile)
    } catch (error) {
      logout()
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest({ email, password })
    if (response.tokenType.toLowerCase() !== 'bearer') {
      throw new Error('The identity service returned an unsupported token type.')
    }
    if (isTokenExpired(response.accessToken)) {
      throw new Error('The identity service returned an expired or invalid token.')
    }
    queryClient.clear()
    setIsLoading(true)
    writeToken(response.accessToken)
    setToken(response.accessToken)
    await loadProfile(response.accessToken)
  }, [loadProfile, queryClient])

  useEffect(() => {
    if (!token || profileToken.current === token) return
    void loadProfile(token).catch(() => undefined)
  }, [token, loadProfile])

  useEffect(() => {
    const onUnauthorized = () => logout()
    window.addEventListener(unauthorizedEvent, onUnauthorized)
    return () => window.removeEventListener(unauthorizedEvent, onUnauthorized)
  }, [logout])

  useEffect(() => {
    if (!token) return
    const expiresAt = tokenExpiration(token)
    if (!expiresAt) {
      logout()
      return
    }
    const timer = window.setTimeout(logout, Math.max(0, expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [token, logout])

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
