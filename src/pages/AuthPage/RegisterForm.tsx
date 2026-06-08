import { useState } from 'react'
import styles from './AuthPage.module.scss'
import { validate, type FormErrors } from './authValidation'
import { supabase } from '../../supabaseClient'
import EmailSent from './EmailSent'
import GoogleIcon from '../../img/google.svg'
import EyeIcon from '../../img/eye.svg'
import EyeOffIcon from '../../img/eye-off.svg'

interface Props {
  onSwitch: () => void
}

function RegisterForm({ onSwitch }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FormErrors & { confirm?: string }>({})
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors: typeof errors = validate(email, password)

    if (confirm !== password) {
      validationErrors.confirm = 'Пароли не совпадают'
    }

    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      if (error.message.includes('User already registered')) {
        setErrors({ general: 'Аккаунт с таким email уже существует' })
      } else {
        setErrors({ general: 'Произошла ошибка. Попробуйте снова' })
      }
      return
    }

    setEmailSent(true)
  }

  if (emailSent) {
    return <EmailSent email={email} onBack={() => setEmailSent(false)} />
  }

  return (
    <>
      <h1 className={styles.title}>Регистрация</h1>
      <p className={styles.subtitle}>Создайте аккаунт</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldWrap}>
          <input
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
        </div>

        <div className={styles.fieldWrap}>
          <div className={styles.passwordWrap}>
            <input
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword(prev => !prev)}
              aria-label="Показать пароль"
            >
              <img src={showPassword ? EyeOffIcon : EyeIcon} alt="" />
            </button>
          </div>
          {errors.password && <span className={styles.errorText}>{errors.password}</span>}
        </div>

        <div className={styles.fieldWrap}>
          <div className={styles.passwordWrap}>
            <input
              className={`${styles.input} ${errors.confirm ? styles.inputError : ''}`}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Повторите пароль"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowConfirm(prev => !prev)}
              aria-label="Показать пароль"
            >
              <img src={showConfirm ? EyeOffIcon : EyeIcon} alt="" />
            </button>
          </div>
          {errors.confirm && <span className={styles.errorText}>{errors.confirm}</span>}
        </div>

        {errors.general && <span className={styles.errorText}>{errors.general}</span>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className={styles.divider}>
        <span>Или зарегистрироваться через</span>
      </div>

      <button
        className={styles.googleBtn}
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'http://localhost:5173/dashboard' } })}
      >
        <img src={GoogleIcon} alt="Google" />
        Google
      </button>

      <p className={styles.signupText}>
        Уже есть аккаунт? <button className={styles.switchBtn} onClick={onSwitch}>Войти</button>
      </p>
    </>
  )
}

export default RegisterForm
