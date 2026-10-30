import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { ErrorState, LoadingBlock } from '../../components/common/States'
import { useAccount, useAccountMutations } from '../../hooks/useFinanceQueries'
import { apiErrorMessage } from '../../lib/errors'
import type { AccountInput, AccountType } from '../../types/api'

const accountTypes: AccountType[] = ['SAVINGS', 'CURRENT', 'CASH', 'WALLET', 'CREDIT_CARD']
const amountPattern = /^(0|[1-9]\d{0,16})(\.\d{1,2})?$/
const accountSchema = z.object({
  name: z.string().trim().min(1, 'Enter an account name.').max(100, 'Use 100 characters or fewer.'),
  accountType: z.enum(accountTypes),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Use a three-letter uppercase currency code.'),
  openingBalance: z.string().regex(amountPattern, 'Enter a non-negative amount with up to 2 decimal places.'),
})

type AccountForm = z.infer<typeof accountSchema>

export function AccountFormPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const accountQuery = useAccount(accountId)
  const mutations = useAccountMutations()
  const editing = Boolean(accountId)
  const [requestError, setRequestError] = useState('')
  const form = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      accountType: 'SAVINGS',
      currency: 'INR',
      openingBalance: '0.00',
    },
  })

  useEffect(() => {
    if (accountQuery.data) {
      form.reset({
        name: accountQuery.data.name,
        accountType: accountQuery.data.accountType,
        currency: accountQuery.data.currency,
        openingBalance: '0.00',
      })
    }
  }, [accountQuery.data, form])

  async function submit(values: AccountForm) {
    setRequestError('')
    const input: AccountInput = {
      name: values.name.trim(),
      accountType: values.accountType,
      currency: values.currency,
      openingBalance: values.openingBalance,
    }
    try {
      if (accountId) {
        await mutations.update.mutateAsync({
          id: accountId,
          input: { name: input.name, accountType: input.accountType },
        })
        navigate(`/accounts/${accountId}`)
      } else {
        const account = await mutations.create.mutateAsync(input)
        navigate(`/accounts/${account.id}`)
      }
    } catch (error) {
      setRequestError(apiErrorMessage(error))
    }
  }

  if (editing && accountQuery.isLoading) return <LoadingBlock label="Loading account…" />
  if (editing && accountQuery.error) return <ErrorState error={accountQuery.error} onRetry={() => void accountQuery.refetch()} />

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT MANAGEMENT</span>
          <h1>{editing ? 'Edit account' : 'Create account'}</h1>
          <p>{editing ? 'Update the account name and type.' : 'Add an account to keep your money in focus.'}</p>
        </div>
        <Link className="button button-secondary" to={editing && accountId ? `/accounts/${accountId}` : '/accounts'}>
          <ArrowLeft size={16} /> Back
        </Link>
      </div>
      <section className="panel account-form-panel">
        <form className="form-stack" onSubmit={form.handleSubmit(submit)}>
          {requestError && <div className="form-alert" role="alert">{requestError}</div>}
          <label className="field">
            <span>Account name</span>
            <input maxLength={100} placeholder="e.g. HDFC Savings" {...form.register('name')} />
            {form.formState.errors.name && <small className="field-error">{form.formState.errors.name.message}</small>}
          </label>
          <label className="field">
            <span>Account type</span>
            <select {...form.register('accountType')}>
              {accountTypes.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
            </select>
            {form.formState.errors.accountType && <small className="field-error">{form.formState.errors.accountType.message}</small>}
          </label>
          {!editing && (
            <>
              <label className="field">
                <span>Currency</span>
                <input
                  maxLength={3}
                  autoCapitalize="characters"
                  placeholder="INR"
                  {...form.register('currency', {
                    onChange: (event) => {
                      form.setValue('currency', event.target.value.toUpperCase())
                    },
                  })}
                />
                {form.formState.errors.currency && <small className="field-error">{form.formState.errors.currency.message}</small>}
              </label>
              <label className="field">
                <span>Opening balance</span>
                <input inputMode="decimal" placeholder="0.00" {...form.register('openingBalance')} />
                {form.formState.errors.openingBalance && <small className="field-error">{form.formState.errors.openingBalance.message}</small>}
              </label>
            </>
          )}
          {editing && <p className="account-form-note">Currency and opening balance are fixed after creation to preserve ledger history.</p>}
          <div className="button-row">
            <button
              className="button button-primary"
              type="submit"
              disabled={mutations.create.isPending || mutations.update.isPending}
            >
              {mutations.create.isPending || mutations.update.isPending
                ? 'Saving…'
                : editing ? 'Save changes' : 'Create account'}
            </button>
            <Link className="button button-secondary" to={editing && accountId ? `/accounts/${accountId}` : '/accounts'}>Cancel</Link>
          </div>
        </form>
      </section>
    </div>
  )
}
