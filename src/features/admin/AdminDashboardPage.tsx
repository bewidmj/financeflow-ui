import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/common/States'
import { useAdminOverview, useAdminUser, useAdminUsers } from '../../hooks/useFinanceQueries'
import { formatDate } from '../../lib/format'

const PAGE_SIZE = 10

export function AdminDashboardPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedUserId, setSelectedUserId] = useState<string>()
  const overview = useAdminOverview()
  const users = useAdminUsers(search.trim(), page, PAGE_SIZE)
  const selectedUser = useAdminUser(selectedUserId)

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><span className="eyebrow">ADMINISTRATION</span><h1>Admin overview</h1><p>Manage visibility into FinanceFlow accounts.</p></div>
      </div>

      <section className="metric-grid admin-metric-grid" aria-label="Administrative statistics">
        <article className="metric-card">
          <div className="metric-top">Registered users</div>
          {overview.isLoading ? <LoadingBlock label="Loading user count…" /> : overview.error ? <ErrorState error={overview.error} onRetry={() => void overview.refetch()} /> : <strong className="metric-value">{overview.data?.userCount.toLocaleString() ?? '—'}</strong>}
          <span className="metric-hint">All accounts</span>
        </article>
      </section>

      <section className="panel admin-users-panel">
        <div className="panel-heading">
          <div><h2>Users</h2><p>Search by email address or display name.</p></div>
          <label className="search-field"><span className="sr-only">Search users</span><input aria-label="Search users" placeholder="Search users" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} /></label>
        </div>
        {users.isLoading ? <LoadingBlock label="Loading users…" /> : users.error ? <ErrorState error={users.error} onRetry={() => void users.refetch()} /> : users.data?.content.length === 0 ? (
          <EmptyState title="No users found" description={search ? 'Try a different search term.' : 'Registered accounts will appear here.'} />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th><span className="sr-only">Details</span></th></tr></thead>
                <tbody>{users.data?.content.map((user) => (
                  <tr key={user.id}>
                    <td>{user.displayName}</td>
                    <td>{user.email}</td>
                    <td><span className="type-badge">{user.role}</span></td>
                    <td>{formatDate(user.createdAt.slice(0, 10))}</td>
                    <td><button className="button button-secondary button-small" onClick={() => setSelectedUserId(user.id)}>Details</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>{users.data?.totalElements ?? 0} users</span>
              <div className="pagination">
                <span>Page {page + 1} of {Math.max(1, users.data?.totalPages ?? 1)}</span>
                <button className="button button-secondary button-small" disabled={users.data?.first ?? true} onClick={() => setPage((value) => value - 1)}>Previous</button>
                <button className="button button-secondary button-small" disabled={users.data?.last ?? true} onClick={() => setPage((value) => value + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedUserId && <section className="panel admin-user-details" aria-live="polite">
        {selectedUser.isLoading ? <LoadingBlock label="Loading account details…" /> : selectedUser.error ? <ErrorState error={selectedUser.error} onRetry={() => void selectedUser.refetch()} /> : selectedUser.data && (
          <>
            <div className="panel-heading"><div><h2>Account details</h2><p>{selectedUser.data.displayName}</p></div><button className="button button-secondary button-small" onClick={() => setSelectedUserId(undefined)}>Close</button></div>
            <dl className="admin-detail-grid">
              <div><dt>Email</dt><dd>{selectedUser.data.email}</dd></div>
              <div><dt>Role</dt><dd>{selectedUser.data.role}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(selectedUser.data.createdAt.slice(0, 10))}</dd></div>
              <div><dt>Account status</dt><dd>Not available</dd></div>
            </dl>
            <Link className="button button-primary button-small" to={`/admin/users/${encodeURIComponent(selectedUser.data.id)}/transactions`}>View transactions</Link>
          </>
        )}
      </section>}
    </div>
  )
}
