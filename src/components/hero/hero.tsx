import { useNavigate } from 'react-router-dom'
import styles from './hero.module.scss'

const Hero = () => {
  const navigate = useNavigate()
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Меняйте интерьер одним движением
          </h1>
          <p className={styles.description}>
            Загрузите фотографию комнаты, выделите область и измените элементы интерьера прямо в редакторе
          </p>
          <button className={styles.cta} onClick={() => navigate('/auth', { state: { register: true } })}>Попробовать бесплатно</button>
        </div>

        <div className={styles.mockup}>
          <div className={styles.mockupInner}>
            <img src="/src/img/redactor.png" alt="Редактор интерьера" className={styles.roomImage} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
