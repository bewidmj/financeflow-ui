const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: import.meta.env.VITE_CURRENCY || 'INR',
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number | null | undefined): string {
  return currencyFormatter.format(amount ?? 0)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'Invalid date'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

export function monthValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(value: string, options: Intl.DateTimeFormatOptions = {
  month: 'long',
  year: 'numeric',
}): string {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', options).format(date)
}

export function monthRange(value: string): { from: string; to: string } {
  const [year, month] = value.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${value}-01`,
    to: `${value}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function lastMonths(count: number, end = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end.getFullYear(), end.getMonth() - count + index + 1, 1)
    return monthValue(date)
  })
}
