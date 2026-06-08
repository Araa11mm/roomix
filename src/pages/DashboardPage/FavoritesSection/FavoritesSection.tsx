import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../supabaseClient'
import styles from '../ProjectsSection/ProjectsSection.module.scss'
import ProjectCardSkeleton from '../ProjectsSection/ProjectCardSkeleton'
import heartSvg from '../../../img/favourites.svg'
import searchSvg from '../../../img/search.svg'
import sortSvg from '../../../img/sort.svg'
import chevronDownSvg from '../../../img/chevron-down.svg'
import checkSvg from '../../../img/check.svg'

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
}

function FavoritesSection({ favorites, onToggleFavorite, deletedIds }: Props) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc')
  const [sortOpen, setSortOpen] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchMountedRef = useRef(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const activeFavorites = useMemo(
    () => new Set([...favorites].filter(id => !deletedIds.has(id))),
    [favorites, deletedIds]
  )

  useEffect(() => {
    if (activeFavorites.size === 0) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('projects')
        .select('id, name, thumbnail, updated_at')
        .in('id', [...activeFavorites])
        .order('updated_at', { ascending: false })
      if (cancelled) return
      setProjects(data ?? [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [activeFavorites])

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

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const SORT_OPTIONS: { key: typeof sortBy; label: string }[] = [
    { key: 'date_desc', label: 'По дате (новые → старые)' },
    { key: 'date_asc',  label: 'По дате (старые → новые)' },
    { key: 'name_asc',  label: 'По названию (А → Я)'      },
    { key: 'name_desc', label: 'По названию (Я → А)'      },
  ]

  const sortProjects = (list: Project[]) => [...list].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'date_asc':  return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      case 'name_asc':  return a.name.localeCompare(b.name, 'ru')
      case 'name_desc': return b.name.localeCompare(a.name, 'ru')
    }
  })

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filteredProjects = sortProjects(
    debouncedQuery
      ? projects.filter(p => p.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
      : projects
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>/ Подборка</p>
          <h1 className={styles.title}>
            Избранное — <em>{debouncedQuery ? filteredProjects.length : activeFavorites.size}</em>
          </h1>
          <p className={styles.subtitle}>Проекты, отмеченные сердечком. Нажмите ещё раз, чтобы убрать.</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <img src={searchSvg} alt="" width="16" height="16" />
          <input
            type="text"
            placeholder="Поиск по избранному..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, display: 'flex' }}
              aria-label="Очистить поиск"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
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

      {activeFavorites.size === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>В избранном пока пусто</h2>
          <p className={styles.emptySubtitle}>Нажмите на сердечко на карточке проекта — он появится здесь.</p>
        </div>
      ) : loading || searching ? (
        <div className={styles.grid}>
          {Array.from({ length: loading ? activeFavorites.size : Math.min(3, projects.length || 3) }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProjects.length === 0 && debouncedQuery ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Ничего не найдено</h2>
          <p className={styles.emptySubtitle}>По запросу «{debouncedQuery}» ничего не найдено.</p>
          <button className={styles.createBtn} onClick={() => setQuery('')}>Сбросить поиск</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProjects.map(p => (
            <div key={p.id} className={styles.card} onClick={() => navigate(`/editor/${p.id}`)}>
              <div className={styles.cardThumb}>
                {p.thumbnail
                  ? <img src={p.thumbnail} alt={p.name} />
                  : <div className={styles.cardThumbEmpty}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="m21 15-5-5L5 21"/>
                      </svg>
                    </div>
                }
                <button
                  className={`${styles.favoriteBtn} ${styles.favoriteBtnActive}`}
                  onClick={e => { e.stopPropagation(); onToggleFavorite(p.id) }}
                  aria-label="Убрать из избранного"
                >
                  <img src={heartSvg} alt="" style={{ filter: 'invert(1)' }} />
                </button>
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{p.name}</span>
                <span className={styles.cardDate}>{formatDate(p.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FavoritesSection
