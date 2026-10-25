const TOKEN_KEY = 'financeflow.accessToken'

export function readToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function writeToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function tokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number
    }
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiresAt = tokenExpiration(token)
  return expiresAt === null || expiresAt <= now
}

export const unauthorizedEvent = 'financeflow:unauthorized'
