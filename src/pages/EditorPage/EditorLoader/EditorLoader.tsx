import { useEffect, useState } from 'react'
import Logo from '../../../img/Logo.svg'
import styles from './EditorLoader.module.scss'

interface Props {
  visible: boolean
}

function EditorLoader({ visible }: Props) {
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => setMounted(false), 400)
      return () => clearTimeout(t)
    }
  }, [visible])

  if (!mounted) return null

  return (
    <div className={`${styles.overlay} ${!visible ? styles.fadeOut : ''}`}>
      <img src={Logo} alt="Roomix" className={styles.logo} />
      <div className={styles.track}>
        <div className={styles.fill} />
      </div>
    </div>
  )
}

export default EditorLoader
