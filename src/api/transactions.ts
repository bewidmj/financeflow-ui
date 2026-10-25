import { financeApi } from './client'
import type {
  CsvImportResponse,
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionPage,
} from '../types/api'

export async function getTransactions(
  filters: TransactionFilters,
): Promise<TransactionPage> {
  const response = await financeApi.get<TransactionPage>('/api/v1/transactions', {
    params: {
      ...filters,
      type: filters.type || undefined,
      category: filters.category?.trim() || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    },
  })
  return response.data
}

export async function getAllTransactions(filters: {
  from?: string
  to?: string
} = {}): Promise<Transaction[]> {
  const firstPage = await getTransactions({
    ...filters,
    page: 0,
    size: 100,
    sort: 'transactionDate,desc',
  })
  if (firstPage.totalPages > 100) {
    throw new Error('This date range contains too many pages to calculate a complete dashboard.')
  }
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      getTransactions({
        ...filters,
        page: index + 1,
        size: 100,
        sort: 'transactionDate,desc',
      }),
    ),
  )
  return [firstPage, ...rest].flatMap((page) => page.content)
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const response = await financeApi.post<Transaction>('/api/v1/transactions', input)
  return response.data
}

export async function updateTransaction(
  id: number,
  input: TransactionInput,
): Promise<Transaction> {
  const response = await financeApi.put<Transaction>(`/api/v1/transactions/${id}`, input)
  return response.data
}

export async function deleteTransaction(id: number): Promise<void> {
  await financeApi.delete(`/api/v1/transactions/${id}`)
}

export interface BulkCreateResponse {
  created: number
  transactions: Transaction[]
}

export async function createTransactions(
  inputs: TransactionInput[],
): Promise<BulkCreateResponse> {
  const response = await financeApi.post<BulkCreateResponse>(
    '/api/v1/transactions/bulk',
    inputs,
  )
  return response.data
}

export async function importCsv(file: File): Promise<CsvImportResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await financeApi.post<CsvImportResponse>(
    '/api/v1/transactions/import',
    formData,
  )
  return response.data
}
