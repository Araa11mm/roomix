import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './AuthPage.module.scss'
import { validate, type FormErrors } from './authValidation'
import { supabase } from '../../supabaseClient'
import ForgotPasswordForm from './ForgotPasswordForm'
import GoogleIcon from '../../img/google.svg'
import EyeIcon from '../../img/eye.svg'
import EyeOffIcon from '../../img/eye-off.svg'

interface Props {
  onSwitch: () => void
}

function LoginForm({ onSwitch }: Props) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors = validate(email, password)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrors({ general: 'Неверный email или пароль' })
      } else if (error.message.includes('Email not confirmed')) {
        setErrors({ general: 'Подтвердите email перед входом' })
      } else {
        setErrors({ general: 'Произошла ошибка. Попробуйте снова' })
      }
      return
    }

    navigate('/dashboard')
  }

  return (
    <>
      <h1 className={styles.title}>Вход</h1>
      <p className={styles.subtitle}>Введите email для продолжения</p>

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

        <div className={styles.row}>
          <button type="button" className={styles.forgot} onClick={() => setShowForgot(true)}>Забыли пароль?</button>
        </div>

        {errors.general && <span className={styles.errorText}>{errors.general}</span>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Входим...' : 'Войти'}
        </button>
      </form>

      <div className={styles.divider}>
        <span>Или войти через</span>
      </div>

      <button
        className={styles.googleBtn}
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })}
      >
        <img src={GoogleIcon} alt="Google" />
        Google
      </button>

      <p className={styles.signupText}>
        Нет аккаунта? <button className={styles.switchBtn} onClick={onSwitch}>Зарегистрироваться</button>
      </p>
    </>
  )
}

export default LoginForm
