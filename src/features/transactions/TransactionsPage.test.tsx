import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteTransaction, getTransactions, updateTransaction } from '../../api/transactions'
import { getAccounts } from '../../api/accounts'
import { TransactionsPage } from './TransactionsPage'

vi.mock('../../features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-id', email: 'person@example.test', displayName: 'Test Person', role: 'USER' },
  }),
}))

vi.mock('../../api/transactions', () => ({
  deleteTransaction: vi.fn(),
  getTransactions: vi.fn(),
  updateTransaction: vi.fn(),
  createTransaction: vi.fn(),
  createTransactions: vi.fn(),
  getAllTransactions: vi.fn(),
  importCsv: vi.fn(),
}))

vi.mock('../../api/accounts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/accounts')>()
  return { ...actual, getAccounts: vi.fn() }
})

const account = {
  id: '9a367ac2-ae09-4da9-9b30-7cb9ee1439be',
  name: 'Daily',
  accountType: 'SAVINGS' as const,
  currency: 'INR',
  openingBalance: 500,
  currentBalance: 500,
  status: 'ACTIVE' as const,
  createdAt: '2026-10-12T00:00:00Z',
  updatedAt: '2026-10-12T00:00:00Z',
}

const transaction = {
  id: 7,
  amount: 42.5,
  type: 'EXPENSE' as const,
  category: 'Groceries',
  description: 'Weekly shop',
  transactionDate: '2026-10-12',
  accountId: account.id,
  transactionVersion: 1,
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter><TransactionsPage /></MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...view, client }
}

describe('TransactionsPage actions', () => {
  beforeEach(() => {
    vi.mocked(getAccounts).mockResolvedValue([account])
    vi.mocked(getTransactions).mockResolvedValue({
      content: [transaction],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 10,
      first: true,
      last: true,
    })
    vi.mocked(updateTransaction).mockResolvedValue({ ...transaction, category: 'Food' })
    vi.mocked(deleteTransaction).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('prepopulates and saves an edited transaction, then refreshes the list', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Groceries transaction' }))

    await screen.findByRole('option', { name: 'Daily' })
    expect(screen.getByLabelText('Amount (INR)')).toHaveValue(42.5)
    expect(screen.getByLabelText('Category')).toHaveValue('Groceries')
    await waitFor(() => expect(screen.getByLabelText('Account')).toHaveValue(account.id))
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Food' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateTransaction).toHaveBeenCalled())
    await screen.findByText('Transaction updated. Account balance and history update asynchronously.')
    expect(updateTransaction).toHaveBeenCalledWith(7, {
      amount: 42.5,
      type: 'EXPENSE',
      category: 'Food',
      description: 'Weekly shop',
      transactionDate: '2026-10-12',
      accountId: account.id,
    })
    await waitFor(() => expect(getTransactions).toHaveBeenCalledTimes(2))
  })

  it('requires confirmation before deleting and reports a failed delete', async () => {
    vi.mocked(deleteTransaction).mockRejectedValue(new Error('Delete failed'))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Groceries transaction' }))

    expect(deleteTransaction).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Delete transaction' }))

    await screen.findByText('Delete failed')
    expect(deleteTransaction).toHaveBeenCalledWith(7)
  })

  it('deletes only after confirmation and refreshes transaction data', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Groceries transaction' }))

    expect(deleteTransaction).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Delete transaction' }))

    await screen.findByText('Transaction deleted. Account balance and history update asynchronously.')
    expect(deleteTransaction).toHaveBeenCalledWith(7)
    await waitFor(() => expect(getTransactions).toHaveBeenCalledTimes(2))
  })
})
