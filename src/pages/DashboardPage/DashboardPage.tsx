import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../supabaseClient'
import Sidebar, { type Section } from './sidebar/Sidebar'
import ProjectsSection from './ProjectsSection/ProjectsSection'
import FavoritesSection from './FavoritesSection/FavoritesSection'
import TrashSection from './TrashSection/TrashSection'
import ProfileSection from './ProfileSection/ProfileSection'
import styles from './DashboardPage.module.scss'
import Logo from '../../img/Logo.svg'

export interface TrashItem {
  id: string
  name: string
  thumbnail: string | null
  updated_at: string
  deletedAt: string
}

const favKey   = (uid: string) => `roomix_favorites_${uid}`
const trashKey = (uid: string) => `roomix_trash_${uid}`

function readFavorites(uid: string): Set<string> {
  try {
    const raw = localStorage.getItem(favKey(uid))
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* ignore */ }
  return new Set()
}

function readTrash(uid: string): TrashItem[] {
  try {
    const raw = localStorage.getItem(trashKey(uid))
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function DashboardPage() {
  const [userId, setUserId]       = useState('')
  const [userName, setUserName]   = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<Section>('projects')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [favorites, setFavorites]   = useState<Set<string>>(new Set())
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [toastState, setToastState] = useState<'hidden' | 'visible' | 'hiding'>('hidden')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deletedIds = useMemo(() => new Set(trashItems.map(t => t.id)), [trashItems])

  // Load user info + user-specific localStorage data
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return
      setUserId(user.id)
      setUserEmail(user.email ?? '')
      setUserName(user.user_metadata?.full_name ?? user.email ?? '')
      setUserAvatar(user.user_metadata?.avatar_url ?? null)
      setFavorites(readFavorites(user.id))
      setTrashItems(readTrash(user.id))
      setUserLoading(false)
    })
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleToggleFavorite = (id: string) => {
    if (!userId) return
    setFavorites(prev => {
      const next = new Set(prev)
      const adding = !next.has(id)
      if (adding) next.add(id)
      else next.delete(id)
      localStorage.setItem(favKey(userId), JSON.stringify([...next]))
      if (adding) showToast()
      return next
    })
  }

  const handleDeleteToTrash = (project: { id: string; name: string; thumbnail: string | null; updated_at: string }) => {
    if (!userId) return
    setTrashItems(prev => {
      const next = [...prev.filter(t => t.id !== project.id), { ...project, deletedAt: new Date().toISOString() }]
      localStorage.setItem(trashKey(userId), JSON.stringify(next))
      return next
    })
  }

  const handleRestoreFromTrash = (id: string) => {
    if (!userId) return
    setTrashItems(prev => {
      const next = prev.filter(t => t.id !== id)
      localStorage.setItem(trashKey(userId), JSON.stringify(next))
      return next
    })
  }

  const handlePermanentDelete = async (id: string) => {
    if (!userId) return
    setTrashItems(prev => {
      const next = prev.filter(t => t.id !== id)
      localStorage.setItem(trashKey(userId), JSON.stringify(next))
      return next
    })
    setFavorites(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      localStorage.setItem(favKey(userId), JSON.stringify([...next]))
      return next
    })
    await supabase.from('projects').delete().eq('id', id)
  }

  const handleProfileUpdate = (name: string, avatarUrl: string | null) => {
    setUserName(name)
    setUserAvatar(avatarUrl)
  }

  const showToast = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToastState('visible')
    timerRef.current = setTimeout(() => {
      setToastState('hiding')
      timerRef.current = setTimeout(() => setToastState('hidden'), 350)
    }, 2000)
  }

  return (
    <div className={styles.layout}>
      <header className={styles.mobileHeader}>
        <button
          className={styles.burgerBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Открыть меню"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <img src={Logo} alt="Roomix" height="20" />
        <div style={{ width: 40 }} />
      </header>

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        userLoading={userLoading}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className={styles.main}>
        {activeSection === 'projects' && (
          <ProjectsSection
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            deletedIds={deletedIds}
            onDeleteToTrash={handleDeleteToTrash}
          />
        )}
        {activeSection === 'favorites' && (
          <FavoritesSection
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            deletedIds={deletedIds}
          />
        )}
        {activeSection === 'trash' && (
          <TrashSection
            items={trashItems}
            onRestore={handleRestoreFromTrash}
            onPermanentDelete={handlePermanentDelete}
          />
        )}
        {activeSection === 'profile' && (
          <ProfileSection onUpdate={handleProfileUpdate} />
        )}
      </main>

      {toastState !== 'hidden' && (
        <div className={`${styles.toast} ${toastState === 'hiding' ? styles.toastHide : ''}`}>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
            <path d="M1 5.5L5 9.5L13 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Добавлено в избранное
        </div>
      )}
    </div>
  )
}

export default DashboardPage
