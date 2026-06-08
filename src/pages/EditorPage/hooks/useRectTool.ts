import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import type { CanvasObject } from '../types'
import type { Point } from './editorTypes'

interface Deps {
  objectsRef: React.RefObject<CanvasObject[]>
  saveHistory: () => void
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
}

export function useRectTool({ objectsRef, saveHistory, setSelectedIds }: Deps) {
  const [rectDrawStart, setRectDrawStart] = useState<Point | null>(null)
  const [rectDrawCurrent, setRectDrawCurrent] = useState<Point | null>(null)
  const [rectSelection, setRectSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [rectSelectionImageId, setRectSelectionImageId] = useState<string | null>(null)
  const [rectHoverImageId, setRectHoverImageId] = useState<string | null>(null)
  const [rectDrawingImageId, setRectDrawingImageId] = useState<string | null>(null)

  const rectSelectionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const rectSelectionImageIdRef = useRef<string | null>(null)
  const isRect = useRef(false)
  const rectTargetImageRef = useRef<CanvasObject | null>(null)
  const rectStartRef = useRef<Point | null>(null)
  const rectCurrentRef = useRef<Point | null>(null)

  useLayoutEffect(() => {
    rectSelectionRef.current = rectSelection
    rectSelectionImageIdRef.current = rectSelectionImageId
  })

  const onMouseDown = useCallback((pos: Point) => {
    const targetImg = objectsRef.current.find(
      o => o.type === 'image' &&
           pos.x >= o.x && pos.x <= o.x + o.width &&
           pos.y >= o.y && pos.y <= o.y + o.height
    )
    if (!targetImg) return
    rectTargetImageRef.current = targetImg
    setRectDrawingImageId(targetImg.id)
    isRect.current = true
    rectStartRef.current = pos
    rectCurrentRef.current = pos
    setRectDrawStart(pos)
    setRectDrawCurrent(pos)
    setRectSelection(null)
    setRectSelectionImageId(null)
  }, [objectsRef])

  const onMouseMove = useCallback((pos: Point, active: boolean) => {
    if (!active) {
      const hovered = objectsRef.current.find(
        o => o.type === 'image' &&
             pos.x >= o.x && pos.x <= o.x + o.width &&
             pos.y >= o.y && pos.y <= o.y + o.height
      )
      setRectHoverImageId(hovered?.id ?? null)
      return
    }
    const img = rectTargetImageRef.current
    const clamped = img ? {
      x: Math.max(img.x, Math.min(img.x + img.width, pos.x)),
      y: Math.max(img.y, Math.min(img.y + img.height, pos.y)),
    } : pos
    rectCurrentRef.current = clamped
    setRectDrawCurrent(clamped)
  }, [objectsRef])

  const onMouseUp = useCallback(() => {
    if (!isRect.current || !rectStartRef.current || !rectCurrentRef.current) return
    saveHistory()
    const start = rectStartRef.current
    const end = rectCurrentRef.current
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)
    if (width > 2 && height > 2) {
      const imgId = rectTargetImageRef.current?.id ?? null
      setRectSelection({ x, y, width, height })
      setRectSelectionImageId(imgId)
      if (imgId) setSelectedIds([imgId])
    }
  }, [saveHistory, setSelectedIds])

  const reset = useCallback(() => {
    isRect.current = false
    rectTargetImageRef.current = null
    rectStartRef.current = null
    rectCurrentRef.current = null
    setRectDrawStart(null)
    setRectDrawCurrent(null)
    setRectDrawingImageId(null)
  }, [])

  const clearSelection = useCallback(() => {
    setRectSelection(null)
    setRectSelectionImageId(null)
  }, [])

  const isActive = () => isRect.current

  return {
    rectDrawStart, rectDrawCurrent, rectSelection, rectSelectionImageId,
    rectHoverImageId, rectDrawingImageId,
    rectSelectionRef, rectSelectionImageIdRef, isRect,
    onMouseDown, onMouseMove, onMouseUp, reset, clearSelection, isActive,
    setRectSelection, setRectSelectionImageId,
  }
}
