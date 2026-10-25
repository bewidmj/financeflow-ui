import { Navigate, Outlet } from 'react-router-dom'
import { LoadingPage } from '../../components/common/States'
import { useAuth } from './AuthProvider'

export function RequireAdmin() {
  const { user, isLoading } = useAuth()
  if (isLoading && !user) return <LoadingPage label="Checking administrator access…" />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}
