import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import styles from '../AuthPage/AuthPage.module.scss'
import Logo from '../../img/Logo.svg'
import EyeIcon from '../../img/eye.svg'
import EyeOffIcon from '../../img/eye-off.svg'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!password) return setError('Введите пароль')
    if (/[а-яёА-ЯЁ]/.test(password)) return setError('Пароль должен содержать только латиницу и цифры')
    if (password.length < 6) return setError('Пароль слишком короткий')
    if (password !== confirm) return setError('Пароли не совпадают')

    setError('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError('Произошла ошибка. Попробуйте снова')
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img src={Logo} alt="Roomix" className={styles.logo} />
        </div>

        <h1 className={styles.title}>Новый пароль</h1>
        <p className={styles.subtitle}>Введите новый пароль для вашего аккаунта</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldWrap}>
            <div className={styles.passwordWrap}>
              <input
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(p => !p)}>
                <img src={showPassword ? EyeOffIcon : EyeIcon} alt="" />
              </button>
            </div>
          </div>

          <div className={styles.fieldWrap}>
            <div className={styles.passwordWrap}>
              <input
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Повторите пароль"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(p => !p)}>
                <img src={showConfirm ? EyeOffIcon : EyeIcon} alt="" />
              </button>
            </div>
          </div>

          {error && <span className={styles.errorText}>{error}</span>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Сохраняем...' : 'Сохранить пароль'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
