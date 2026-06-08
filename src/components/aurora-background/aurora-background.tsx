import React, { useEffect, useRef } from 'react'
import styles from './aurora-background.module.scss'

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  showRadialGradient?: boolean
}

const AuroraBackground = ({
  className,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  const auroraRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = auroraRef.current
    if (!el) return

    const pause = () => {
      el.style.animationPlayState = 'paused'
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        el.style.animationPlayState = 'running'
      }, 150)
    }

    window.addEventListener('scroll', pause, { passive: true })
    return () => {
      window.removeEventListener('scroll', pause)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className={`${styles.wrapper} ${className || ''}`} {...props}>
      <div className={styles.backdrop}>
        <div
          ref={auroraRef}
          className={`${styles.aurora} ${showRadialGradient ? styles.withMask : ''}`}
        />
      </div>
    </div>
  )
}

export default AuroraBackground
