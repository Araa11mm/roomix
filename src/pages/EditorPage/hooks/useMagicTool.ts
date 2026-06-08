import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import type { CanvasObject } from '../types'
import type { Point } from './editorTypes'

interface Deps {
  objectsRef: React.RefObject<CanvasObject[]>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
}

export function useMagicTool({ objectsRef, setSelectedIds }: Deps) {
  const [magicSelection, setMagicSelection] = useState<Point[]>([])
  const [magicSelectionImageId, setMagicSelectionImageId] = useState<string | null>(null)
  const [magicHoverImageId, setMagicHoverImageId] = useState<string | null>(null)
  const [magicLoading, setMagicLoading] = useState(false)

  const magicSelectionRef = useRef<Point[]>([])
  const magicSelectionImageIdRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    magicSelectionRef.current = magicSelection
    magicSelectionImageIdRef.current = magicSelectionImageId
  })

  const onMouseMove = useCallback((pos: Point) => {
    const hovered = objectsRef.current.find(
      o => o.type === 'image' &&
           pos.x >= o.x && pos.x <= o.x + o.width &&
           pos.y >= o.y && pos.y <= o.y + o.height
    )
    setMagicHoverImageId(hovered?.id ?? null)
  }, [objectsRef])

  const onClick = useCallback((pos: Point) => {
    const targetImg = objectsRef.current.find(
      o => o.type === 'image' &&
           pos.x >= o.x && pos.x <= o.x + o.width &&
           pos.y >= o.y && pos.y <= o.y + o.height
    )
    if (!targetImg) return
    setMagicLoading(true)

    const offscreen = document.createElement('canvas')
    const htmlImg = new Image()
    htmlImg.src = (targetImg as { src: string }).src
    htmlImg.onload = async () => {
      offscreen.width = htmlImg.naturalWidth
      offscreen.height = htmlImg.naturalHeight
      const ctx = offscreen.getContext('2d')!
      ctx.drawImage(htmlImg, 0, 0)
      const base64 = offscreen.toDataURL('image/jpeg', 0.85).split(',')[1]
      const xPct = Math.round((pos.x - targetImg.x) / targetImg.width * 100)
      const yPct = Math.round((pos.y - targetImg.y) / targetImg.height * 100)
      try {
        const { createAI } = await import('../../../lib/gemini')
        const ai = createAI()
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { inlineData: { data: base64, mimeType: 'image/jpeg' } },
              { text: `The user clicked at (${xPct}%, ${yPct}%) from top-left of this image.
Identify the object or region at that position and return its bounding box.
Respond ONLY with valid JSON, no markdown: {"x1":<0-100>,"y1":<0-100>,"x2":<0-100>,"y2":<0-100>}
Values are percentages of image dimensions. x1,y1 = top-left corner, x2,y2 = bottom-right corner.` },
            ],
          },
          config: { responseMimeType: 'application/json' },
        })
        const raw = (result.text ?? '').replace(/```json|```/g, '').trim()
        const { x1, y1, x2, y2 } = JSON.parse(raw)
        const toCanvas = (xp: number, yp: number) => ({
          x: targetImg.x + xp / 100 * targetImg.width,
          y: targetImg.y + yp / 100 * targetImg.height,
        })
        const points: Point[] = [
          toCanvas(x1, y1), toCanvas(x2, y1),
          toCanvas(x2, y2), toCanvas(x1, y2),
        ]
        setMagicSelection(points)
        setMagicSelectionImageId(targetImg.id)
        setSelectedIds([targetImg.id])
      } catch (err) {
        console.error('Gemini magic selection error:', err)
      } finally {
        setMagicLoading(false)
      }
    }
  }, [objectsRef, setSelectedIds])

  const clearSelection = useCallback(() => {
    setMagicSelection([])
    setMagicSelectionImageId(null)
  }, [])

  return {
    magicSelection, magicSelectionImageId, magicHoverImageId, magicLoading,
    magicSelectionRef, magicSelectionImageIdRef,
    onClick, onMouseMove, clearSelection,
    setMagicSelection, setMagicSelectionImageId,
  }
}
