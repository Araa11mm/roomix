import { useMemo } from 'react'
import type { CanvasObject } from '../types'
import type { Tool, Point, ClipBounds, SelectionRect } from './editorTypes'
import { lassoHitsObject, pointsToSmoothPath } from './editorTypes'

interface LassoState {
  lassoPath: Point[]
  lassoSelection: Point[]
  lassoClipBounds: ClipBounds | null
  lassoDrawingImageId: string | null
  lassoHoverImageId: string | null
}

interface BrushState {
  brushPoints: Point[]
  brushSize: number
  brushColor: string
  brushDrawingImageId: string | null
  brushHoverImageId: string | null
}

interface RectState {
  rectDrawStart: Point | null
  rectDrawCurrent: Point | null
  rectSelection: ClipBounds | null
  rectSelectionImageId: string | null
  rectDrawingImageId: string | null
  rectHoverImageId: string | null
}

interface MagicState {
  magicSelection: Point[]
  magicSelectionImageId: string | null
  magicHoverImageId: string | null
}

interface Deps {
  zoom: number
  offset: { x: number; y: number }
  activeTool: Tool
  objects: CanvasObject[]
  selectedIds: string[]
  selectionRect: SelectionRect | null
  lasso: LassoState
  brush: BrushState
  rect: RectState
  magic: MagicState
}

export function useCanvasOverlays({
  zoom, offset, activeTool, objects, selectedIds, selectionRect,
  lasso, brush, rect, magic,
}: Deps) {
  const z100 = zoom / 100

  const toScreen = (obj: CanvasObject) => ({
    x: obj.x * z100 + offset.x,
    y: obj.y * z100 + offset.y,
    width: obj.width * z100,
    height: obj.height * z100,
  })

  const screenRect = useMemo(() => selectionRect ? {
    left: Math.min(selectionRect.x1, selectionRect.x2) * z100 + offset.x,
    top: Math.min(selectionRect.y1, selectionRect.y2) * z100 + offset.y,
    width: Math.abs(selectionRect.x2 - selectionRect.x1) * z100,
    height: Math.abs(selectionRect.y2 - selectionRect.y1) * z100,
  } : null, [selectionRect, z100, offset])

  const activeSelectedIds = useMemo(() => {
    if (lasso.lassoPath.length > 2) {
      const hits = objects.filter(o => lassoHitsObject(lasso.lassoPath, o.x, o.y, o.width, o.height)).map(o => o.id)
      if (hits.length > 0) return hits
    }
    if (!selectionRect) return selectedIds
    const rx1 = Math.min(selectionRect.x1, selectionRect.x2)
    const ry1 = Math.min(selectionRect.y1, selectionRect.y2)
    const rx2 = Math.max(selectionRect.x1, selectionRect.x2)
    const ry2 = Math.max(selectionRect.y1, selectionRect.y2)
    return objects.filter(o => o.x < rx2 && o.x + o.width > rx1 && o.y < ry2 && o.y + o.height > ry1).map(o => o.id)
  }, [selectionRect, lasso.lassoPath, objects, selectedIds])

  const brushScreenPath = useMemo(() => {
    if (brush.brushPoints.length < 2) return ''
    return pointsToSmoothPath(brush.brushPoints.map(p => ({ x: p.x * z100 + offset.x, y: p.y * z100 + offset.y })))
  }, [brush.brushPoints, z100, offset])

  const lassoScreenPoints = useMemo(() => {
    if (lasso.lassoPath.length < 2) return ''
    return lasso.lassoPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * z100 + offset.x} ${p.y * z100 + offset.y}`).join(' ')
  }, [lasso.lassoPath, z100, offset])

  const lassoSelectionScreenPath = useMemo(() => {
    if (lasso.lassoSelection.length < 3) return ''
    return lasso.lassoSelection.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * z100 + offset.x} ${p.y * z100 + offset.y}`).join(' ') + ' Z'
  }, [lasso.lassoSelection, z100, offset])

  const lassoClipScreen = useMemo(() => {
    if (!lasso.lassoClipBounds) return null
    return { x: lasso.lassoClipBounds.x * z100 + offset.x, y: lasso.lassoClipBounds.y * z100 + offset.y, width: lasso.lassoClipBounds.width * z100, height: lasso.lassoClipBounds.height * z100 }
  }, [lasso.lassoClipBounds, z100, offset])

  const brushTargetId = activeTool === 'brush' ? (brush.brushDrawingImageId ?? brush.brushHoverImageId) : null
  const lassoTargetId = activeTool === 'lasso' ? (lasso.lassoDrawingImageId ?? lasso.lassoHoverImageId) : null
  const rectTargetId = activeTool === 'rect' ? (rect.rectDrawingImageId ?? rect.rectHoverImageId) : null
  const magicTargetId = activeTool === 'magic' ? magic.magicHoverImageId : null

  const lassoClipImg = objects.find(o => o.id === lasso.lassoDrawingImageId)
  const lassoImageClipScreen = lassoClipImg ? toScreen(lassoClipImg) : null

  const brushClipImg = objects.find(o => o.id === brush.brushDrawingImageId)
  const brushClipScreen = brushClipImg ? toScreen(brushClipImg) : null

  const rectClipImg = objects.find(o => o.id === (rect.rectDrawingImageId ?? rect.rectSelectionImageId))
  const rectImageClipScreen = rectClipImg ? toScreen(rectClipImg) : null

  const rectScreenPreview = (rect.rectDrawStart && rect.rectDrawCurrent) ? {
    x: Math.min(rect.rectDrawStart.x, rect.rectDrawCurrent.x) * z100 + offset.x,
    y: Math.min(rect.rectDrawStart.y, rect.rectDrawCurrent.y) * z100 + offset.y,
    width: Math.abs(rect.rectDrawCurrent.x - rect.rectDrawStart.x) * z100,
    height: Math.abs(rect.rectDrawCurrent.y - rect.rectDrawStart.y) * z100,
  } : null

  const rectSelectionScreen = rect.rectSelection ? {
    x: rect.rectSelection.x * z100 + offset.x,
    y: rect.rectSelection.y * z100 + offset.y,
    width: rect.rectSelection.width * z100,
    height: rect.rectSelection.height * z100,
  } : null

  const magicClipImg = objects.find(o => o.id === magic.magicSelectionImageId)
  const magicImageClipScreen = magicClipImg ? toScreen(magicClipImg) : null

  const magicSelectionScreenPath = magic.magicSelection.length >= 3
    ? magic.magicSelection.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * z100 + offset.x} ${p.y * z100 + offset.y}`).join(' ') + ' Z'
    : ''

  return {
    z100,
    screenRect,
    activeSelectedIds,
    brushScreenPath,
    lassoScreenPoints,
    lassoSelectionScreenPath,
    lassoClipScreen,
    brushTargetId, lassoTargetId, rectTargetId, magicTargetId,
    lassoImageClipScreen,
    brushClipScreen,
    rectImageClipScreen,
    rectScreenPreview,
    rectSelectionScreen,
    magicImageClipScreen,
    magicSelectionScreenPath,
  }
}
