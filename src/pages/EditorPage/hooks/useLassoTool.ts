import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import type { CanvasObject } from '../types'
import type { Point } from './editorTypes'
import { lassoHitsObject } from './editorTypes'

interface Deps {
  objectsRef: React.RefObject<CanvasObject[]>
  saveHistory: () => void
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
}

export function useLassoTool({ objectsRef, saveHistory, setSelectedIds }: Deps) {
  const [lassoPath, setLassoPath] = useState<Point[]>([])
  const [lassoSelection, setLassoSelection] = useState<Point[]>([])
  const [lassoClipBounds, setLassoClipBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [lassoSelectionImageId, setLassoSelectionImageId] = useState<string | null>(null)
  const [lassoHoverImageId, setLassoHoverImageId] = useState<string | null>(null)
  const [lassoDrawingImageId, setLassoDrawingImageId] = useState<string | null>(null)

  const lassoSelectionRef = useRef<Point[]>([])
  const lassoClipBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const lassoSelectionImageIdRef = useRef<string | null>(null)
  const isLasso = useRef(false)
  const lassoTargetImageRef = useRef<CanvasObject | null>(null)
  const lassoPointsRef = useRef<Point[]>([])

  useLayoutEffect(() => {
    lassoSelectionRef.current = lassoSelection
    lassoClipBoundsRef.current = lassoClipBounds
    lassoSelectionImageIdRef.current = lassoSelectionImageId
  })

  const onMouseDown = useCallback((pos: Point) => {
    const targetImg = objectsRef.current.find(
      o => o.type === 'image' &&
           pos.x >= o.x && pos.x <= o.x + o.width &&
           pos.y >= o.y && pos.y <= o.y + o.height
    )
    if (!targetImg) return
    lassoTargetImageRef.current = targetImg
    setLassoDrawingImageId(targetImg.id)
    isLasso.current = true
    lassoPointsRef.current = [pos]
    setLassoPath([pos])
  }, [objectsRef])

  const onMouseMove = useCallback((pos: Point, active: boolean) => {
    if (!active) {
      const hovered = objectsRef.current.find(
        o => o.type === 'image' &&
             pos.x >= o.x && pos.x <= o.x + o.width &&
             pos.y >= o.y && pos.y <= o.y + o.height
      )
      setLassoHoverImageId(hovered?.id ?? null)
      return
    }
    const img = lassoTargetImageRef.current
    const clamped = img ? {
      x: Math.max(img.x, Math.min(img.x + img.width, pos.x)),
      y: Math.max(img.y, Math.min(img.y + img.height, pos.y)),
    } : pos
    const prev = lassoPointsRef.current
    const last = prev[prev.length - 1]
    if (!last || Math.hypot(clamped.x - last.x, clamped.y - last.y) >= 4) {
      lassoPointsRef.current = [...prev, clamped]
      setLassoPath(lassoPointsRef.current)
    }
  }, [objectsRef])

  const onMouseUp = useCallback(() => {
    if (!isLasso.current || lassoPointsRef.current.length <= 2) return
    saveHistory()
    const polygon = lassoPointsRef.current
    const hit = objectsRef.current
      .filter(o => lassoHitsObject(polygon, o.x, o.y, o.width, o.height))
      .map(o => o.id)
    if (hit.length > 0) {
      const hitObjs = objectsRef.current.filter(o => hit.includes(o.id))
      const minX = Math.min(...hitObjs.map(o => o.x))
      const minY = Math.min(...hitObjs.map(o => o.y))
      const maxX = Math.max(...hitObjs.map(o => o.x + o.width))
      const maxY = Math.max(...hitObjs.map(o => o.y + o.height))
      setLassoClipBounds({ x: minX, y: minY, width: maxX - minX, height: maxY - minY })
      setLassoSelection(polygon)
      setSelectedIds(hit)
      setLassoSelectionImageId(lassoTargetImageRef.current?.id ?? null)
    }
  }, [objectsRef, saveHistory, setSelectedIds])

  const reset = useCallback(() => {
    isLasso.current = false
    lassoTargetImageRef.current = null
    lassoPointsRef.current = []
    setLassoPath([])
    setLassoDrawingImageId(null)
  }, [])

  const clearSelection = useCallback(() => {
    setLassoSelection([])
    setLassoClipBounds(null)
    setLassoSelectionImageId(null)
  }, [])

  const isActive = () => isLasso.current

  return {
    lassoPath, lassoSelection, lassoClipBounds, lassoSelectionImageId,
    lassoHoverImageId, lassoDrawingImageId,
    lassoSelectionRef, lassoClipBoundsRef, lassoSelectionImageIdRef,
    isLasso,
    onMouseDown, onMouseMove, onMouseUp, reset, clearSelection, isActive,
    setLassoSelection, setLassoClipBounds, setLassoSelectionImageId,
  }
}
