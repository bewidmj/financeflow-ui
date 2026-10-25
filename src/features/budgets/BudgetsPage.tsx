import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowUpRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/common/States'
import { Modal } from '../../components/common/Modal'
import { useBudgetMutations, useBudgets } from '../../hooks/useFinanceQueries'
import { apiErrorMessage } from '../../lib/errors'
import { formatCurrency, monthLabel, monthValue } from '../../lib/format'
import type { Budget, BudgetInput } from '../../types/api'

const budgetSchema = z.object({
  category: z.string().trim().min(1, 'Enter a category.').max(100),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Choose a month.'),
  amount: z.coerce.number().positive('Budget must be greater than zero.'),
})

type BudgetForm = z.infer<typeof budgetSchema>
type BudgetFormInput = z.input<typeof budgetSchema>

export function BudgetsPage() {
  const [month, setMonth] = useState(monthValue(new Date()))
  const [editing, setEditing] = useState<Budget | null>(null)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const query = useBudgets(month)
  const mutations = useBudgetMutations()
  const budgets = query.data ?? []
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetAmount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0)
  const remaining = totalBudget - totalSpent

  async function deleteBudget(budget: Budget) {
    const accepted = window.confirm(`Delete the ${budget.category} budget for ${monthLabel(budget.month)}?`)
    if (!accepted) return
    setErrorMessage('')
    try {
      await mutations.delete.mutateAsync(budget.id)
      setMessage(`${budget.category} budget deleted.`)
    } catch (error) {
      setErrorMessage(apiErrorMessage(error))
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><span className="eyebrow">PLAN WITH PURPOSE</span><h1>Budgets</h1><p>Give your priorities a little structure.</p></div>
        <div className="heading-actions">
          <label className="month-picker"><span className="sr-only">Select budget month</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
          <button className="button button-primary" onClick={() => { setCreating(true); setErrorMessage('') }}><Plus size={17} /> Create budget</button>
        </div>
      </div>
      {message && <div className="success-banner" role="status">{message}<button className="icon-button" aria-label="Dismiss message" onClick={() => setMessage('')}>×</button></div>}
      {errorMessage && <div className="form-alert" role="alert">{errorMessage}</div>}
      {query.isLoading ? <LoadingBlock label="Loading budgets…" /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : (
        <>
          <section className="budget-summary-grid">
            <article className="panel budget-summary-card"><span>Planned this month</span><strong>{formatCurrency(totalBudget)}</strong><small>{budgets.length} active {budgets.length === 1 ? 'budget' : 'budgets'}</small></article>
            <article className="panel budget-summary-card"><span>Spent so far</span><strong>{formatCurrency(totalSpent)}</strong><small>{monthLabel(month)}</small></article>
            <article className="panel budget-summary-card"><span>Left to spend</span><strong className={remaining < 0 ? 'text-danger' : ''}>{formatCurrency(remaining)}</strong><small>{remaining < 0 ? 'Over the planned amount' : 'Across your monthly budgets'}</small></article>
          </section>
          {budgets.length === 0 ? (
            <section className="panel"><EmptyState title={`No budgets for ${monthLabel(month)}`} description="Create a category budget to see spending progress and what remains." action={<button className="button button-primary" onClick={() => setCreating(true)}><Plus size={16} /> Create your first budget</button>} /></section>
          ) : (
            <section className="budget-card-grid">
              {budgets.map((budget) => {
                const ratio = Math.max(0, budget.percentageUsed)
                const over = ratio >= 100
                const near = ratio >= 80 && !over
                return (
                  <article key={budget.id} className="panel budget-card">
                    <div className="budget-card-top"><div className="budget-card-category-icon"><Wallet size={19} /></div><div className="budget-card-actions"><button className="icon-button" title={`Edit ${budget.category}`} aria-label={`Edit ${budget.category}`} onClick={() => { setEditing(budget); setErrorMessage('') }}><Pencil size={16} /></button><button className="icon-button danger-icon" title={`Delete ${budget.category}`} aria-label={`Delete ${budget.category}`} onClick={() => void deleteBudget(budget)}><Trash2 size={16} /></button></div></div>
                    <div className="budget-category-title">{budget.category}</div>
                    <div className="budget-amount-line"><strong>{formatCurrency(budget.spentAmount)}</strong><span>of {formatCurrency(budget.budgetAmount)}</span></div>
                    <div className="progress-track progress-large"><span className={over ? 'progress-danger' : near ? 'progress-warning' : ''} style={{ width: `${Math.min(ratio, 100)}%` }} /></div>
                    <div className="budget-card-foot"><span>{Math.round(ratio)}% used</span><span>{formatCurrency(budget.remainingAmount)} remaining</span></div>
                    {over && <div className="budget-warning"><AlertTriangle size={15} /> Over budget by {formatCurrency(Math.abs(budget.remainingAmount))}</div>}
                    {near && <div className="budget-near"><ArrowUpRight size={15} /> Approaching your budget limit</div>}
                  </article>
                )
              })}
            </section>
          )}
        </>
      )}
      {(creating || editing) && <BudgetModal budget={editing} month={month} onClose={() => { setCreating(false); setEditing(null) }} onDone={(text) => { setCreating(false); setEditing(null); setMessage(text) }} />}
    </div>
  )
}

function BudgetModal({
  budget,
  month,
  onClose,
  onDone,
}: {
  budget: Budget | null
  month: string
  onClose: () => void
  onDone: (message: string) => void
}) {
  const mutations = useBudgetMutations()
  const form = useForm<BudgetFormInput, unknown, BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: budget?.category ?? '',
      month: budget?.month ?? month,
      amount: budget?.budgetAmount ?? 0,
    },
  })
  const [error, setError] = useState('')

  async function submit(values: BudgetForm) {
    setError('')
    const input: BudgetInput = {
      category: values.category.trim(),
      month: values.month,
      amount: values.amount,
    }
    try {
      if (budget) {
        await mutations.update.mutateAsync({ id: budget.id, input })
        onDone('Budget updated successfully.')
      } else {
        await mutations.create.mutateAsync(input)
        onDone('Budget created successfully.')
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    }
  }

  const saving = mutations.create.isPending || mutations.update.isPending
  return (
    <Modal title={budget ? 'Edit budget' : 'Create a budget'} onClose={onClose}>
      <form className="modal-body form-stack" onSubmit={form.handleSubmit(submit)}>
        <label className="field"><span>Category</span><input placeholder="e.g. Dining" maxLength={100} {...form.register('category')} />{form.formState.errors.category && <small className="field-error">{form.formState.errors.category.message}</small>}</label>
        <label className="field"><span>Month</span><input type="month" {...form.register('month')} />{form.formState.errors.month && <small className="field-error">{form.formState.errors.month.message}</small>}</label>
        <label className="field"><span>Monthly limit (INR)</span><input type="number" min="0.01" step="0.01" placeholder="0.00" {...form.register('amount')} />{form.formState.errors.amount && <small className="field-error">{form.formState.errors.amount.message}</small>}</label>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <div className="modal-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : budget ? 'Save changes' : 'Create budget'}</button></div>
      </form>
    </Modal>
  )
}
