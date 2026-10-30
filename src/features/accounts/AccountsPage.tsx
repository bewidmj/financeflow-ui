import { ArrowLeftRight, Plus, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/common/States'
import { useAccounts } from '../../hooks/useFinanceQueries'
import type { Account } from '../../types/api'

function money(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}

export function AccountsPage() {
  const query = useAccounts()
  const accounts = query.data ?? []
  const activeCount = accounts.filter((account) => account.status === 'ACTIVE').length

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR FINANCIAL HOME</span>
          <h1>Accounts</h1>
          <p>Keep balances and activity organized across your accounts.</p>
        </div>
        <div className="heading-actions">
          <Link className="button button-secondary" to="/transfers"><ArrowLeftRight size={16} /> Transfer money</Link>
          <Link className="button button-primary" to="/accounts/new"><Plus size={17} /> Add account</Link>
        </div>
      </div>
      {query.isLoading ? <LoadingBlock label="Loading accounts…" /> : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <section className="accounts-summary-grid" aria-label="Account summary">
            <article className="panel accounts-summary-card">
              <span>All accounts</span>
              <strong>{accounts.length}</strong>
              <small>Across your FinanceFlow workspace</small>
            </article>
            <article className="panel accounts-summary-card">
              <span>Open accounts</span>
              <strong>{activeCount}</strong>
              <small>Ready for transfers and activity</small>
            </article>
          </section>
          {accounts.length === 0 ? (
            <section className="panel">
              <EmptyState
                title="No accounts yet"
                description="Create an account to track its balance and account-specific activity."
                action={<Link className="button button-primary" to="/accounts/new"><Plus size={16} /> Create your first account</Link>}
              />
            </section>
          ) : (
            <section className="account-grid" aria-label="Your accounts">
              {accounts.map((account) => <AccountCard key={account.id} account={account} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function AccountCard({ account }: { account: Account }) {
  return (
    <article className="panel account-card">
      <div className="account-card-top">
        <span className="account-type-icon"><WalletCards size={19} /></span>
        <span className={`account-status account-status-${account.status.toLowerCase()}`}>{account.status}</span>
      </div>
      <span className="account-type-label">{account.accountType.replace('_', ' ')}</span>
      <h2>{account.name}</h2>
      <strong className="account-balance">{money(account.currentBalance, account.currency)}</strong>
      <div className="account-card-footer">
        <span>{account.currency}</span>
        <Link className="text-link" to={`/accounts/${account.id}`}>View details <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  )
}
