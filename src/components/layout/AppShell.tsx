import {
  ArrowUpRight,
  ArrowLeftRight,
  LayoutDashboard,
  Landmark,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  Settings2,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = user?.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'FF'

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Wallet size={19} /></span><span>financeflow</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'Overview' && <span className="nav-indicator" />}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>
            <ShieldCheck size={18} strokeWidth={1.8} />
            <span>Admin</span>
          </NavLink>}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><ArrowUpRight size={16} /></div>
            <strong>Your money, in focus.</strong>
            <p>A clearer view of your everyday finances.</p>
          </div>
          <div className="profile-row">
            <div className="avatar">{initials}</div>
            <div className="profile-copy"><strong>{user?.displayName}</strong><span>{user?.email}</span></div>
            <button className="icon-button logout-button" aria-label="Log out" title="Log out" onClick={logout}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="topbar-title">Personal finance</div>
          <div className="topbar-right">
            <span className="secure-label"><span className="secure-dot" /> Secure workspace</span>
            <div className="avatar avatar-small">{initials}</div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
