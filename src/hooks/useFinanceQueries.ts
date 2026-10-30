import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminOverview,
  getAdminTransactions,
  getAdminUser,
  getAdminUsers,
} from '../api/admin'
import {
  closeAccount,
  createAccount,
  createTransfer,
  getAccount,
  getAccountTransactions,
  getAccounts,
  getTransfers,
  updateAccount,
} from '../api/accounts'
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
import type {
  AccountInput,
  BudgetInput,
  TransactionFilters,
  TransactionInput,
  TransferInput,
} from '../types/api'

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

export function useAccounts() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: getAccounts,
    enabled: Boolean(user),
  })
}

export function useAccount(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['accounts', user?.id, id],
    queryFn: () => {
      if (!id) throw new Error('An account ID is required.')
      return getAccount(id)
    },
    enabled: Boolean(user && id),
  })
}

export function useAccountTransactions(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['account-transactions', user?.id, id],
    queryFn: () => {
      if (!id) throw new Error('An account ID is required.')
      return getAccountTransactions(id)
    },
    enabled: Boolean(user && id),
  })
}

export function useTransfers() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['transfers', user?.id],
    queryFn: getTransfers,
    enabled: Boolean(user),
  })
}

export function useAccountMutations() {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] }),
    ])
  }
  return {
    create: useMutation({
      mutationFn: (input: AccountInput) => createAccount(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: {
        id: string
        input: Pick<AccountInput, 'name' | 'accountType'>
      }) => updateAccount(id, input),
      onSuccess: invalidate,
    }),
    close: useMutation({
      mutationFn: (id: string) => closeAccount(id),
      onSuccess: invalidate,
    }),
  }
}

export function useTransferMutations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: {
      input: TransferInput
      idempotencyKey: string
    }) => createTransfer(input, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['account-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['transfers'] }),
      ])
    },
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
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] }),
    ])
  }
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
          queryClient.invalidateQueries({ queryKey: ['accounts'] }),
          queryClient.invalidateQueries({ queryKey: ['account-transactions'] }),
        ])
      },
    }),
    delete: useMutation({
      mutationFn: (id: number) => deleteTransaction(id),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['transactions'] }),
          queryClient.invalidateQueries({ queryKey: ['budgets'] }),
          queryClient.invalidateQueries({ queryKey: ['accounts'] }),
          queryClient.invalidateQueries({ queryKey: ['account-transactions'] }),
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
