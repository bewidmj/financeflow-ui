import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { RequireAuth } from './features/auth/RequireAuth'
import { RequireAdmin } from './features/auth/RequireAdmin'
import { LoadingPage } from './components/common/States'

const LoginPage = lazy(() => import('./features/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const TransactionsPage = lazy(() => import('./features/transactions/TransactionsPage').then((module) => ({ default: module.TransactionsPage })))
const BudgetsPage = lazy(() => import('./features/budgets/BudgetsPage').then((module) => ({ default: module.BudgetsPage })))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const AdminDashboardPage = lazy(() => import('./features/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })))
const AdminUserTransactionsPage = lazy(() => import('./features/admin/AdminUserTransactionsPage').then((module) => ({ default: module.AdminUserTransactionsPage })))

function AppRoutes() {
  const { user, isLoading } = useAuth()
  if (isLoading && !user) return <LoadingPage />
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users/:userId/transactions" element={<AdminUserTransactionsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
