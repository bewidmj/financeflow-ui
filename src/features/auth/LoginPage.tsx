import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, LockKeyhole, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { register } from '../../api/auth'
import { apiErrorMessage } from '../../lib/errors'
import { useAuth } from './AuthProvider'

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

const registerSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your name.').max(100),
  email: z.email('Enter a valid email address.').max(320),
  password: z.string().min(10, 'Password must be at least 10 characters.').max(72),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export function LoginPage() {
  const [registering, setRegistering] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destination = (location.state as { from?: { pathname?: string } } | null)
    ?.from?.pathname || '/'

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  })

  async function onLogin(values: LoginForm) {
    setServerError('')
    try {
      await login(values.email, values.password)
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(apiErrorMessage(error))
    }
  }

  async function onRegister(values: RegisterForm) {
    setServerError('')
    try {
      await register(values)
      await login(values.email, values.password)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(apiErrorMessage(error))
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art" aria-label="FinanceFlow introduction">
        <div className="auth-brand"><span className="brand-mark"><WalletCards size={20} /></span> financeflow</div>
        <div className="auth-art-content">
          <span className="eyebrow light-eyebrow">YOUR FINANCES, CLEARER</span>
          <h1>A little more clarity.<br />A lot more confidence.</h1>
          <p>Bring your spending, saving, and plans together in one calm place.</p>
          <div className="art-stat">
            <div className="art-stat-icon"><LockKeyhole size={17} /></div>
            <div><strong>Private by design</strong><span>Your account data stays yours.</span></div>
          </div>
        </div>
        <span className="art-footnote">Make room for what matters.</span>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">{registering ? 'GET STARTED' : 'WELCOME BACK'}</span>
          <h2>{registering ? 'Create your account' : 'Good to see you'}</h2>
          <p className="auth-subtitle">{registering ? 'Start with a few details.' : 'Sign in to your personal finance space.'}</p>

          <div className="auth-switch" role="tablist" aria-label="Authentication">
            <button type="button" role="tab" aria-selected={!registering} className={!registering ? 'selected' : ''} onClick={() => { setRegistering(false); setServerError('') }}>Sign in</button>
            <button type="button" role="tab" aria-selected={registering} className={registering ? 'selected' : ''} onClick={() => { setRegistering(true); setServerError('') }}>Create account</button>
          </div>

          {serverError && <div className="form-alert" role="alert">{serverError}</div>}

          {registering ? (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="form-stack">
              <label className="field"><span>Full name</span><input autoComplete="name" placeholder="Your name" {...registerForm.register('displayName')} />{registerForm.formState.errors.displayName && <small className="field-error">{registerForm.formState.errors.displayName.message}</small>}</label>
              <label className="field"><span>Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" {...registerForm.register('email')} />{registerForm.formState.errors.email && <small className="field-error">{registerForm.formState.errors.email.message}</small>}</label>
              <label className="field"><span>Password</span><span className="password-control"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 10 characters" {...registerForm.register('password')} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((show) => !show)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>{registerForm.formState.errors.password && <small className="field-error">{registerForm.formState.errors.password.message}</small>}</label>
              <button className="button button-primary auth-submit" disabled={registerForm.formState.isSubmitting} type="submit">{registerForm.formState.isSubmitting ? 'Creating account…' : 'Create account'} <ArrowRight size={17} /></button>
            </form>
          ) : (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="form-stack">
              <label className="field"><span>Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" {...loginForm.register('email')} />{loginForm.formState.errors.email && <small className="field-error">{loginForm.formState.errors.email.message}</small>}</label>
              <label className="field"><span>Password</span><span className="password-control"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" {...loginForm.register('password')} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((show) => !show)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>{loginForm.formState.errors.password && <small className="field-error">{loginForm.formState.errors.password.message}</small>}</label>
              <button className="button button-primary auth-submit" disabled={loginForm.formState.isSubmitting} type="submit">{loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
            </form>
          )}
          <p className="auth-security"><LockKeyhole size={14} /> Secure sign-in with your FinanceFlow account</p>
        </div>
      </section>
    </main>
  )
}
