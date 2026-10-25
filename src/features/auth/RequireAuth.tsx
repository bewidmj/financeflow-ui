import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { LoadingPage } from '../../components/common/States'

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <LoadingPage label="Restoring your session…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
