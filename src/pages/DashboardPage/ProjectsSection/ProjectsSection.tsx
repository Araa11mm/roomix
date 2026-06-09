import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../../supabaseClient'
import ProjectCardSkeleton from './ProjectCardSkeleton'
import styles from './ProjectsSection.module.scss'
import heartSvg from '../../../img/favourites.svg'
import searchSvg from '../../../img/search.svg'
import gridSvg from '../../../img/grid.svg'
import closeSvg from '../../../img/close.svg'
import chevronDownSvg from '../../../img/chevron-down.svg'
import checkSvg from '../../../img/check.svg'
import imagePlaceholderSvg from '../../../img/image-placeholder.svg'
import dotsSvg from '../../../img/dots.svg'
import pencilSvg from '../../../img/pencil.svg'
import trashActionSvg from '../../../img/trash-action.svg'
import sortSvg from '../../../img/sort.svg'

interface Project {
  id: string
  name: string
  thumbnail: string | null
  updated_at: string
}

interface Props {
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
  deletedIds: Set<string>
  onDeleteToTrash: (project: { id: string; name: string; thumbnail: string | null; updated_at: string }) => void
}

function ProjectsSection({ favorites, onToggleFavorite, deletedIds, onDeleteToTrash }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const updatedProject = (location.state as { updatedProject?: { id: string; name: string } } | null)?.updatedProject
  const updatedProjectRef = useRef(updatedProject)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc')
  const [sortOpen, setSortOpen] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchMountedRef = useRef(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('projects')
      .select('id, name, thumbnail, updated_at')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          let list = data ?? []
          if (updatedProjectRef.current) {
            list = list.map(p => p.id === updatedProjectRef.current!.id ? { ...p, name: updatedProjectRef.current!.name } : p)
            window.history.replaceState({}, '')
          }
          setProjects(list)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu-wrap]')) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  useEffect(() => {
    if (renamingId) renameInputRef.current?.select()
  }, [renamingId])

  // Debounce search — show skeleton for 350ms including when query is cleared
  useEffect(() => {
    if (!searchMountedRef.current) { searchMountedRef.current = true; return }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setSearching(true)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setSearching(false)
    }, 350)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [query])

  const handleNewProject = async () => {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: 'Новый проект' })
      .select()
      .single()
    setCreating(false)
    if (!error && data) navigate(`/editor/${data.id}`)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const startRename = (p: Project) => {
    setOpenMenuId(null)
    setRenamingId(p.id)
    setRenameValue(p.name)
  }

  const saveRename = async (p: Project) => {
    const newName = renameValue.trim() || p.name
    setProjects(prev => prev.map(proj => proj.id === p.id ? { ...proj, name: newName } : proj))
    setRenamingId(null)
    await supabase.from('projects').update({ name: newName }).eq('id', p.id)
  }

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const sortProjects = (list: Project[]) => [...list].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'date_asc':  return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      case 'name_asc':  return a.name.localeCompare(b.name, 'ru')
      case 'name_desc': return b.name.localeCompare(a.name, 'ru')
    }
  })

  const SORT_OPTIONS: { key: typeof sortBy; label: string }[] = [
    { key: 'date_desc', label: 'По дате (новые → старые)' },
    { key: 'date_asc',  label: 'По дате (старые → новые)' },
    { key: 'name_asc',  label: 'По названию (А → Я)'      },
    { key: 'name_desc', label: 'По названию (Я → А)'      },
  ]

  const visibleProjects = projects.filter(p => !deletedIds.has(p.id))
  const filteredProjects = sortProjects(
    debouncedQuery
      ? visibleProjects.filter(p => p.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
      : visibleProjects
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>/ Библиотека</p>
          <h1 className={styles.title}>
            Проекты — <em>{debouncedQuery ? filteredProjects.length : visibleProjects.length}</em>
          </h1>
          <p className={styles.subtitle}>Все интерьеры, над которыми вы работаете.</p>
        </div>
        {visibleProjects.length > 0 && (
          <button className={styles.newBtn} onClick={handleNewProject} disabled={creating}>
            {creating ? 'Создаём...' : '+ Новый проект'}
          </button>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <img src={searchSvg} alt="" width="16" height="16" />
          <input
            type="text"
            placeholder="Поиск по проектам..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              aria-label="Очистить поиск"
            >
              <img src={closeSvg} alt="" width="14" height="14" />
            </button>
          )}
        </div>
        <div className={styles.sortWrap} ref={sortRef}>
          <button className={styles.sort} onClick={() => setSortOpen(o => !o)}>
            <img src={sortSvg} alt="Сортировка" className={styles.sortIcon} />
            <span className={styles.sortText}>
              Сортировка: <strong>{SORT_OPTIONS.find(o => o.key === sortBy)?.label}</strong>
            </span>
            <img src={chevronDownSvg} alt="" width="12" height="12" className={styles.sortChevron} style={{ marginLeft: 4, transition: 'transform 0.2s', transform: sortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
          {sortOpen && (
            <div className={styles.sortDropdown}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`${styles.sortItem} ${sortBy === opt.key ? styles.sortItemActive : ''}`}
                  onClick={() => { setSortBy(opt.key); setSortOpen(false) }}
                >
                  {sortBy === opt.key && (
                    <img src={checkSvg} alt="" width="13" height="13" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading || searching ? (
        <div className={styles.grid}>
          {Array.from({ length: loading ? 6 : Math.min(3, visibleProjects.length || 3) }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProjects.length === 0 && debouncedQuery ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <img src={searchSvg} alt="" width="28" height="28" />
          </div>
          <h2 className={styles.emptyTitle}>Ничего не найдено</h2>
          <p className={styles.emptySubtitle}>По запросу «{debouncedQuery}» проектов не найдено.</p>
          <button className={styles.createBtn} onClick={() => setQuery('')}>Сбросить поиск</button>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <img src={gridSvg} alt="" width="28" height="28" />
          </div>
          <h2 className={styles.emptyTitle}>Проектов пока нет</h2>
          <p className={styles.emptySubtitle}>Начните с нового проекта — загрузите фото комнаты.</p>
          <button className={styles.createBtn} onClick={handleNewProject}>Создать проект</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProjects.map(p => {
            const isFav = favorites.has(p.id)
            return (
              <div
                key={p.id}
                className={styles.card}
                onClick={() => { if (renamingId === p.id || openMenuId) return; navigate(`/editor/${p.id}`) }}
              >
                <div className={styles.cardThumb}>
                  {p.thumbnail
                    ? <img src={p.thumbnail} alt={p.name} />
                    : <div className={styles.cardThumbEmpty}>
                        <img src={imagePlaceholderSvg} alt="" style={{ width: 32, height: 32, objectFit: 'initial' }} />
                      </div>
                  }
                  {/* Heart button */}
                  <button
                    className={`${styles.favoriteBtn} ${isFav ? styles.favoriteBtnActive : ''}`}
                    onClick={e => { e.stopPropagation(); onToggleFavorite(p.id) }}
                    aria-label={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    <img src={heartSvg} alt="" style={{ filter: isFav ? 'invert(1)' : 'none' }} />
                  </button>
                </div>

                {/* Three-dot menu */}
                <div
                  className={styles.menuWrap}
                  data-menu-wrap
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className={styles.menuBtn}
                    onClick={() => setOpenMenuId(prev => prev === p.id ? null : p.id)}
                    aria-label="Меню проекта"
                  >
                    <img src={dotsSvg} alt="" width="14" height="4" />
                  </button>

                  {openMenuId === p.id && (
                    <div className={styles.menuDropdown}>
                      <button
                        className={styles.menuItem}
                        onClick={() => startRename(p)}
                      >
                        <img src={pencilSvg} alt="" width="15" height="15" />
                        Переименовать
                      </button>
                      <div className={styles.menuDivider} />
                      <button
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                        onClick={() => { onDeleteToTrash(p); setOpenMenuId(null) }}
                      >
                        <img src={trashActionSvg} alt="" width="15" height="15" />
                        Удалить в корзину
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.cardInfo}>
                  {renamingId === p.id ? (
                    <input
                      ref={renameInputRef}
                      className={styles.renameInput}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => saveRename(p)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveRename(p)
                        if (e.key === 'Escape') setRenamingId(null)
                        e.stopPropagation()
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className={styles.cardName}>{p.name}</span>
                  )}
                  <span className={styles.cardDate}>{formatDate(p.updated_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProjectsSection
