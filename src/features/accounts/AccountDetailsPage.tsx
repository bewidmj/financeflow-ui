import { ArrowLeft, ArrowLeftRight, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/common/States'
import { useAccount, useAccountMutations, useAccountTransactions } from '../../hooks/useFinanceQueries'
import { apiErrorMessage } from '../../lib/errors'
import type { LedgerEntry } from '../../types/api'
import { useState } from 'react'

function money(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}

function entryLabel(entry: LedgerEntry) {
  if (entry.description) return entry.description
  return entry.entryType === 'DEBIT' ? 'Debit' : 'Credit'
}

export function AccountDetailsPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const accountQuery = useAccount(accountId)
  const ledgerQuery = useAccountTransactions(accountId)
  const mutations = useAccountMutations()
  const [errorMessage, setErrorMessage] = useState('')
  const account = accountQuery.data

  async function closeAccount() {
    if (!accountId || !account) return
    if (!window.confirm(`Close ${account.name}? Accounts can only be closed with a zero balance.`)) return
    setErrorMessage('')
    try {
      await mutations.close.mutateAsync(accountId)
      navigate('/accounts')
    } catch (error) {
      setErrorMessage(apiErrorMessage(error))
    }
  }

  if (accountQuery.isLoading) return <LoadingBlock label="Loading account…" />
  if (accountQuery.error) return <ErrorState error={accountQuery.error} onRetry={() => void accountQuery.refetch()} />
  if (!account) return null

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{account.accountType.replace('_', ' ')}</span>
          <h1>{account.name}</h1>
          <p>Account details and immutable ledger activity.</p>
        </div>
        <div className="heading-actions">
          <Link className="button button-secondary" to="/accounts"><ArrowLeft size={16} /> All accounts</Link>
          {account.status === 'ACTIVE' && <>
            <Link className="button button-secondary" to={`/accounts/${account.id}/edit`}><Pencil size={15} /> Edit</Link>
            <Link className="button button-primary" to={`/transfers?source=${account.id}`}><ArrowLeftRight size={16} /> Transfer</Link>
            <button className="button button-danger-outline" onClick={() => void closeAccount()} disabled={mutations.close.isPending}>
              <Trash2 size={15} /> Close
            </button>
          </>}
        </div>
      </div>
      {errorMessage && <div className="form-alert" role="alert">{errorMessage}</div>}
      <section className="account-detail-summary">
        <article className="panel account-detail-balance">
          <span>Current balance</span>
          <strong>{money(account.currentBalance, account.currency)}</strong>
          <small>{account.status === 'ACTIVE' ? 'Available account balance' : 'Closed account'}</small>
        </article>
        <article className="panel account-detail-meta">
          <span>Account type</span>
          <strong>{account.accountType.replace('_', ' ')}</strong>
          <small>Currency: {account.currency}</small>
        </article>
        <article className="panel account-detail-meta">
          <span>Opening balance</span>
          <strong>{money(account.openingBalance, account.currency)}</strong>
          <small>Opened {new Date(account.createdAt).toLocaleDateString()}</small>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading account-ledger-heading">
          <div><h2>Account activity</h2><p>Opening balance and completed transfer entries.</p></div>
        </div>
        {ledgerQuery.isLoading ? <LoadingBlock label="Loading account activity…" /> : ledgerQuery.error ? (
          <ErrorState error={ledgerQuery.error} onRetry={() => void ledgerQuery.refetch()} />
        ) : !ledgerQuery.data?.content.length ? (
          <EmptyState title="No account activity" description="Ledger entries will appear here as balances are credited or debited." />
        ) : (
          <div className="table-scroll">
            <table className="data-table account-ledger-table">
              <thead><tr><th>Activity</th><th>Type</th><th>Amount</th><th>Date</th><th>Reference</th></tr></thead>
              <tbody>
                {ledgerQuery.data.content.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entryLabel(entry)}</td>
                    <td><span className={`ledger-type ledger-type-${entry.entryType.toLowerCase()}`}>{entry.entryType}</span></td>
                    <td className={entry.entryType === 'DEBIT' ? 'text-danger' : 'text-success'}>
                      {entry.entryType === 'DEBIT' ? '−' : '+'}{money(entry.amount, account.currency)}
                    </td>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td><code>{entry.referenceId.slice(0, 8)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
