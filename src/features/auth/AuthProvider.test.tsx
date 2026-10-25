import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getProfile, login } from '../../api/auth'
import { readToken } from '../../lib/auth-token'
import { AuthProvider, useAuth } from './AuthProvider'

vi.mock('../../api/auth', () => ({
  getProfile: vi.fn(),
  login: vi.fn(),
}))

function Harness() {
  const auth = useAuth()
  return (
    <div>
      <span>{auth.user?.email ?? 'signed out'}</span>
      <button onClick={() => void auth.login('person@example.test', 'password-test')}>login</button>
      <button onClick={auth.logout}>logout</button>
    </div>
  )
}

function createToken() {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  return `header.${payload}.signature`
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(login).mockResolvedValue({
      accessToken: createToken(),
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
    })
    vi.mocked(getProfile).mockResolvedValue({
      id: 'user-id',
      email: 'person@example.test',
      displayName: 'Test Person',
      role: 'USER',
      createdAt: '2026-10-25T00:00:00Z',
    })
  })

  afterEach(() => sessionStorage.clear())

  it('signs in, loads the profile, and clears session state and query cache on logout', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(['budgets', 'user-id'], [{ id: 1 }])
    render(
      <QueryClientProvider client={client}>
        <AuthProvider><Harness /></AuthProvider>
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await screen.findByText('person@example.test')
    expect(readToken()).toContain('.')
    expect(getProfile).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'logout' }))
    await waitFor(() => expect(screen.getByText('signed out')).toBeInTheDocument())
    expect(readToken()).toBeNull()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
    client.clear()
  })
})
