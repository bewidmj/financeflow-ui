import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminOverview,
  getAdminTransactions,
  getAdminUser,
  getAdminUsers,
} from '../api/admin'
import { useAuth } from '../features/auth/AuthProvider'
import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from '../api/budgets'
import {
  createTransaction,
  createTransactions,
  deleteTransaction,
  getAllTransactions,
  getTransactions,
  importCsv,
  updateTransaction,
} from '../api/transactions'
import type { BudgetInput, TransactionFilters, TransactionInput } from '../types/api'

export function useTransactionPage(filters: TransactionFilters) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: () => getTransactions(filters),
    enabled: Boolean(user),
  })
}

export function useAllTransactions(from?: string, to?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['transactions', user?.id, 'all', from, to],
    queryFn: () => getAllTransactions({ from, to }),
    enabled: Boolean(user),
  })
}

export function useBudgets(month: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['budgets', user?.id, month],
    queryFn: () => getBudgets(month),
    enabled: Boolean(user && month),
  })
}

export function useAdminOverview() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['admin', user?.id, 'overview'],
    queryFn: getAdminOverview,
    enabled: Boolean(user?.id && user.role === 'ADMIN'),
  })
}

export function useAdminUsers(search: string, page: number, size: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['admin', user?.id, 'users', search, page, size],
    queryFn: () => getAdminUsers(search, page, size),
    enabled: Boolean(user?.id && user.role === 'ADMIN'),
  })
}

export function useAdminUser(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['admin', user?.id, 'user', id],
    queryFn: () => {
      if (!id) throw new Error('A user ID is required.')
      return getAdminUser(id)
    },
    enabled: Boolean(user?.id && user.role === 'ADMIN' && id),
  })
}

export function useAdminTransactions(ownerId: string | undefined, filters: TransactionFilters) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['admin', user?.id, 'transactions', ownerId, filters],
    queryFn: () => {
      if (!ownerId) throw new Error('A user ID is required.')
      return getAdminTransactions(ownerId, filters)
    },
    enabled: Boolean(user?.id && user.role === 'ADMIN' && ownerId),
  })
}

export function useTransactionMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  return {
    create: useMutation({
      mutationFn: (input: TransactionInput) => createTransaction(input),
      onSuccess: invalidate,
    }),
    createBulk: useMutation({
      mutationFn: (inputs: TransactionInput[]) => createTransactions(inputs),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: number; input: TransactionInput }) =>
        updateTransaction(id, input),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['transactions'] }),
          queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        ])
      },
    }),
    delete: useMutation({
      mutationFn: (id: number) => deleteTransaction(id),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['transactions'] }),
          queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        ])
      },
    }),
    import: useMutation({
      mutationFn: (file: File) => importCsv(file),
      onSuccess: invalidate,
    }),
  }
}

export function useBudgetMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  return {
    create: useMutation({
      mutationFn: (input: BudgetInput) => createBudget(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: number; input: BudgetInput }) =>
        updateBudget(id, input),
      onSuccess: invalidate,
    }),
    delete: useMutation({
      mutationFn: (id: number) => deleteBudget(id),
      onSuccess: invalidate,
    }),
  }
}
