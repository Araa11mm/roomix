import type { CanvasObject as TCanvasObject } from '../types'
import styles from './CanvasObject.module.scss'

export type Corner = 'tl' | 'tr' | 'bl' | 'br'

interface Props {
  obj: TCanvasObject
  selected: boolean
  brushTarget?: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onResizeStart: (corner: Corner, e: React.MouseEvent) => void
}

function CanvasObject({ obj, selected, brushTarget, onMouseDown, onResizeStart }: Props) {
  const handleCornerDown = (corner: Corner, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onResizeStart(corner, e)
  }

  return (
    <div
      className={`${styles.object} ${selected ? styles.selected : ''} ${brushTarget ? styles.brushTarget : ''}`}
      style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height }}
      onMouseDown={onMouseDown}
    >
      {obj.type === 'image' && (
        <img src={obj.src} alt="" draggable={false} />
      )}
      {obj.type === 'placeholder' && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderSpinner} />
          <span>Генерирую...</span>
        </div>
      )}
      {obj.type === 'drawing' && (
        <svg
          width={obj.width}
          height={obj.height}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <path
            d={obj.d}
            fill="none"
            stroke={obj.color}
            strokeWidth={obj.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {selected && (
        <>
          <div className={`${styles.handle} ${styles.tl}`} onMouseDown={e => handleCornerDown('tl', e)} />
          <div className={`${styles.handle} ${styles.tr}`} onMouseDown={e => handleCornerDown('tr', e)} />
          <div className={`${styles.handle} ${styles.bl}`} onMouseDown={e => handleCornerDown('bl', e)} />
          <div className={`${styles.handle} ${styles.br}`} onMouseDown={e => handleCornerDown('br', e)} />
        </>
      )}
    </div>
  )
}

export default CanvasObject
