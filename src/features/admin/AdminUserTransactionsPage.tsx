import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/common/States'
import { useAdminTransactions, useAdminUser } from '../../hooks/useFinanceQueries'
import { formatCurrency, formatDate } from '../../lib/format'
import type { TransactionFilters } from '../../types/api'

const PAGE_SIZE = 10

export function AdminUserTransactionsPage() {
  const { userId } = useParams()
  const [page, setPage] = useState(0)
  const [category, setCategory] = useState('')
  const filters = useMemo<TransactionFilters>(() => ({
    page,
    size: PAGE_SIZE,
    sort: 'transactionDate,desc',
    category: category.trim() || undefined,
  }), [page, category])
  const user = useAdminUser(userId)
  const transactions = useAdminTransactions(userId, filters)

  if (!userId) return <Navigate to="/admin" replace />

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><span className="eyebrow">ADMINISTRATION</span><h1>User transactions</h1><p>{user.data?.email ?? 'Authorized account transaction view.'}</p></div>
        <Link className="button button-secondary" to="/admin">Back to admin</Link>
      </div>
      {user.isLoading ? <LoadingBlock label="Loading account…" /> : user.error ? <ErrorState error={user.error} onRetry={() => void user.refetch()} /> : (
        <section className="panel transactions-panel">
          <div className="filter-toolbar">
            <label className="compact-filter"><span className="sr-only">Filter transactions by category</span><input aria-label="Filter by category" placeholder="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(0) }} /></label>
          </div>
          {transactions.isLoading ? <LoadingBlock label="Loading transactions…" /> : transactions.error ? <ErrorState error={transactions.error} onRetry={() => void transactions.refetch()} /> : transactions.data?.content.length === 0 ? (
            <EmptyState title="No transactions found" description="This account has no matching transactions." />
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Type</th><th className="align-right">Amount</th></tr></thead>
                  <tbody>{transactions.data?.content.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.transactionDate)}</td>
                      <td>{transaction.category}</td>
                      <td>{transaction.description || '—'}</td>
                      <td><span className={`type-badge ${transaction.type === 'INCOME' ? 'type-income' : 'type-expense'}`}>{transaction.type}</span></td>
                      <td className={`align-right amount-cell ${transaction.type === 'INCOME' ? 'amount-income' : ''}`}>{formatCurrency(transaction.amount)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>{transactions.data?.totalElements ?? 0} transactions</span>
                <div className="pagination">
                  <span>Page {page + 1} of {Math.max(1, transactions.data?.totalPages ?? 1)}</span>
                  <button className="button button-secondary button-small" disabled={transactions.data?.first ?? true} onClick={() => setPage((value) => value - 1)}>Previous</button>
                  <button className="button button-secondary button-small" disabled={transactions.data?.last ?? true} onClick={() => setPage((value) => value + 1)}>Next</button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
