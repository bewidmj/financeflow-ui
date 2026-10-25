import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from './RequireAdmin'

const authState = vi.hoisted(() => ({
  user: null as null | { id: string; email: string; displayName: string; role: string },
  isLoading: false,
}))

vi.mock('./AuthProvider', () => ({
  useAuth: () => authState,
}))

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<h1>Admin content</h1>} />
        </Route>
        <Route path="/" element={<h1>Personal overview</h1>} />
        <Route path="/login" element={<h1>Sign in</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAdmin', () => {
  afterEach(() => {
    cleanup()
    authState.user = null
    authState.isLoading = false
  })

  it('redirects regular users away from admin routes', () => {
    authState.user = {
      id: 'user-id',
      email: 'person@example.test',
      displayName: 'Test Person',
      role: 'USER',
    }

    renderRoute()

    expect(screen.getByRole('heading', { name: 'Personal overview' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Admin content' })).not.toBeInTheDocument()
  })

  it('allows admins to view the protected route', () => {
    authState.user = {
      id: 'admin-id',
      email: 'admin@example.test',
      displayName: 'Local Admin',
      role: 'ADMIN',
    }

    renderRoute()

    expect(screen.getByRole('heading', { name: 'Admin content' })).toBeInTheDocument()
  })

  it('sends unauthenticated visitors to sign-in', () => {
    renderRoute()

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})
