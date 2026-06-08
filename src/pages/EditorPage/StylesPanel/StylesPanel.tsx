import Minimalism from '../../../img/Minimalism.png'
import Scandinavian from '../../../img/Scandinavian.png'
import Loft from '../../../img/Loft.png'
import Classical from '../../../img/Classical.png'
import HiTech from '../../../img/Hi-tech.png'
import Japandi from '../../../img/Japandi.png'
import styles from './StylesPanel.module.scss'

export interface StyleOption {
  label: string
  prompt: string
  img: string
}

const STYLES: StyleOption[] = [
  {
    label: 'Минимализм',
    img: Minimalism,
    prompt: 'Restyle this interior in minimalist style: pure white and light gray tones, clean straight lines, minimal furniture, lots of empty space, no clutter, calm and airy atmosphere.',
  },
  {
    label: 'Скандинавский',
    img: Scandinavian,
    prompt: 'Restyle this interior in Scandinavian style: light natural wood, white walls, cozy soft textiles, simple functional furniture, warm natural light, hygge atmosphere.',
  },
  {
    label: 'Лофт',
    img: Loft,
    prompt: 'Restyle this interior in industrial loft style: exposed brick walls, raw concrete, metal accents, dark moody tones, Edison bulbs, open ceiling with visible pipes.',
  },
  {
    label: 'Классический',
    img: Classical,
    prompt: 'Restyle this interior in classic style: ornate moldings, rich dark wood furniture, warm golden tones, elegant curtains, chandelier lighting, symmetrical composition.',
  },
  {
    label: 'Хай-тек',
    img: HiTech,
    prompt: 'Restyle this interior in hi-tech style: sleek surfaces, chrome and glass elements, smart ambient lighting, futuristic minimalist design, metallic finishes, monochrome palette.',
  },
  {
    label: 'Японди',
    img: Japandi,
    prompt: 'Restyle this interior in Japandi style: blend of Japanese and Scandinavian aesthetics, natural wood and stone, muted earth tones, wabi-sabi philosophy, zen minimalism, handcrafted details.',
  },
]

interface Props {
  selected: string | null
  onSelect: (style: StyleOption) => void
  mobileOpen?: boolean
}

function StylesPanel({ selected, onSelect, mobileOpen }: Props) {
  return (
    <aside className={`${styles.panel} ${mobileOpen ? styles.panelOpen : ''}`}>
      <div className={styles.card}>
        <h2 className={styles.title}>Стили интерьера</h2>
        <div className={styles.grid}>
          {STYLES.map((style) => (
            <button
              key={style.label}
              className={`${styles.item} ${selected === style.label ? styles.active : ''}`}
              onClick={() => onSelect(style)}
            >
              <img src={style.img} alt={style.label} className={styles.img} />
              <span className={styles.label}>{style.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default StylesPanel
