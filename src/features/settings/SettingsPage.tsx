import { CalendarDays, CircleHelp, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { formatDate } from '../../lib/format'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const initials = user?.displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">YOUR SPACE</span><h1>Settings</h1><p>Manage your account and session.</p></div></div>
      <section className="settings-grid">
        <article className="panel settings-profile">
          <div className="settings-section-title"><div className="settings-section-icon"><UserRound size={18} /></div><div><h2>Account information</h2><p>Details associated with your FinanceFlow account.</p></div></div>
          <div className="settings-avatar-row"><div className="avatar avatar-large">{initials || 'FF'}</div><div><strong>{user?.displayName}</strong><span>FinanceFlow member</span></div></div>
          <dl className="profile-details">
            <div><dt>Email address</dt><dd>{user?.email}</dd></div>
            <div><dt>Account role</dt><dd><span className="role-chip">{user?.role}</span></dd></div>
            <div><dt>Member since</dt><dd><CalendarDays size={15} /> {user?.createdAt ? formatDate(user.createdAt.slice(0, 10)) : '—'}</dd></div>
          </dl>
          <p className="feature-note">Profile editing is not currently supported by the Identity Service.</p>
        </article>
        <div className="settings-side">
          <article className="panel security-card"><div className="settings-section-title"><div className="settings-section-icon"><ShieldCheck size={18} /></div><div><h2>Security</h2><p>Your session is protected.</p></div></div><div className="secure-session"><span className="secure-dot" /><span>Signed in with a verified RS256 token</span></div><p>Your token is held in this browser session and cleared when you log out or the session expires.</p></article>
          <article className="panel help-card"><div className="settings-section-title"><div className="settings-section-icon"><CircleHelp size={18} /></div><div><h2>Need a fresh start?</h2><p>End this session on this device.</p></div></div><button className="button button-danger-outline" onClick={logout}><LogOut size={16} /> Log out</button></article>
        </div>
      </section>
    </div>
  )
}
