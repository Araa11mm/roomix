import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './AuthPage.module.scss'
import Logo from '../../img/Logo.svg'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

function AuthPage() {
  const location = useLocation()
  const [isRegister, setIsRegister] = useState(
    (location.state as { register?: boolean } | null)?.register === true
  )

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img src={Logo} alt="Roomix" className={styles.logo} />
        </div>

        {isRegister
          ? <RegisterForm onSwitch={() => setIsRegister(false)} />
          : <LoginForm onSwitch={() => setIsRegister(true)} />
        }

        <p className={styles.policy}>
          Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности
        </p>
      </div>
    </div>
  )
}

export default AuthPage
