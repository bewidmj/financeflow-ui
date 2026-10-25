import { financeApi } from './client'
import type { Budget, BudgetInput } from '../types/api'

export async function getBudgets(month: string): Promise<Budget[]> {
  const response = await financeApi.get<Budget[]>('/api/v1/budgets', {
    params: { month },
  })
  return response.data
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  const response = await financeApi.post<Budget>('/api/v1/budgets', input)
  return response.data
}

export async function updateBudget(
  id: number,
  input: BudgetInput,
): Promise<Budget> {
  const response = await financeApi.put<Budget>(`/api/v1/budgets/${id}`, input)
  return response.data
}

export async function deleteBudget(id: number): Promise<void> {
  await financeApi.delete(`/api/v1/budgets/${id}`)
}
