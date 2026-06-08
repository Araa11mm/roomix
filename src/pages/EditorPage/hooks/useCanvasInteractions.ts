import { useRef, useCallback } from 'react'
import type { CanvasObject } from '../types'
import type { Tool, Point, ClipBounds, SelectionRect } from './editorTypes'
import type { Corner } from '../CanvasObject/CanvasObject'

interface LassoDeps {
  onMouseDown: (pos: Point) => void
  onMouseMove: (pos: Point, active: boolean) => void
  onMouseUp: () => void
  reset: () => void
  isActive: () => boolean
  setLassoSelection: (pts: Point[]) => void
  setLassoClipBounds: (b: ClipBounds | null) => void
  lassoSelectionRef: { current: Point[] }
  lassoClipBoundsRef: { current: ClipBounds | null }
  lassoSelectionImageIdRef: { current: string | null }
}

interface BrushDeps {
  onMouseDown: (pos: Point) => void
  onMouseMove: (pos: Point, active: boolean) => void
  onMouseUp: () => void
  reset: () => void
  isActive: () => boolean
}

interface RectDeps {
  onMouseDown: (pos: Point) => void
  onMouseMove: (pos: Point, active: boolean) => void
  onMouseUp: () => void
  reset: () => void
  isActive: () => boolean
  setRectSelection: (r: ClipBounds | null) => void
  rectSelectionRef: { current: ClipBounds | null }
  rectSelectionImageIdRef: { current: string | null }
}

interface MagicDeps {
  onClick: (pos: Point) => void
  onMouseMove: (pos: Point) => void
  setMagicSelection: (pts: Point[]) => void
  magicSelectionRef: { current: Point[] }
  magicSelectionImageIdRef: { current: string | null }
}

interface Deps {
  canvasRef: React.RefObject<HTMLElement>
  objectsRef: { current: CanvasObject[] }
  selectedIdsRef: { current: string[] }
  activeToolRef: { current: Tool }
  selectionRectRef: { current: SelectionRect | null }
  zoomRef: { current: number }
  offsetRef: { current: { x: number; y: number } }
  spaceDownRef: { current: boolean }
  startPan: (x: number, y: number) => void
  onPanMouseMove: (x: number, y: number) => void
  onPanMouseUp: () => void
  lasso: LassoDeps
  brush: BrushDeps
  rect: RectDeps
  magic: MagicDeps
  saveHistory: () => void
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  setSelectionRect: React.Dispatch<React.SetStateAction<SelectionRect | null>>
}

export function useCanvasInteractions({
  canvasRef, objectsRef, selectedIdsRef, activeToolRef, selectionRectRef,
  zoomRef, offsetRef, spaceDownRef,
  startPan, onPanMouseMove, onPanMouseUp,
  lasso, brush, rect, magic,
  saveHistory, setObjects, setSelectedIds, setSelectionRect,
}: Deps) {
  const isMarquee = useRef(false)
  const draggingObj = useRef<{
    ids: string[]
    startMX: number; startMY: number
    startPositions: Record<string, { x: number; y: number }>
    lassoOrigPoints: Point[]
    lassoOrigClipBounds: ClipBounds | null
    lassoImageId: string | null
    rectOrigBounds: ClipBounds | null
    rectImageId: string | null
    magicOrigPoints: Point[]
    magicImageId: string | null
  } | null>(null)
  const resizingObj = useRef<{
    id: string; corner: Corner
    startMX: number; startMY: number
    startX: number; startY: number
    startW: number; startH: number
  } | null>(null)

  const toCanvasSpace = useCallback((screenX: number, screenY: number): Point => {
    const el = canvasRef.current?.getBoundingClientRect()
    if (!el) return { x: screenX, y: screenY }
    const { x: ox, y: oy } = offsetRef.current
    const z = zoomRef.current / 100
    return { x: (screenX - el.left - ox) / z, y: (screenY - el.top - oy) / z }
  }, [canvasRef, offsetRef, zoomRef])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const isMiddle = e.button === 1
    const isSpacePan = spaceDownRef.current && e.button === 0
    const isHandTool = activeToolRef.current === 'hand' && e.button === 0
    if (isMiddle || isSpacePan || isHandTool) {
      e.preventDefault()
      startPan(e.clientX, e.clientY)
      return
    }
    const pos = toCanvasSpace(e.clientX, e.clientY)
    if (activeToolRef.current === 'select') {
      isMarquee.current = true
      setSelectionRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
      setSelectedIds([])
    }
    if (activeToolRef.current === 'lasso') lasso.onMouseDown(pos)
    if (activeToolRef.current === 'brush') brush.onMouseDown(pos)
    if (activeToolRef.current === 'magic') magic.onClick(pos)
    if (activeToolRef.current === 'rect') rect.onMouseDown(pos)
  }, [spaceDownRef, activeToolRef, startPan, toCanvasSpace, lasso, brush, magic, rect, setSelectionRect, setSelectedIds])

  const handleObjectMouseDown = useCallback((e: React.MouseEvent, obj: CanvasObject) => {
    if (activeToolRef.current !== 'select') return
    e.stopPropagation()
    saveHistory()
    const ids = selectedIdsRef.current.includes(obj.id) ? selectedIdsRef.current : [obj.id]
    setSelectedIds(ids)
    const startPositions: Record<string, { x: number; y: number }> = {}
    objectsRef.current.forEach(o => {
      if (ids.includes(o.id)) startPositions[o.id] = { x: o.x, y: o.y }
      if (o.type === 'drawing' && o.parentImageId && ids.includes(o.parentImageId))
        startPositions[o.id] = { x: o.x, y: o.y }
    })
    draggingObj.current = {
      ids, startMX: e.clientX, startMY: e.clientY, startPositions,
      lassoOrigPoints: lasso.lassoSelectionRef.current,
      lassoOrigClipBounds: lasso.lassoClipBoundsRef.current,
      lassoImageId: lasso.lassoSelectionImageIdRef.current,
      rectOrigBounds: rect.rectSelectionRef.current,
      rectImageId: rect.rectSelectionImageIdRef.current,
      magicOrigPoints: magic.magicSelectionRef.current,
      magicImageId: magic.magicSelectionImageIdRef.current,
    }
  }, [activeToolRef, saveHistory, selectedIdsRef, objectsRef, setSelectedIds, lasso, rect, magic])

  const handleResizeStart = useCallback((corner: Corner, e: React.MouseEvent, obj: CanvasObject) => {
    saveHistory()
    resizingObj.current = {
      id: obj.id, corner,
      startMX: e.clientX, startMY: e.clientY,
      startX: obj.x, startY: obj.y,
      startW: obj.width, startH: obj.height,
    }
  }, [saveHistory])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const z = zoomRef.current / 100
    onPanMouseMove(e.clientX, e.clientY)

    const pos = toCanvasSpace(e.clientX, e.clientY)

    if (isMarquee.current) {
      setSelectionRect(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null)
    }

    if (activeToolRef.current === 'lasso') lasso.onMouseMove(pos, lasso.isActive())
    if (activeToolRef.current === 'brush') brush.onMouseMove(pos, brush.isActive())
    if (activeToolRef.current === 'rect') rect.onMouseMove(pos, rect.isActive())
    if (activeToolRef.current === 'magic') magic.onMouseMove(pos)

    if (draggingObj.current) {
      const d = draggingObj.current
      const dx = (e.clientX - d.startMX) / z
      const dy = (e.clientY - d.startMY) / z
      setObjects(prev => prev.map(o =>
        d.startPositions[o.id] !== undefined
          ? { ...o, x: d.startPositions[o.id].x + dx, y: d.startPositions[o.id].y + dy }
          : o
      ))
      if (d.lassoImageId && d.ids.includes(d.lassoImageId) && d.lassoOrigPoints.length > 0) {
        lasso.setLassoSelection(d.lassoOrigPoints.map(p => ({ x: p.x + dx, y: p.y + dy })))
        if (d.lassoOrigClipBounds)
          lasso.setLassoClipBounds({ ...d.lassoOrigClipBounds, x: d.lassoOrigClipBounds.x + dx, y: d.lassoOrigClipBounds.y + dy })
      }
      if (d.magicImageId && d.ids.includes(d.magicImageId) && d.magicOrigPoints.length > 0)
        magic.setMagicSelection(d.magicOrigPoints.map(p => ({ x: p.x + dx, y: p.y + dy })))
      if (d.rectImageId && d.ids.includes(d.rectImageId) && d.rectOrigBounds)
        rect.setRectSelection({ ...d.rectOrigBounds, x: d.rectOrigBounds.x + dx, y: d.rectOrigBounds.y + dy })
    }

    if (resizingObj.current) {
      const r = resizingObj.current
      const dx = (e.clientX - r.startMX) / z
      const aspect = r.startW / r.startH
      setObjects(prev => prev.map(o => {
        if (o.id !== r.id) return o
        let { x, y, width: w, height: h } = { x: r.startX, y: r.startY, width: r.startW, height: r.startH }
        if (r.corner === 'br') { w = Math.max(50, r.startW + dx); h = w / aspect }
        else if (r.corner === 'bl') { w = Math.max(50, r.startW - dx); h = w / aspect; x = r.startX + (r.startW - w) }
        else if (r.corner === 'tr') { w = Math.max(50, r.startW + dx); h = w / aspect; y = r.startY + (r.startH - h) }
        else if (r.corner === 'tl') { w = Math.max(50, r.startW - dx); h = w / aspect; x = r.startX + (r.startW - w); y = r.startY + (r.startH - h) }
        return { ...o, x, y, width: w, height: h }
      }))
    }
  }, [zoomRef, activeToolRef, toCanvasSpace, onPanMouseMove, lasso, brush, rect, magic, setObjects, setSelectionRect])

  const handleMouseUp = useCallback(() => {
    if (isMarquee.current && selectionRectRef.current) {
      const sr = selectionRectRef.current
      const rx1 = Math.min(sr.x1, sr.x2), ry1 = Math.min(sr.y1, sr.y2)
      const rx2 = Math.max(sr.x1, sr.x2), ry2 = Math.max(sr.y1, sr.y2)
      const hit = objectsRef.current
        .filter(o => o.x < rx2 && o.x + o.width > rx1 && o.y < ry2 && o.y + o.height > ry1)
        .map(o => o.id)
      setSelectedIds(hit)
    }
    lasso.onMouseUp()
    brush.onMouseUp()
    rect.onMouseUp()
    lasso.reset()
    brush.reset()
    rect.reset()
    isMarquee.current = false
    draggingObj.current = null
    resizingObj.current = null
    setSelectionRect(null)
    onPanMouseUp()
  }, [lasso, brush, rect, onPanMouseUp, selectionRectRef, objectsRef, setSelectedIds, setSelectionRect])

  return { handleCanvasMouseDown, handleObjectMouseDown, handleResizeStart, handleMouseMove, handleMouseUp }
}
