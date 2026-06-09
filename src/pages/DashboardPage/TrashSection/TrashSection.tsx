import type { TrashItem } from '../DashboardPage'
import styles from '../ProjectsSection/ProjectsSection.module.scss'
import trashStyles from './TrashSection.module.scss'
import trashIcon from '../../../img/trash-action.svg'

interface Props {
  items: TrashItem[]
  onRestore: (id: string) => void
  onPermanentDelete: (id: string) => void
}

function TrashSection({ items, onRestore, onPermanentDelete }: Props) {
  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>/ Удалённые</p>
          <h1 className={styles.title}>Корзина — <em>{items.length}</em></h1>
          <p className={styles.subtitle}>Проекты хранятся здесь 30 дней. После этого — удаляются автоматически.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Корзина пуста</h2>
          <p className={styles.emptySubtitle}>Удалённые проекты попадают сюда и могут быть восстановлены.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map(item => (
            <div key={item.id} className={`${styles.card} ${trashStyles.trashCard}`}>
              <div className={styles.cardThumb}>
                {item.thumbnail
                  ? <img src={item.thumbnail} alt={item.name} className={trashStyles.dimmed} />
                  : <div className={styles.cardThumbEmpty}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="m21 15-5-5L5 21"/>
                      </svg>
                    </div>
                }
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{item.name}</span>
                <span className={styles.cardDate}>Удалён: {formatDate(item.deletedAt)}</span>
              </div>
              <div className={trashStyles.trashActions}>
                <button className={trashStyles.restoreBtn} onClick={() => onRestore(item.id)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  Восстановить
                </button>
                <button className={trashStyles.deleteBtn} onClick={() => onPermanentDelete(item.id)}>
                  <img src={trashIcon} alt="" width="13" height="13" style={{ filter: 'invert(27%) sepia(90%) saturate(1200%) hue-rotate(330deg) brightness(90%)' }} />
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TrashSection
