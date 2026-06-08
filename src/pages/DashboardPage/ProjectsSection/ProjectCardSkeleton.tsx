import styles from './ProjectCardSkeleton.module.scss'

function ProjectCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.thumb} />
      <div className={styles.info}>
        <div className={`${styles.line} ${styles.name}`} />
        <div className={`${styles.line} ${styles.date}`} />
      </div>
    </div>
  )
}

export default ProjectCardSkeleton
