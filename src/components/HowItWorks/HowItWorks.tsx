import styles from './HowItWorks.module.scss'

const STEPS = [
  {
    icon: '/src/img/image-plus.svg',
    dark: false,
    number: '01',
    title: 'Загрузите фото помещения',
    description: 'Добавьте фотографию комнаты, которую хотите изменить',
  },
  {
    icon: '/src/img/lasso.svg',
    dark: false,
    number: '02',
    title: 'Выделите нужную область',
    description: 'С помощью инструмента выделения укажите часть интерьера для изменения',
  },
  {
    icon: '/src/img/ai.svg',
    dark: true,
    number: '03',
    title: 'Редактирование с помощью ИИ',
    description: 'Выделяйте область и изменяйте интерьер с помощью AI',
  },
]

const HowItWorks = () => {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Как это работает</h2>
          <p className={styles.subtitle}>
            Три шага, чтобы изменить интерьер с помощью искусственного интеллекта
          </p>
        </div>

        <div className={styles.cards}>
          {STEPS.map(({ icon, dark, number, title, description }) => (
            <div key={number} className={styles.card}>
              <div className={`${styles.iconWrap} ${dark ? styles.iconWrapDark : ''}`}>
                <img src={icon} alt={title} className={styles.icon} />
              </div>
              <span className={styles.number}>{number}</span>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardDescription}>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
