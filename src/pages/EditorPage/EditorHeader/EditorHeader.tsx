import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../supabaseClient'
import styles from './EditorHeader.module.scss'

interface Props {
  projectId: string
  projectName: string
  onProjectNameChange: (name: string) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onExport?: () => void
}

function EditorHeader({ projectId, projectName, onProjectNameChange, zoom, onZoomIn, onZoomOut, onExport }: Props) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(projectName)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return
      setUserEmail(user.email ?? '')
      setUserName(user.user_metadata?.full_name ?? user.email ?? '')
    })
  }, [])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  useEffect(() => {
    if (!dropdownOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [dropdownOpen])

  const startEdit = () => { setDraft(projectName); setEditing(true) }

  const save = () => {
    const newName = draft.trim() || projectName
    onProjectNameChange(newName)
    supabase.from('projects').update({ name: newName }).eq('id', projectId)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const initial = userName.charAt(0).toUpperCase() || '?'

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.backBtn} onClick={async () => {
          await supabase.from('projects').update({ name: projectName }).eq('id', projectId)
          navigate('/dashboard', { state: { updatedProject: { id: projectId, name: projectName } } })
        }} aria-label="На главную">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
            <polyline points="9 21 9 12 15 12 15 21"/>
          </svg>
        </button>
      </div>

      <div className={styles.center}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.projectInput}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <>
            <span className={styles.projectName}>{projectName}</span>
            <button className={styles.editBtn} aria-label="Переименовать" onClick={startEdit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.zoomControl}>
          <button className={styles.zoomBtn} onClick={onZoomOut} title="Уменьшить">−</button>
          <span className={styles.zoomValue}>{zoom}%</span>
          <button className={styles.zoomBtn} onClick={onZoomIn} title="Увеличить">+</button>
        </div>
        <button className={styles.exportBtn} onClick={onExport}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Экспорт
        </button>

        <div className={styles.avatarWrap} ref={dropdownRef}>
          <button
            className={styles.avatar}
            onClick={() => setDropdownOpen(o => !o)}
            aria-label="Профиль"
          >
            {initial}
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownUser}>
                <div className={styles.dropdownAvatar}>{initial}</div>
                <div className={styles.dropdownInfo}>
                  <span className={styles.dropdownName}>{userName}</span>
                  <span className={styles.dropdownEmail}>{userEmail}</span>
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default EditorHeader
