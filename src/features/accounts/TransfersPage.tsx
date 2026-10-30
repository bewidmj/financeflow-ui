import { ArrowLeftRight, CircleCheck, Send } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/common/States'
import { useAccounts, useTransferMutations, useTransfers } from '../../hooks/useFinanceQueries'
import { apiErrorMessage } from '../../lib/errors'
import type { TransferInput } from '../../types/api'

function money(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}

export function TransfersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const accountsQuery = useAccounts()
  const transfersQuery = useTransfers()
  const transferMutation = useTransferMutations()
  const accounts = accountsQuery.data ?? []
  const activeAccounts = accounts.filter((account) => account.status === 'ACTIVE')
  const [selectedDestinationAccountId, setSelectedDestinationAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const idempotencyKey = useRef<string | null>(null)

  const requestedSourceAccountId = searchParams.get('source') ?? ''
  const sourceAccountId = activeAccounts.some((account) => account.id === requestedSourceAccountId)
    ? requestedSourceAccountId
    : activeAccounts[0]?.id ?? ''
  const destinationAccountId = activeAccounts.some((account) =>
    account.id === selectedDestinationAccountId && account.id !== sourceAccountId)
    ? selectedDestinationAccountId
    : activeAccounts.find((account) => account.id !== sourceAccountId)?.id ?? ''

  const source = activeAccounts.find((account) => account.id === sourceAccountId)
  const destination = activeAccounts.find((account) => account.id === destinationAccountId)
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSuccess('')
    if (!source || !destination) {
      setFormError('Choose two active accounts to make a transfer.')
      return
    }
    if (source.id === destination.id) {
      setFormError('Choose different source and destination accounts.')
      return
    }
    if (source.currency !== destination.currency) {
      setFormError('Transfers between different currencies are not supported.')
      return
    }
    if (!/^(0|[1-9]\d{0,16})(\.\d{1,2})?$/.test(amount) || /^0(?:\.0{1,2})?$/.test(amount)) {
      setFormError('Enter an amount greater than zero with up to 2 decimal places.')
      return
    }

    const input: TransferInput = {
      sourceAccountId: source.id,
      destinationAccountId: destination.id,
      amount,
      description: description.trim() || undefined,
    }
    const requestIdempotencyKey = idempotencyKey.current ?? crypto.randomUUID()
    idempotencyKey.current = requestIdempotencyKey
    try {
      await transferMutation.mutateAsync({
        input,
        idempotencyKey: requestIdempotencyKey,
      })
      idempotencyKey.current = null
      setAmount('')
      setDescription('')
      setSuccess(`Transfer sent from ${source.name} to ${destination.name}.`)
    } catch (error) {
      setFormError(apiErrorMessage(error))
    }
  }

  const historyQueryError = accountsQuery.error || transfersQuery.error

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MOVE MONEY</span>
          <h1>Transfers</h1>
          <p>Move funds securely between your active accounts.</p>
        </div>
      </div>
      {accountsQuery.isLoading ? <LoadingBlock label="Loading accounts…" /> : accountsQuery.error ? (
        <ErrorState error={accountsQuery.error} onRetry={() => void accountsQuery.refetch()} />
      ) : (
        <section className="panel transfer-form-panel">
          <div className="panel-heading">
            <div><h2>Make a transfer</h2><p>Transfers are immediate and recorded in both account ledgers.</p></div>
            <span className="account-type-icon"><ArrowLeftRight size={18} /></span>
          </div>
          {formError && <div className="form-alert" role="alert">{formError}</div>}
          {success && <div className="success-banner" role="status"><CircleCheck size={16} /> {success}</div>}
          {activeAccounts.length < 2 ? (
            <div className="transfer-empty">
              <p>You need at least two active accounts in the same currency to transfer money.</p>
              <Link className="text-link" to="/accounts/new">Create an account</Link>
            </div>
          ) : (
            <form className="form-stack" onSubmit={(event) => void submit(event)}>
              <div className="form-grid">
                <label className="field">
                  <span>From account</span>
                  <select
                    value={sourceAccountId}
                    onChange={(event) => {
                      idempotencyKey.current = null
                      const next = new URLSearchParams(searchParams)
                      next.set('source', event.target.value)
                      setSearchParams(next, { replace: true })
                    }}
                    required
                  >
                    {activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency} {money(account.currentBalance, account.currency)}</option>)}
                  </select>
                  {source && <small>Available: {money(source.currentBalance, source.currency)}</small>}
                </label>
                <label className="field">
                  <span>To account</span>
                  <select
                    value={destinationAccountId}
                    onChange={(event) => {
                      idempotencyKey.current = null
                      setSelectedDestinationAccountId(event.target.value)
                    }}
                    required
                  >
                    {activeAccounts.filter((account) => account.id !== sourceAccountId).map((account) => (
                      <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Amount {source && <small>({source.currency})</small>}</span>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => {
                    idempotencyKey.current = null
                    setAmount(event.target.value)
                  }}
                  required
                />
              </label>
              <label className="field">
                <span>Description <small>Optional</small></span>
                <input
                  maxLength={500}
                  placeholder="e.g. Monthly savings"
                  value={description}
                  onChange={(event) => {
                    idempotencyKey.current = null
                    setDescription(event.target.value)
                  }}
                />
              </label>
              <div className="button-row">
                <button className="button button-primary" type="submit" disabled={transferMutation.isPending}>
                  <Send size={15} /> {transferMutation.isPending ? 'Sending…' : 'Transfer money'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <section className="panel">
        <div className="panel-heading account-ledger-heading">
          <div><h2>Transfer history</h2><p>Recent transfers between your accounts.</p></div>
        </div>
        {historyQueryError ? <ErrorState error={historyQueryError} onRetry={() => {
          void accountsQuery.refetch()
          void transfersQuery.refetch()
        }} /> : transfersQuery.isLoading ? <LoadingBlock label="Loading transfer history…" /> : !transfersQuery.data?.content.length ? (
          <EmptyState title="No transfers yet" description="Completed transfers will appear here." />
        ) : (
          <div className="table-scroll">
            <table className="data-table transfer-history-table">
              <thead><tr><th>From</th><th aria-label="Direction"></th><th>To</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {transfersQuery.data.content.map((transfer) => (
                  <tr key={transfer.id}>
                    <td>{accountNames.get(transfer.sourceAccountId) ?? 'Account'}</td>
                    <td><ArrowLeftRight size={14} aria-hidden="true" /></td>
                    <td>{accountNames.get(transfer.destinationAccountId) ?? 'Account'}</td>
                    <td>{money(transfer.amount, transfer.currency)}</td>
                    <td><span className="account-status account-status-active">{transfer.status}</span></td>
                    <td>{new Date(transfer.createdAt).toLocaleString()}</td>
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
