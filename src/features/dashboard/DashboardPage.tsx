import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Plus,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAllTransactions, useBudgets } from '../../hooks/useFinanceQueries'
import { formatCurrency, formatDate, lastMonths, monthLabel, monthRange, monthValue } from '../../lib/format'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/common/States'
import type { Transaction } from '../../types/api'

const CATEGORY_COLORS = ['#279b72', '#83c5a8', '#f2b65c', '#8797c4', '#df8f74', '#bdd7ce']

function MetricCard({
  label,
  value,
  hint,
  kind,
  icon,
}: {
  label: string
  value: string
  hint: string
  kind: 'green' | 'red' | 'neutral'
  icon: React.ReactNode
}) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{label}</span><span className={`metric-icon metric-${kind}`}>{icon}</span></div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-hint">{hint}</span>
    </article>
  )
}

export function DashboardPage() {
  const [month, setMonth] = useState(monthValue(new Date()))
  const navigate = useNavigate()
  const months = useMemo(() => lastMonths(6, new Date(`${month}-01T00:00:00`)), [month])
  const range = useMemo(() => ({
    from: `${months[0]}-01`,
    to: monthRange(month).to,
  }), [months, month])
  const transactions = useAllTransactions(range.from, range.to)
  const budgets = useBudgets(month)
  const allTransactions = transactions.data ?? []

  const monthlyTransactions = useMemo(
    () => allTransactions.filter((item) => item.transactionDate.startsWith(month)),
    [allTransactions, month],
  )
  const income = monthlyTransactions
    .filter((item) => item.type === 'INCOME')
    .reduce((sum, item) => sum + item.amount, 0)
  const expenses = monthlyTransactions
    .filter((item) => item.type === 'EXPENSE')
    .reduce((sum, item) => sum + item.amount, 0)
  const savings = income - expenses
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0

  const trend = useMemo(() => months.map((value) => {
    const rows = allTransactions.filter((item) => item.transactionDate.startsWith(value))
    return {
      month: monthLabel(value, { month: 'short' }),
      income: rows.filter((item) => item.type === 'INCOME').reduce((sum, item) => sum + item.amount, 0),
      expenses: rows.filter((item) => item.type === 'EXPENSE').reduce((sum, item) => sum + item.amount, 0),
    }
  }), [allTransactions, months])

  const categories = useMemo(() => {
    const sums = new Map<string, number>()
    monthlyTransactions.filter((item) => item.type === 'EXPENSE').forEach((item) => {
      sums.set(item.category, (sums.get(item.category) ?? 0) + item.amount)
    })
    return [...sums.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [monthlyTransactions])

  const recent = [...monthlyTransactions]
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id)
    .slice(0, 5)
  const loading = transactions.isLoading || budgets.isLoading
  const error = transactions.error || budgets.error

  function openTransactions() {
    navigate('/transactions', { state: { openCreate: true } })
  }

  return (
    <div className="page-stack">
      <div className="page-heading dashboard-heading">
        <div><span className="eyebrow">YOUR MONEY AT A GLANCE</span><h1>Good day, here’s your overview.</h1><p>Stay close to where your money is going.</p></div>
        <label className="month-picker"><CalendarDays size={16} /><span className="sr-only">Select month</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      </div>
      {error && <ErrorState error={error} onRetry={() => { void transactions.refetch(); void budgets.refetch() }} />}
      {loading ? <LoadingBlock label="Gathering your latest financial activity…" /> : (
        <>
          <section className="metric-grid" aria-label="Monthly summary">
            <MetricCard label="Income" value={formatCurrency(income)} hint={`${monthlyTransactions.filter((item) => item.type === 'INCOME').length} deposits this month`} kind="green" icon={<ArrowDownLeft size={18} />} />
            <MetricCard label="Expenses" value={formatCurrency(expenses)} hint={`${monthlyTransactions.filter((item) => item.type === 'EXPENSE').length} transactions this month`} kind="red" icon={<ArrowUpRight size={18} />} />
            <MetricCard label="Net savings" value={formatCurrency(savings)} hint={income > 0 ? `${savingsRate}% of monthly income` : 'Add income to see your savings rate'} kind="neutral" icon={<TrendingUp size={18} />} />
          </section>
          {allTransactions.length === 0 ? (
            <section className="panel dashboard-empty">
              <EmptyState title="Your overview is ready when you are" description="Add your first transaction to see your income, spending trends, and budget progress here." action={<button className="button button-primary" onClick={openTransactions}><Plus size={17} /> Add a transaction</button>} />
            </section>
          ) : (
            <>
              <section className="dashboard-charts">
                <article className="panel chart-panel trend-panel">
                  <div className="panel-heading"><div><h2>Income & expenses</h2><p>Monthly activity for the last six months</p></div><span className="period-tag">6 months</span></div>
                  <div className="chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#299b72" stopOpacity={0.18} /><stop offset="95%" stopColor="#299b72" stopOpacity={0} /></linearGradient>
                          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e5a17e" stopOpacity={0.16} /><stop offset="95%" stopColor="#e5a17e" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid stroke="#edf0ee" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#89938d', fontSize: 12 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} width={62} tick={{ fill: '#89938d', fontSize: 11 }} tickFormatter={(value: number) => value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ border: '1px solid #e7ebe8', borderRadius: 12, boxShadow: '0 8px 24px #13221a12' }} />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#279b72" strokeWidth={2.5} fill="url(#incomeFill)" />
                        <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#e2a07b" strokeWidth={2.5} fill="url(#expenseFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-legend"><span><i className="legend-dot income-dot" /> Income</span><span><i className="legend-dot expense-dot" /> Expenses</span></div>
                </article>
                <article className="panel chart-panel category-panel">
                  <div className="panel-heading"><div><h2>Where it goes</h2><p>Spending by category</p></div><span className="period-tag">{monthLabel(month, { month: 'short' })}</span></div>
                  {categories.length ? (
                    <>
                      <div className="donut-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categories} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="88%" paddingAngle={3} stroke="none">
                              {categories.map((entry, index) => <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center"><strong>{formatCurrency(expenses)}</strong><span>total spent</span></div>
                      </div>
                      <div className="category-legend">{categories.slice(0, 4).map((category, index) => <div key={category.name}><span><i className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />{category.name}</span><strong>{formatCurrency(category.value)}</strong></div>)}</div>
                    </>
                  ) : <EmptyState title="No spending yet" description="Expense categories will appear here when you add transactions." />}
                </article>
              </section>
              <section className="dashboard-lower">
                <article className="panel recent-panel">
                  <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest transactions for {monthLabel(month)}</p></div><Link className="text-link" to="/transactions">View all <ArrowRight size={15} /></Link></div>
                  {recent.length ? <TransactionRows transactions={recent} /> : <EmptyState title="Nothing to show yet" description="Transactions for this month will show up here." />}
                </article>
                <article className="panel budget-overview">
                  <div className="panel-heading"><div><h2>Budget check-in</h2><p>{monthLabel(month)} spending plans</p></div><Link className="icon-link" to="/budgets" aria-label="View budgets"><ArrowRight size={17} /></Link></div>
                  {budgets.data?.length ? (
                    <div className="budget-mini-list">
                      {budgets.data.slice(0, 4).map((budget) => <div key={budget.id} className="budget-mini"><div className="budget-mini-head"><span>{budget.category}</span><strong>{formatCurrency(budget.spentAmount)} <small>of {formatCurrency(budget.budgetAmount)}</small></strong></div><div className="progress-track"><span className={budget.percentageUsed >= 100 ? 'progress-danger' : budget.percentageUsed >= 80 ? 'progress-warning' : ''} style={{ width: `${Math.min(Math.max(budget.percentageUsed, 0), 100)}%` }} /></div><div className="budget-mini-foot"><span>{Math.round(budget.percentageUsed)}% used</span><span>{formatCurrency(budget.remainingAmount)} left</span></div></div>)}
                    </div>
                  ) : <EmptyState title="No budgets for this month" description="Plan a category budget to keep spending on track." action={<Link className="button button-secondary button-small" to="/budgets"><Plus size={15} /> Create budget</Link>} />}
                  {budgets.data?.length ? <Link className="budget-link" to="/budgets">Manage budgets <ArrowRight size={15} /></Link> : null}
                </article>
              </section>
            </>
          )}
          <button className="floating-add" onClick={openTransactions}><Plus size={19} /><span>Add transaction</span></button>
        </>
      )}
    </div>
  )
}

function TransactionRows({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="recent-list">
      {transactions.map((transaction) => (
        <div className="recent-row" key={transaction.id}>
          <div className={`transaction-symbol ${transaction.type === 'INCOME' ? 'symbol-income' : 'symbol-expense'}`}>
            {transaction.type === 'INCOME' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
          </div>
          <div className="recent-copy"><strong>{transaction.description || transaction.category}</strong><span>{transaction.category} · {formatDate(transaction.transactionDate)}</span></div>
          <strong className={`recent-amount ${transaction.type === 'INCOME' ? 'amount-income' : ''}`}>{transaction.type === 'INCOME' ? '+' : '−'}{formatCurrency(transaction.amount)}</strong>
        </div>
      ))}
    </div>
  )
}
