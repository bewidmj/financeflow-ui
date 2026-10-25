import { afterEach, describe, expect, it } from 'vitest'
import { isTokenExpired, readToken, removeToken, writeToken } from './auth-token'

function testToken(expiration: number): string {
  const payload = btoa(JSON.stringify({ exp: expiration }))
  return `header.${payload}.signature`
}

describe('session token storage', () => {
  afterEach(() => removeToken())

  it('stores a token for the current browser session and removes it on logout', () => {
    writeToken('opaque-test-token')
    expect(readToken()).toBe('opaque-test-token')
    removeToken()
    expect(readToken()).toBeNull()
  })

  it('identifies expired tokens without treating them as authenticated', () => {
    expect(isTokenExpired(testToken(100), 101_000)).toBe(true)
    expect(isTokenExpired(testToken(200), 101_000)).toBe(false)
    expect(isTokenExpired('malformed')).toBe(true)
  })
})
