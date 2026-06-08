import styles from './AuthPage.module.scss'

interface Props {
  email: string
  onBack: () => void
}

function EmailSent({ email, onBack }: Props) {
  return (
    <>
      <h1 className={styles.title}>Проверьте почту</h1>
      <p className={styles.subtitle}>
        Мы отправили письмо на <strong>{email}</strong>.<br />
        Перейдите по ссылке в письме чтобы подтвердить аккаунт.
      </p>

      <p className={styles.signupText}>
        Неверный email?{' '}
        <button className={styles.switchBtn} onClick={onBack}>
          Вернуться назад
        </button>
      </p>
    </>
  )
}

export default EmailSent
