import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './header.module.scss'

const NAV_LINKS = [
  { label: 'Как это работает', href: '#how-it-works' },
  { label: 'Возможности', href: '#features' },
  { label: 'Примеры', href: '#examples' },
]

const HEADER_OFFSET = 90

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const scrollTo = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setIsOpen(false)

    const id = href.replace('#', '')
    const target = document.getElementById(id)
    if (!target) return

    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  return (
    <>
    <div className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`} onClick={() => setIsOpen(false)} />
    <header className={styles.header}>
      <div className={`${styles.inner} ${isOpen ? styles.innerOpen : ''}`}>
        <a href="/" className={styles.logo}>
          <img src="/src/img/Logo.svg" alt="Roomix" />
        </a>

        <nav className={`${styles.nav} ${isOpen ? styles.navOpen : ''}`}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className={styles.navLink} onClick={e => scrollTo(e, href)}>
              {label}
            </a>
          ))}
          <div className={styles.actionsMobile}>
            <button className={styles.btnOutline} onClick={() => navigate('/auth')}>Войти</button>
            <button className={styles.btnFilled} onClick={() => navigate('/auth', { state: { register: true } })}>Попробовать</button>
          </div>
        </nav>

        <div className={styles.actions}>
          <button className={styles.btnOutline} onClick={() => navigate('/auth')}>Войти</button>
          <button className={styles.btnFilled} onClick={() => navigate('/auth', { state: { register: true } })}>Попробовать</button>
        </div>

        <button
          className={`${styles.burger} ${isOpen ? styles.burgerOpen : ''}`}
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="Меню"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
    </>
  )
}

export default Header
