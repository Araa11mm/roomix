import styles from './EditorToolbar.module.scss'
import mouseSvg from '../../../img/mouse.svg'
import handSvg from '../../../img/hand.svg'
import lassoSvg from '../../../img/lasso.svg'
import brushSvg from '../../../img/brush.svg'
import squareSvg from '../../../img/square.svg'
import wandSvg from '../../../img/wand-sparkles.svg'
import undoSvg from '../../../img/undo.svg'
import redoSvg from '../../../img/redo.svg'

type Tool = 'select' | 'hand' | 'lasso' | 'brush' | 'rect' | 'magic'

interface Props {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

const Tip = ({ label, hotkey }: { label: string; hotkey?: string }) => (
  <div className={styles.tooltip}>
    {label}
    {hotkey && <span className={styles.tooltipKey}>{hotkey}</span>}
  </div>
)

function EditorToolbar({ activeTool, onToolChange, onUndo, onRedo, canUndo, canRedo }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.btnWrap}>
        <button tabIndex={-1} className={`${styles.btn} ${activeTool === 'select' ? styles.active : ''}`} onClick={() => onToolChange('select')}>
          <img src={mouseSvg} width="18" height="18" alt="select" />
        </button>
        <Tip label="Выбор" hotkey="V" />
      </div>

      <div className={styles.btnWrap}>
        <button tabIndex={-1} className={`${styles.btn} ${activeTool === 'hand' ? styles.active : ''}`} onClick={() => onToolChange('hand')}>
          <img src={handSvg} width="18" height="18" alt="hand" />
        </button>
        <Tip label="Рука" hotkey="Пробел" />
      </div>

      <div className={styles.btnWrap}>
        <button tabIndex={-1} className={`${styles.btn} ${activeTool === 'lasso' ? styles.active : ''}`} onClick={() => onToolChange('lasso')}>
          <img src={lassoSvg} width="18" height="18" alt="lasso" />
        </button>
        <Tip label="Лассо" hotkey="L" />
      </div>

      <div className={styles.btnWrap}>
        <button tabIndex={-1} className={`${styles.btn} ${activeTool === 'brush' ? styles.active : ''}`} onClick={() => onToolChange('brush')}>
          <img src={brushSvg} width="18" height="18" alt="brush" />
        </button>
        <Tip label="Кисть" hotkey="B" />
      </div>

      <div className={styles.btnWrap}>
        <button tabIndex={-1} className={`${styles.btn} ${activeTool === 'rect' ? styles.active : ''}`} onClick={() => onToolChange('rect')}>
          <img src={squareSvg} width="18" height="18" alt="rect" />
        </button>
        <Tip label="Выделение" hotkey="M" />
      </div>

      <div className={styles.btnWrap}>
        <button tabIndex={-1} className={`${styles.btn} ${activeTool === 'magic' ? styles.active : ''}`} onClick={() => onToolChange('magic')}>
          <img src={wandSvg} width="18" height="18" alt="magic" />
        </button>
        <Tip label="Умное выделение" hotkey="W" />
      </div>

      <div className={styles.divider} />

      <div className={styles.btnWrap}>
        <button tabIndex={-1} className={`${styles.btn} ${!canUndo ? styles.disabled : ''}`} onClick={onUndo} disabled={!canUndo}>
          <img src={undoSvg} width="18" height="18" alt="undo" />
        </button>
        <Tip label="Отменить" hotkey="Ctrl+Z" />
      </div>

      <div className={styles.btnWrap}>
        <button tabIndex={-1} className={`${styles.btn} ${!canRedo ? styles.disabled : ''}`} onClick={onRedo} disabled={!canRedo}>
          <img src={redoSvg} width="18" height="18" alt="redo" />
        </button>
        <Tip label="Повторить" hotkey="Ctrl+Y" />
      </div>
    </div>
  )
}

export default EditorToolbar
