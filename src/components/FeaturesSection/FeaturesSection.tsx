import styles from './FeaturesSection.module.scss'
import editorMockup from '../../img/editor-mockup.png'

const FeaturesSection = () => {
  return (
    <section id="features" className={styles.section}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Возможности</h2>
          <p className={styles.subtitle}>
            Выделяйте область, перекрашивайте стены и меняйте мебель<br />в одном редакторе
          </p>
        </div>

        <div className={styles.mockupWrap}>
          <img
            src={editorMockup}
            alt="Редактор Roomix"
            className={styles.mockup}
          />
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
