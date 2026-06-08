import { useState } from 'react'
import styles from './AuthPage.module.scss'
import { supabase } from '../../supabaseClient'
import { isValidEmail } from './authValidation'

interface Props {
  onBack: () => void
}

function ForgotPasswordForm({ onBack }: Props) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email) {
      setEmailError('Введите email')
      return
    }
    if (!isValidEmail(email)) {
      setEmailError('Введите корректный email')
      return
    }

    setEmailError('')
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/reset-password',
    })
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <>
        <h1 className={styles.title}>Письмо отправлено</h1>
        <p className={styles.subtitle}>
          Проверьте почту <strong>{email}</strong> и перейдите по ссылке для сброса пароля.
        </p>
        <p className={styles.signupText}>
          <button className={styles.switchBtn} onClick={onBack}>Вернуться ко входу</button>
        </p>
      </>
    )
  }

  return (
    <>
      <h1 className={styles.title}>Забыли пароль?</h1>
      <p className={styles.subtitle}>Введите email и мы отправим ссылку для сброса</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldWrap}>
          <input
            className={`${styles.input} ${emailError ? styles.inputError : ''}`}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {emailError && <span className={styles.errorText}>{emailError}</span>}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Отправляем...' : 'Отправить ссылку'}
        </button>
      </form>

      <p className={styles.signupText}>
        <button className={styles.switchBtn} onClick={onBack}>Вернуться ко входу</button>
      </p>
    </>
  )
}

export default ForgotPasswordForm
