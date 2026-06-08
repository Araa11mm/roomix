import { useState, useRef } from 'react'
import styles from './BeforeAfter.module.scss'
import slide1 from '../../img/before.png'
import slide2 from '../../img/slide2.png'
import slide3 from '../../img/slide3.png'
import slide4 from '../../img/slide4.png'

const SLIDES = [
  {
    before: slide1,
    after: slide1,
    tag: 'Смена цвета стены',
    prompt: 'Измени цвет стены на мягкий берёзовый оттенок, сохрани освещение',
  },
  {
    before: slide2,
    after: slide2,
    tag: 'Смена стиля',
    prompt: 'Смени тёплый уютный интерьер на холодный современный стиль',
  },
  {
    before: slide3,
    after: slide3,
    tag: 'Замена освещения',
    prompt: 'Добавь тёплую подсветку под навесными шкафами над столешницей',
  },
  {
    before: slide4,
    after: slide4,
    tag: 'Добавление декора',
    prompt: 'Добавь живые растения и декоративные акценты в интерьер',
  },
]

const BeforeAfter = () => {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const touchStartX = useRef<number | null>(null)

  const prev = () => {
    setDirection('prev')
    setCurrent(i => (i === 0 ? SLIDES.length - 1 : i - 1))
  }
  const next = () => {
    setDirection('next')
    setCurrent(i => (i === SLIDES.length - 1 ? 0 : i + 1))
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  const slide = SLIDES[current]
  const animClass = direction === 'next' ? styles.slideFromRight : styles.slideFromLeft

  return (
    <section id="examples" className={styles.section}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Примеры изменений</h2>
          <p className={styles.subtitle}>
            Сравните интерьер до и после обработки с помощью искусственного интеллекта
          </p>
        </div>

        <div
          className={styles.card}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className={styles.images}>
            <div key={current} className={`${styles.slideAnim} ${animClass}`}>
              <img src={slide.before} alt="До/После" className={styles.img} />
            </div>
            <span className={styles.badgeBefore}>ДО</span>
            <span className={styles.badgeAfter}>ПОСЛЕ</span>
          </div>

          <div className={styles.cardFooter}>
            <div key={current} className={`${styles.cardInfo} ${animClass}`}>
              <span className={styles.tag}>{slide.tag}</span>
              <p className={styles.prompt}>{slide.prompt}</p>
            </div>
            <span className={styles.counter}>✦ {current + 1}/{SLIDES.length}</span>
          </div>
        </div>

        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={prev} aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className={styles.dots}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => {
                  setDirection(i > current ? 'next' : 'prev')
                  setCurrent(i)
                }}
                aria-label={`Слайд ${i + 1}`}
              />
            ))}
          </div>

          <button className={styles.navBtnFilled} onClick={next} aria-label="Вперёд">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default BeforeAfter
