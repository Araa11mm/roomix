import styles from './Sidebar.module.scss'
import Logo from '../../../img/Logo.svg'
import folderSvg from '../../../img/folder.svg'
import heartSvg from '../../../img/favourites.svg'
import basketSvg from '../../../img/basket.svg'
import settingsSvg from '../../../img/settings.svg'

export type Section = 'projects' | 'favorites' | 'trash' | 'profile'

const NAV_ITEMS: { label: string; icon: string; key: Section }[] = [
  { label: 'Проекты',   icon: folderSvg,  key: 'projects'  },
  { label: 'Избранное', icon: heartSvg,   key: 'favorites' },
  { label: 'Корзина',   icon: basketSvg,  key: 'trash'     },
]

interface Props {
  userName: string
  userEmail: string
  userAvatar: string | null
  userLoading: boolean
  activeSection: Section
  onSectionChange: (section: Section) => void
  isOpen?: boolean
  onClose?: () => void
}

function Sidebar({ userName, userEmail, userAvatar, userLoading, activeSection, onSectionChange, isOpen, onClose }: Props) {
  const initial = userName.charAt(0).toUpperCase() || '?'

  const handleSelect = (key: Section) => {
    onSectionChange(key)
    onClose?.()
  }

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.logoRow}>
        <div className={styles.logo}>
          <img src={Logo} alt="Roomix" />
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть меню">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <nav className={styles.nav}>
        <span className={styles.section}>Библиотека</span>
        {NAV_ITEMS.map(({ label, icon, key }) => (
          <button
            key={key}
            className={`${styles.navItem} ${activeSection === key ? styles.navItemActive : ''}`}
            onClick={() => handleSelect(key)}
          >
            <span className={styles.navIcon}><img src={icon} alt="" /></span>
            <span className={styles.navLabel}>{label}</span>
          </button>
        ))}
      </nav>

      {userLoading ? (
        <div className={styles.userSkeleton}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonInfo}>
            <div className={styles.skeletonName} />
            <div className={styles.skeletonEmail} />
          </div>
        </div>
      ) : (
        <button
          className={`${styles.user} ${activeSection === 'profile' ? styles.userActive : ''}`}
          onClick={() => handleSelect('profile')}
          title="Настройки профиля"
        >
          <div className={styles.avatar}>
            {userAvatar
              ? <img src={userAvatar} alt={userName} className={styles.avatarImg} />
              : initial
            }
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userEmail}>{userEmail}</span>
          </div>
          <img src={settingsSvg} alt="" className={styles.settingsIcon} width="15" height="15" />
        </button>
      )}
    </aside>
  )
}

export default Sidebar
