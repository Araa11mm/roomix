import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import type { CanvasObject } from '../types'
import type { Point } from './editorTypes'
import { pointsToSmoothPath } from './editorTypes'

interface Deps {
  objectsRef: React.RefObject<CanvasObject[]>
  saveHistory: () => void
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
}

export function useBrushTool({ objectsRef, saveHistory, setObjects, setSelectedIds }: Deps) {
  const [brushPoints, setBrushPoints] = useState<Point[]>([])
  const [brushSize, setBrushSize] = useState(20)
  const [brushHoverImageId, setBrushHoverImageId] = useState<string | null>(null)
  const [brushDrawingImageId, setBrushDrawingImageId] = useState<string | null>(null)

  const brushColor = 'rgba(255, 255, 255, 0.55)'
  const brushColorRef = useRef(brushColor)
  const brushSizeRef = useRef(brushSize)
  const isBrush = useRef(false)
  const brushTargetImageRef = useRef<CanvasObject | null>(null)
  const brushPointsRef = useRef<Point[]>([])

  useLayoutEffect(() => {
    brushColorRef.current = brushColor
    brushSizeRef.current = brushSize
  })

  const onMouseDown = useCallback((pos: Point) => {
    const targetImg = objectsRef.current.find(
      o => o.type === 'image' &&
           pos.x >= o.x && pos.x <= o.x + o.width &&
           pos.y >= o.y && pos.y <= o.y + o.height
    )
    if (!targetImg) return
    brushTargetImageRef.current = targetImg
    setBrushDrawingImageId(targetImg.id)
    isBrush.current = true
    brushPointsRef.current = [pos]
    setBrushPoints([pos])
  }, [objectsRef])

  const onMouseMove = useCallback((pos: Point, active: boolean) => {
    if (!active) {
      const hovered = objectsRef.current.find(
        o => o.type === 'image' &&
             pos.x >= o.x && pos.x <= o.x + o.width &&
             pos.y >= o.y && pos.y <= o.y + o.height
      )
      setBrushHoverImageId(hovered?.id ?? null)
      return
    }
    const img = brushTargetImageRef.current
    const clamped = img ? {
      x: Math.max(img.x, Math.min(img.x + img.width, pos.x)),
      y: Math.max(img.y, Math.min(img.y + img.height, pos.y)),
    } : pos
    const prev = brushPointsRef.current
    const last = prev[prev.length - 1]
    if (!last || Math.hypot(clamped.x - last.x, clamped.y - last.y) >= 2) {
      brushPointsRef.current = [...prev, clamped]
      setBrushPoints(brushPointsRef.current)
    }
  }, [objectsRef])

  const onMouseUp = useCallback(() => {
    if (!isBrush.current || brushPointsRef.current.length <= 1) return
    saveHistory()
    const pts = brushPointsRef.current
    const sw = brushSizeRef.current
    const parentImageId = brushTargetImageRef.current?.id
    const xs = pts.map(p => p.x)
    const ys = pts.map(p => p.y)
    const minX = Math.min(...xs) - sw
    const minY = Math.min(...ys) - sw
    const maxX = Math.max(...xs) + sw
    const maxY = Math.max(...ys) + sw
    const w = maxX - minX
    const h = maxY - minY
    const d = pointsToSmoothPath(pts.map(p => ({ x: p.x - minX, y: p.y - minY })))
    const color = brushColorRef.current
    setObjects(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'drawing' as const,
      d, color, strokeWidth: sw,
      x: minX, y: minY, width: w, height: h,
      parentImageId,
    }])
    if (parentImageId) setSelectedIds([parentImageId])
  }, [saveHistory, setObjects, setSelectedIds])

  const reset = useCallback(() => {
    isBrush.current = false
    brushTargetImageRef.current = null
    brushPointsRef.current = []
    setBrushPoints([])
    setBrushDrawingImageId(null)
  }, [])

  const isActive = () => isBrush.current

  return {
    brushPoints, brushSize, setBrushSize, brushColor,
    brushHoverImageId, brushDrawingImageId,
    brushColorRef, brushSizeRef, isBrush,
    onMouseDown, onMouseMove, onMouseUp, reset, isActive,
  }
}
