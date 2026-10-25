import type { AdminOverview, TransactionFilters, TransactionPage, UserPage, UserProfile } from '../types/api'
import { financeApi, identityApi } from './client'

export async function getAdminOverview(): Promise<AdminOverview> {
  const response = await identityApi.get<AdminOverview>('/api/v1/admin/overview')
  return response.data
}

export async function getAdminUsers(
  search: string,
  page: number,
  size: number,
): Promise<UserPage> {
  const response = await identityApi.get<UserPage>('/api/v1/admin/users', {
    params: { search: search || undefined, page, size },
  })
  return response.data
}

export async function getAdminUser(id: string): Promise<UserProfile> {
  const response = await identityApi.get<UserProfile>(`/api/v1/admin/users/${encodeURIComponent(id)}`)
  return response.data
}

export async function getAdminTransactions(
  ownerId: string,
  filters: TransactionFilters,
): Promise<TransactionPage> {
  const response = await financeApi.get<TransactionPage>(
    `/api/v1/admin/users/${encodeURIComponent(ownerId)}/transactions`,
    { params: { ...filters, category: filters.category?.trim() || undefined } },
  )
  return response.data
}
