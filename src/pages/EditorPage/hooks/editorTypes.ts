import type { CanvasObject } from '../types'

export type Tool = 'select' | 'hand' | 'lasso' | 'brush' | 'rect' | 'magic'

export type Point = { x: number; y: number }

export type SelectionRect = { x1: number; y1: number; x2: number; y2: number }

export type ClipBounds = { x: number; y: number; width: number; height: number }

export type Snapshot = {
  objects: CanvasObject[]
  lassoSelection: Point[]
  lassoClipBounds: ClipBounds | null
  lassoSelectionImageId: string | null
  rectSelection: ClipBounds | null
  rectSelectionImageId: string | null
  magicSelection: Point[]
  magicSelectionImageId: string | null
}

export function pointsToSmoothPath(pts: Point[]): string {
  if (pts.length < 2) return ''
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`
  return d
}

export function pointInPolygon(px: number, py: number, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi))
      inside = !inside
  }
  return inside
}

export function lassoHitsObject(polygon: Point[], ox: number, oy: number, ow: number, oh: number): boolean {
  if (pointInPolygon(ox + ow / 2, oy + oh / 2, polygon)) return true
  return polygon.some(p => p.x >= ox && p.x <= ox + ow && p.y >= oy && p.y <= oy + oh)
}
