import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownUp, ArrowDownLeft, ArrowUpRight, FileUp, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/common/States'
import { Modal } from '../../components/common/Modal'
import { useTransactionMutations, useTransactionPage } from '../../hooks/useFinanceQueries'
import { apiErrorMessage } from '../../lib/errors'
import { formatCurrency, formatDate } from '../../lib/format'
import type { Transaction, TransactionFilters, TransactionType } from '../../types/api'

const rowSchema = z.object({
  amount:   z.coerce.number().positive('Enter an amount greater than zero.').max(Number.MAX_SAFE_INTEGER),
  type: z.enum(['EXPENSE', 'INCOME']),
  category: z.string().trim().min(1, 'Enter a category.').max(100),
  description: z.string().max(500, 'Description must be 500 characters or fewer.'),
  transactionDate: z.string().min(1, 'Choose a date.').refine((value) => value <= new Date().toISOString().slice(0, 10), 'Date cannot be in the future.'),
})
const transactionSchema = z.object({
  transactions: z.array(rowSchema).min(1).max(100, 'A batch can contain at most 100 transactions.'),
})
type TransactionForm = z.infer<typeof transactionSchema>
type TransactionFormInput = z.input<typeof transactionSchema>

const newTransaction = () => ({
  amount: '',
  type: 'EXPENSE' as const,
  category: '',
  description: '',
  transactionDate: new Date().toISOString().slice(0, 10),
})

export function TransactionsPage() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sortField, setSortField] = useState('transactionDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [type, setType] = useState<TransactionType | ''>('')
  const [category, setCategory] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [searchText, setSearchText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const filters = useMemo<TransactionFilters>(() => ({
    page,
    size,
    sort: `${sortField},${sortDirection}`,
    type: type || undefined,
    category: category || undefined,
    from: from || undefined,
    to: to || undefined,
  }), [page, size, sortField, sortDirection, type, category, from, to])
  const query = useTransactionPage(filters)

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      setShowForm(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const rows = query.data?.content ?? []
  const visibleRows = searchText.trim()
    ? rows.filter((row) => `${row.category} ${row.description ?? ''}`.toLowerCase().includes(searchText.toLowerCase()))
    : rows

  function changeSort(field: string) {
    if (field === sortField) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else {
      setSortField(field)
      setSortDirection(field === 'transactionDate' ? 'desc' : 'asc')
    }
    setPage(0)
  }

  function clearFilters() {
    setType('')
    setCategory('')
    setFrom('')
    setTo('')
    setSearchText('')
    setPage(0)
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><span className="eyebrow">MONEY IN MOTION</span><h1>Transactions</h1><p>See the details behind every in and out.</p></div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={() => setShowImport(true)}><FileUp size={17} /> Import CSV</button>
          <button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Add transaction</button>
        </div>
      </div>

      {message && <div className="success-banner" role="status">{message}<button className="icon-button" aria-label="Dismiss message" onClick={() => setMessage('')}><X size={16} /></button></div>}
      {errorMessage && <div className="form-alert" role="alert">{errorMessage}<button className="icon-button" aria-label="Dismiss error" onClick={() => setErrorMessage('')}><X size={16} /></button></div>}
      <section className="panel transactions-panel">
        <div className="filter-toolbar">
          <label className="search-field"><Search size={17} /><input aria-label="Search current page" placeholder="Search this page…" value={searchText} onChange={(event) => setSearchText(event.target.value)} /></label>
          <label className="compact-filter"><span className="sr-only">Transaction type</span><select value={type} onChange={(event) => { setType(event.target.value as TransactionType | ''); setPage(0) }}><option value="">All types</option><option value="EXPENSE">Expenses</option><option value="INCOME">Income</option></select></label>
          <label className="compact-filter"><span className="sr-only">Category filter</span><input placeholder="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(0) }} /></label>
          <label className="date-filter"><span className="sr-only">From date</span><input type="date" aria-label="From date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(0) }} /></label>
          <span className="date-separator">to</span>
          <label className="date-filter"><span className="sr-only">To date</span><input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(0) }} /></label>
          {(type || category || from || to || searchText) && <button className="clear-filter" onClick={clearFilters}>Clear</button>}
        </div>

        {query.isLoading ? <LoadingBlock label="Loading transactions…" /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : query.data?.totalElements === 0 ? (
          <EmptyState title="No transactions found" description="Try adjusting your filters, or add a transaction to get started." action={<button className="button button-primary button-small" onClick={() => setShowForm(true)}><Plus size={15} /> Add transaction</button>} />
        ) : visibleRows.length === 0 ? (
          <EmptyState title="No matches on this page" description="Search is applied to the currently loaded page. Clear it to see all rows on this page." />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr>
                  <th><button className="sort-button" onClick={() => changeSort('transactionDate')}>Date <ArrowDownUp size={13} /></button></th>
                  <th>Transaction</th>
                  <th><button className="sort-button" onClick={() => changeSort('category')}>Category <ArrowDownUp size={13} /></button></th>
                  <th>Type</th>
                  <th className="align-right"><button className="sort-button" onClick={() => changeSort('amount')}>Amount <ArrowDownUp size={13} /></button></th>
                  <th><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {visibleRows.map((transaction) => <tr key={transaction.id}>
                    <td className="date-cell">{formatDate(transaction.transactionDate)}</td>
                    <td><div className="table-transaction"><span className={`transaction-symbol ${transaction.type === 'INCOME' ? 'symbol-income' : 'symbol-expense'}`}>{transaction.type === 'INCOME' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><span><strong>{transaction.description || transaction.category}</strong><small>#{transaction.id}</small></span></div></td>
                    <td><span className="category-badge">{transaction.category}</span></td>
                    <td><span className={`type-badge ${transaction.type === 'INCOME' ? 'type-income' : 'type-expense'}`}>{transaction.type === 'INCOME' ? 'Income' : 'Expense'}</span></td>
                    <td className={`align-right amount-cell ${transaction.type === 'INCOME' ? 'amount-income' : ''}`}>{transaction.type === 'INCOME' ? '+' : '−'}{formatCurrency(transaction.amount)}</td>
                    <td><div className="table-actions"><button className="icon-button" aria-label={`Edit ${transaction.category} transaction`} title="Edit transaction" onClick={() => { setMessage(''); setErrorMessage(''); setEditingTransaction(transaction) }}><Pencil size={15} /></button><button className="icon-button" aria-label={`Delete ${transaction.category} transaction`} title="Delete transaction" onClick={() => { setMessage(''); setErrorMessage(''); setDeletingTransaction(transaction) }}><Trash2 size={15} /></button></div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{query.data?.totalElements ?? 0} transactions</span><div className="pagination"><label>Rows <select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(0) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label><span>Page {page + 1} of {Math.max(1, query.data?.totalPages ?? 1)}</span><button className="button button-secondary button-small" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="button button-secondary button-small" disabled={query.data?.last ?? true} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
          </>
        )}
      </section>
      <p className="feature-note">Transactions can be created, edited, deleted, bulk-added, or imported from CSV.</p>

      {showForm && <TransactionModal onClose={() => setShowForm(false)} onDone={(text) => { setShowForm(false); setMessage(text); setErrorMessage('') }} />}
      {editingTransaction && <TransactionModal key={editingTransaction.id} transaction={editingTransaction} onClose={() => setEditingTransaction(null)} onDone={(text) => { setEditingTransaction(null); setMessage(text); setErrorMessage('') }} />}
      {deletingTransaction && <DeleteTransactionModal transaction={deletingTransaction} onClose={() => setDeletingTransaction(null)} onDone={(text) => { setDeletingTransaction(null); setMessage(text); setErrorMessage('') }} onError={setErrorMessage} />}
      {showImport && <CsvImportModal onClose={() => setShowImport(false)} onDone={(text) => { setShowImport(false); setMessage(text) }} />}
    </div>
  )
}

function TransactionModal({ transaction, onClose, onDone }: { transaction?: Transaction; onClose: () => void; onDone: (message: string) => void }) {
  const mutations = useTransactionMutations()
  const form = useForm<TransactionFormInput, unknown, TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactions: [transaction ? {
        amount: String(transaction.amount),
        type: transaction.type,
        category: transaction.category,
        description: transaction.description ?? '',
        transactionDate: transaction.transactionDate,
      } : newTransaction()],
    },
  })
  const fields = useFieldArray({ control: form.control, name: 'transactions' })
  const mutationError = transaction ? mutations.update.error : mutations.createBulk.error
  const saving = transaction ? mutations.update.isPending : mutations.createBulk.isPending

  async function submit(values: TransactionForm) {
    try {
      if (transaction) {
        await mutations.update.mutateAsync({ id: transaction.id, input: values.transactions[0] })
        onDone('Transaction updated successfully.')
        return
      }
      const response = await mutations.createBulk.mutateAsync(values.transactions)
      onDone(`${response.created} transaction${response.created === 1 ? '' : 's'} added successfully.`)
    } catch {
      // Mutation errors remain visible in the form below.
    }
  }

  return (
    <Modal title={transaction ? 'Edit transaction' : fields.fields.length > 1 ? 'Add transactions' : 'Add a transaction'} onClose={onClose} wide closeDisabled={saving}>
      <form className="modal-body form-stack" onSubmit={form.handleSubmit(submit)}>
        {fields.fields.map((field, index) => <fieldset className="transaction-fieldset" key={field.id}>
          {!transaction && fields.fields.length > 1 && <legend>Transaction {index + 1}<button className="remove-row" type="button" onClick={() => fields.remove(index)}>Remove</button></legend>}
          <div className="form-grid">
            <label className="field"><span>Amount (INR)</span><input type="number" min="0.01" step="0.01" placeholder="0.00" {...form.register(`transactions.${index}.amount`)} />{form.formState.errors.transactions?.[index]?.amount && <small className="field-error">{form.formState.errors.transactions[index]?.amount?.message}</small>}</label>
            <label className="field"><span>Type</span><select {...form.register(`transactions.${index}.type`)}><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select></label>
            <label className="field"><span>Category</span><input maxLength={100} placeholder="e.g. Groceries" {...form.register(`transactions.${index}.category`)} />{form.formState.errors.transactions?.[index]?.category && <small className="field-error">{form.formState.errors.transactions[index]?.category?.message}</small>}</label>
            <label className="field"><span>Date</span><input type="date" max={new Date().toISOString().slice(0, 10)} {...form.register(`transactions.${index}.transactionDate`)} />{form.formState.errors.transactions?.[index]?.transactionDate && <small className="field-error">{form.formState.errors.transactions[index]?.transactionDate?.message}</small>}</label>
            <label className="field field-full"><span>Description <small>(optional)</small></span><input maxLength={500} placeholder="Add a note" {...form.register(`transactions.${index}.description`)} />{form.formState.errors.transactions?.[index]?.description && <small className="field-error">{form.formState.errors.transactions[index]?.description?.message}</small>}</label>
          </div>
        </fieldset>)}
        {mutationError && <div className="form-alert" role="alert">{apiErrorMessage(mutationError)}</div>}
        <div className="modal-actions modal-actions-between">
          {!transaction && <button className="button button-secondary" type="button" disabled={fields.fields.length >= 100} onClick={() => fields.append(newTransaction())}><Plus size={16} /> Add another</button>}
          <div className="button-row"><button className="button button-secondary" type="button" disabled={saving} onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : transaction ? 'Save changes' : fields.fields.length > 1 ? `Save ${fields.fields.length} transactions` : 'Save transaction'}</button></div>
        </div>
      </form>
    </Modal>
  )
}

function DeleteTransactionModal({ transaction, onClose, onDone, onError }: {
  transaction: Transaction
  onClose: () => void
  onDone: (message: string) => void
  onError: (message: string) => void
}) {
  const mutation = useTransactionMutations().delete

  async function confirmDelete() {
    try {
      await mutation.mutateAsync(transaction.id)
      onDone('Transaction deleted successfully.')
    } catch (error) {
      onError(apiErrorMessage(error))
    }
  }

  return (
    <Modal title="Delete transaction?" onClose={onClose} closeDisabled={mutation.isPending}>
      <div className="modal-body form-stack">
        <p>Delete “{transaction.description || transaction.category}”? This action cannot be undone.</p>
        <div className="modal-actions">
          <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="button" disabled={mutation.isPending} onClick={() => void confirmDelete()}>{mutation.isPending ? 'Deleting…' : 'Delete transaction'}</button>
        </div>
      </div>
    </Modal>
  )
}

function CsvImportModal({ onClose, onDone }: { onClose: () => void; onDone: (message: string) => void }) {
  const mutation = useTransactionMutations().import
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Choose a CSV file to import.')
      return
    }
    setError('')
    try {
      const response = await mutation.mutateAsync(file)
      setResult(response)
      if (response.failed === 0) onDone(`${response.imported} transactions imported successfully.`)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    }
  }

  return (
    <Modal title="Import transactions" onClose={onClose}>
      <form className="modal-body form-stack" onSubmit={submit}>
        <div className="import-instructions"><FileUp size={20} /><div><strong>Bring in your transactions</strong><p>CSV must include: amount, type, category, description, transactionDate. Dates use YYYY-MM-DD; type is INCOME or EXPENSE.</p></div></div>
        <label className="upload-zone"><input type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); setError('') }} /><FileUp size={20} /><strong>{file?.name || 'Choose a CSV file'}</strong><span>CSV files only</span></label>
        {error && <div className="form-alert" role="alert">{error}</div>}
        {result && <div className={result.failed ? 'import-result import-partial' : 'import-result'} role="status"><strong>{result.imported} imported · {result.failed} failed</strong>{result.errors.length > 0 && <ul>{result.errors.slice(0, 8).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>}</div>}
        <div className="modal-actions"><button className="button button-secondary" type="button" onClick={onClose}>Close</button><button className="button button-primary" type="submit" disabled={!file || mutation.isPending}>{mutation.isPending ? 'Importing…' : 'Import CSV'}</button></div>
      </form>
    </Modal>
  )
}
