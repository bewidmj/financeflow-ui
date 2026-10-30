export type TransactionType = 'INCOME' | 'EXPENSE'
export type AccountType = 'SAVINGS' | 'CURRENT' | 'CASH' | 'WALLET' | 'CREDIT_CARD'
export type AccountStatus = 'ACTIVE' | 'CLOSED'
export type LedgerEntryType = 'DEBIT' | 'CREDIT'

export interface Account {
  id: string
  name: string
  accountType: AccountType
  currency: string
  openingBalance: number
  currentBalance: number
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface AccountInput {
  name: string
  accountType: AccountType
  currency?: string
  openingBalance: string
}

export interface LedgerEntry {
  id: string
  accountId: string
  referenceId: string
  entryType: LedgerEntryType
  amount: number
  description: string | null
  createdAt: string
}

export interface Transfer {
  id: string
  sourceAccountId: string
  destinationAccountId: string
  amount: number
  currency: string
  status: 'COMPLETED'
  description: string | null
  createdAt: string
}

export interface TransferInput {
  sourceAccountId: string
  destinationAccountId: string
  amount: string
  description?: string
}

export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface Transaction {
  id: number
  amount: number
  type: TransactionType
  category: string
  description: string | null
  transactionDate: string
}

export interface TransactionPage {
  content: Transaction[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface Budget {
  id: number
  category: string
  month: string
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  percentageUsed: number
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  role: string
  createdAt: string
}

export interface AdminOverview {
  userCount: number
}

export interface UserPage {
  content: UserProfile[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
}

export interface ApiError {
  status?: number
  error?: string
  message?: string
  fieldErrors?: Record<string, string>
  path?: string
}

export interface CsvImportResponse {
  imported: number
  failed: number
  errors: string[]
  processingTimeMs: number
}

export interface TransactionFilters {
  type?: TransactionType
  category?: string
  from?: string
  to?: string
  page: number
  size: number
  sort: string
}

export interface TransactionInput {
  amount: number
  type: TransactionType
  category: string
  description?: string
  transactionDate: string
}

export interface BudgetInput {
  category: string
  month: string
  amount: number
}
