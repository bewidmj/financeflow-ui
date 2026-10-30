import { accountApi } from './client'
import type {
  Account,
  AccountInput,
  LedgerEntry,
  Page,
  Transfer,
  TransferInput,
} from '../types/api'

export async function getAccounts(): Promise<Account[]> {
  const response = await accountApi.get<Account[]>('/api/v1/accounts')
  return response.data
}

export async function getAccount(id: string): Promise<Account> {
  const response = await accountApi.get<Account>(`/api/v1/accounts/${id}`)
  return response.data
}

export async function createAccount(input: AccountInput): Promise<Account> {
  const response = await accountApi.post<Account>('/api/v1/accounts', input)
  return response.data
}

export async function updateAccount(id: string, input: Pick<AccountInput, 'name' | 'accountType'>): Promise<Account> {
  const response = await accountApi.put<Account>(`/api/v1/accounts/${id}`, input)
  return response.data
}

export async function closeAccount(id: string): Promise<Account> {
  const response = await accountApi.delete<Account>(`/api/v1/accounts/${id}`)
  return response.data
}

export async function getAccountTransactions(id: string): Promise<Page<LedgerEntry>> {
  const response = await accountApi.get<Page<LedgerEntry>>(`/api/v1/accounts/${id}/transactions`, {
    params: { page: 0, size: 100 },
  })
  return response.data
}

export async function getTransfers(): Promise<Page<Transfer>> {
  const response = await accountApi.get<Page<Transfer>>('/api/v1/transfers', {
    params: { page: 0, size: 100 },
  })
  return response.data
}

export async function createTransfer(input: TransferInput, idempotencyKey: string): Promise<Transfer> {
  const response = await accountApi.post<Transfer>('/api/v1/transfers', input, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return response.data
}
