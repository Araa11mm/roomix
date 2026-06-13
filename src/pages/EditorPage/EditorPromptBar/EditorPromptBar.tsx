import { useState, useRef, useEffect } from 'react'
import styles from './EditorPromptBar.module.scss'
import armchairIcon from '../../../img/Armchair.svg'
import imageUpIcon from '../../../img/ImageUp.png'

interface Props {
  onUpload: (file: File) => void
  onSubmit: (prompt: string, furnitureFile?: File | null) => void
  generating?: boolean
  selectedStyle?: string | null
  selectedStylePrompt?: string | null
  onStyleRemove?: () => void
  stylesOpen?: boolean
  onStylesToggle?: () => void
}

function EditorPromptBar({ onUpload, onSubmit, generating, selectedStyle, selectedStylePrompt, onStyleRemove, stylesOpen, onStylesToggle }: Props) {
  const [value, setValue] = useState('')
  const [furnitureFile, setFurnitureFile] = useState<File | null>(null)
  const [furniturePreview, setFurniturePreview] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const furnitureRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = () => {
    setMenuClosing(true)
  }

  const handleMenuAnimationEnd = () => {
    if (menuClosing) {
      setMenuOpen(false)
      setMenuClosing(false)
    }
  }

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen, menuClosing])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { onUpload(file); closeMenu() }
    e.target.value = ''
  }

  const handleFurnitureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFurnitureFile(file)
    setFurniturePreview(URL.createObjectURL(file))
    closeMenu()
    e.target.value = ''
  }

  const removeFurniture = () => {
    if (furniturePreview) URL.revokeObjectURL(furniturePreview)
    setFurnitureFile(null)
    setFurniturePreview(null)
  }

  const canSubmit = !generating && (!!value.trim() || !!selectedStylePrompt || !!furnitureFile)

  const handleSubmit = () => {
    if (!canSubmit) return
    const trimmed = value.trim()
    let prompt = ''
    if (selectedStylePrompt && trimmed) prompt = `${selectedStylePrompt} Additionally: ${trimmed}`
    else if (selectedStylePrompt) prompt = selectedStylePrompt
    else prompt = trimmed
    onSubmit(prompt, furnitureFile)
    setValue('')
    removeFurniture()
  }

  const hasChips = !!selectedStyle || !!furniturePreview

  return (
    <div className={styles.bar}>
      <input id="upload-room" ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      <input id="upload-furniture" ref={furnitureRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFurnitureFile} />

      <div className={styles.addWrap} ref={menuRef}>
        <button
          className={`${styles.addBtn} ${menuOpen ? styles.addBtnActive : ''}`}
          title="Добавить"
          onClick={() => menuOpen ? closeMenu() : setMenuOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        {menuOpen && (
          <div
            className={`${styles.menu} ${menuClosing ? styles.menuOut : ''}`}
            onAnimationEnd={handleMenuAnimationEnd}
          >
            <label
              htmlFor="upload-room"
              className={styles.menuItem}
              onClick={closeMenu}
            >
              <img src={imageUpIcon} width="14" height="15" alt="" />
              Загрузить комнату
            </label>
            <label
              htmlFor="upload-furniture"
              className={styles.menuItem}
              onClick={closeMenu}
            >
              <img src={armchairIcon} width="15" height="15" alt="" />
              Добавить предмет
            </label>
          </div>
        )}
      </div>

      <div className={styles.middle}>
        <input
          className={styles.input}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={generating ? 'Генерация...' : 'Опишите желаемый стиль комнаты...'}
          disabled={generating}

        />
        {hasChips && (
          <div className={styles.chips}>
            {selectedStyle && (
              <span className={styles.chip}>
                {selectedStyle}
                <button className={styles.chipRemove} onClick={onStyleRemove} tabIndex={-1}>×</button>
              </span>
            )}
            {furniturePreview && (
              <span className={styles.chip}>
                <img src={furniturePreview} className={styles.chipThumb} alt="мебель" />
                Предмет мебели
                <button className={styles.chipRemove} onClick={removeFurniture} tabIndex={-1}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.paletteBtn} ${stylesOpen ? styles.paletteBtnActive : ''}`}
          title="Стили интерьера"
          onClick={onStylesToggle}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/>
            <circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
        </button>
        <button
          className={styles.sendBtn}
          title="Отправить"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {generating ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default EditorPromptBar
