import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'

const MIN_ZOOM = 25
const MAX_ZOOM = 300
const STEP = 10
const clampZoom = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v))

export function useZoomPan(canvasRef: React.RefObject<HTMLElement>) {
  const [zoom, setZoom] = useState(() => window.innerWidth <= 768 ? 70 : 100)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [spaceDown, setSpaceDown] = useState(false)
  const [grabbing, setGrabbing] = useState(false)

  const zoomRef = useRef(zoom)
  const offsetRef = useRef(offset)
  const spaceDownRef = useRef(spaceDown)
  const isPanningRef = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const pendingDelta = useRef({ dx: 0, dy: 0 })

  useLayoutEffect(() => {
    zoomRef.current = zoom
    offsetRef.current = offset
    spaceDownRef.current = spaceDown
  })

  const handleZoomIn = useCallback(() =>
    setZoom(z => clampZoom(Math.round(z / STEP) * STEP + STEP)), [])

  const handleZoomOut = useCallback(() =>
    setZoom(z => clampZoom(Math.round(z / STEP) * STEP - STEP)), [])

  const startPan = useCallback((x: number, y: number) => {
    isPanningRef.current = true
    lastPos.current = { x, y }
    setGrabbing(true)
  }, [])

  const onPanMouseMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanningRef.current) return
    const dx = clientX - lastPos.current.x
    const dy = clientY - lastPos.current.y
    lastPos.current = { x: clientX, y: clientY }
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
  }, [])

  const onPanMouseUp = useCallback(() => {
    isPanningRef.current = false
    setGrabbing(false)
  }, [])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        const rect = el.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const oldZoom = zoomRef.current
        const newZoom = clampZoom(Math.round(oldZoom / STEP) * STEP + (e.deltaY < 0 ? STEP : -STEP))
        const scale = newZoom / oldZoom
        const ox = offsetRef.current.x
        const oy = offsetRef.current.y
        setZoom(newZoom)
        setOffset({ x: mx - (mx - ox) * scale, y: my - (my - oy) * scale })
      } else {
        setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [canvasRef])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, input, textarea, a, img, [role="button"]')) return
      if (e.touches.length === 1) {
        isPanningRef.current = true
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        setGrabbing(true)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isPanningRef.current) {
        e.preventDefault()
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        pendingDelta.current.dx += x - lastPos.current.x
        pendingDelta.current.dy += y - lastPos.current.y
        lastPos.current = { x, y }
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            const { dx, dy } = pendingDelta.current
            pendingDelta.current = { dx: 0, dy: 0 }
            rafRef.current = null
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
          })
        }
      }
    }

    const onTouchEnd = () => {
      isPanningRef.current = false
      setGrabbing(false)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [canvasRef])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      e.preventDefault()
      setSpaceDown(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      setSpaceDown(false)
      isPanningRef.current = false
      setGrabbing(false)
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [])

  return {
    zoom, offset, spaceDown, grabbing,
    zoomRef, offsetRef, spaceDownRef, isPanningRef,
    handleZoomIn, handleZoomOut,
    startPan, onPanMouseMove, onPanMouseUp,
    setOffset,
  }
}
