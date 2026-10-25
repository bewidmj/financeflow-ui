import { AlertCircle, LoaderCircle, WalletCards } from 'lucide-react'
import { apiErrorMessage } from '../../lib/errors'

export function LoadingPage({ label = 'Loading your finances…' }: { label?: string }) {
  return (
    <main className="loading-screen">
      <div className="loading-brand"><WalletCards size={24} /> FinanceFlow</div>
      <LoaderCircle className="spin" size={24} aria-hidden="true" />
      <p>{label}</p>
    </main>
  )
}

export function LoadingBlock({ label = 'Loading data…' }: { label?: string }) {
  return (
    <div className="state-block" role="status">
      <LoaderCircle className="spin" size={22} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={19} />
      <div>
        <strong>We couldn’t load this information</strong>
        <p>{apiErrorMessage(error)}</p>
        {onRetry && <button className="button button-secondary button-small" onClick={onRetry}>Try again</button>}
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><WalletCards size={22} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
