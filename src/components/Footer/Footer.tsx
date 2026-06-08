import { useCallback } from 'react'
import styles from './Footer.module.scss'

const NAV_LINKS = [
  { label: 'Возможности', href: '#features' },
  { label: 'Как это работает', href: '#how-it-works' },
  { label: 'Примеры', href: '#examples' },
]

const HEADER_OFFSET = 90

const Footer = () => {
  const scrollTo = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.getElementById(href.replace('#', ''))
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.left}>
          <a href="/" className={styles.logo}>
            <img src="/src/img/Logo.svg" alt="Roomix" />
          </a>
          <p className={styles.description}>
            Сервис для редактирования интерьеров с помощью искусственного интеллекта
          </p>
          <span className={styles.copy}>© 2026 ROOMIX. Все права защищены.</span>
        </div>

        <nav className={styles.nav}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className={styles.navLink} onClick={e => scrollTo(e, href)}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}

export default Footer
