import styles from './ProfileSkeleton.module.scss'

function ProfileSkeleton() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={`${styles.bone} ${styles.breadcrumb}`} />
        <div className={`${styles.bone} ${styles.title}`} />
        <div className={`${styles.bone} ${styles.subtitle}`} />
      </div>

      <div className={styles.columns}>
        {/* Avatar card */}
        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <div className={`${styles.bone} ${styles.avatar}`} />
            <div className={`${styles.bone} ${styles.avatarName}`} />
            <div className={`${styles.bone} ${styles.avatarEmail}`} />
            <div className={`${styles.bone} ${styles.avatarHint}`} />
          </div>
        </div>

        {/* Fields card */}
        <div className={styles.card}>
          <div className={styles.fieldGroup}>
            <div className={`${styles.bone} ${styles.label}`} />
            <div className={styles.fieldRow}>
              <div className={`${styles.bone} ${styles.input}`} />
              <div className={`${styles.bone} ${styles.btn}`} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.fieldGroup}>
            <div className={`${styles.bone} ${styles.label}`} />
            <div className={styles.fieldRow}>
              <div className={`${styles.bone} ${styles.input}`} />
              <div className={`${styles.bone} ${styles.btn}`} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.fieldGroup}>
            <div className={`${styles.bone} ${styles.label}`} />
            <div className={`${styles.bone} ${styles.input}`} />
            <div className={`${styles.bone} ${styles.input}`} />
            <div className={`${styles.bone} ${styles.btnFull}`} />
          </div>
        </div>

        {/* Danger zone */}
        <div className={styles.dangerCard}>
          <div className={`${styles.bone} ${styles.dangerLabel}`} />
          <div className={styles.dangerActions}>
            <div className={`${styles.bone} ${styles.dangerBtn}`} />
            <div className={`${styles.bone} ${styles.dangerBtn}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSkeleton
