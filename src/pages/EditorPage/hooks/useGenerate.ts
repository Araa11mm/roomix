import { useState, useCallback } from 'react'
import type React from 'react'
import type { CanvasObject } from '../types'
import type { Point, ClipBounds } from './editorTypes'

interface Deps {
  objectsRef: { current: CanvasObject[] }
  selectedIdsRef: { current: string[] }
  canvasRef: React.RefObject<HTMLElement | null>
  zoomRef: React.RefObject<number>
  offsetRef: React.RefObject<{ x: number; y: number }>
  lassoSelectionRef: { current: Point[] }
  lassoSelectionImageIdRef: { current: string | null }
  rectSelectionRef: { current: ClipBounds | null }
  rectSelectionImageIdRef: { current: string | null }
  magicSelectionRef: { current: Point[] }
  magicSelectionImageIdRef: { current: string | null }
  saveHistory: () => void
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  clearLasso: () => void
  clearRect: () => void
  clearMagic: () => void
}

export function useGenerate({
  objectsRef, selectedIdsRef,
  canvasRef, zoomRef, offsetRef,
  lassoSelectionRef, lassoSelectionImageIdRef,
  rectSelectionRef, rectSelectionImageIdRef,
  magicSelectionRef, magicSelectionImageIdRef,
  saveHistory, setObjects, setSelectedIds,
  clearLasso, clearRect, clearMagic,
}: Deps) {
  const [generating, setGenerating] = useState(false)

  const handlePromptSubmit = useCallback(async (prompt: string, furnitureFile?: File | null) => {
    const getCanvasCenter = (w: number, h: number) => {
      const el = canvasRef.current
      const zoom = zoomRef.current ?? 100
      const offset = offsetRef.current ?? { x: 0, y: 0 }
      if (!el) return { x: -w / 2, y: -h / 2 }
      return {
        x: (-offset.x + el.clientWidth / 2) / (zoom / 100) - w / 2,
        y: (-offset.y + el.clientHeight / 2) / (zoom / 100) - h / 2,
      }
    }
    const targetImg = objectsRef.current.find(
      o => o.type === 'image' && selectedIdsRef.current.includes(o.id)
    ) ?? objectsRef.current.slice().reverse().find(o => o.type === 'image')

    // ── Text-to-image: no photo on canvas ──────────────────────────────────
    if (!targetImg) {
      if (!prompt.trim()) return
      saveHistory()
      setGenerating(true)
      const placeholderId = crypto.randomUUID()
      const PW = 800, PH = 600
      const pos = getCanvasCenter(PW, PH)
      setObjects(prev => [...prev, { id: placeholderId, type: 'placeholder' as const, x: pos.x, y: pos.y, width: PW, height: PH }])
      try {
        const { createAI } = await import('../../../lib/gemini')
        const ai = createAI()
        const fullPrompt = `Generate a photorealistic interior design photo of a room. The scene must be an interior space (living room, bedroom, kitchen, bathroom, office, dining room or similar). ${prompt}. High quality professional interior photography.`
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        })
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData) {
            const { data, mimeType } = part.inlineData
            const blob = await fetch(`data:${mimeType};base64,${data}`).then(r => r.blob())
            const src = URL.createObjectURL(blob)
            const img = new Image()
            img.src = src
            await new Promise<void>(resolve => { img.onload = () => resolve() })
            const center = getCanvasCenter(img.naturalWidth, img.naturalHeight)
            setObjects(prev => prev.map(o => o.id === placeholderId
              ? { id: placeholderId, type: 'image' as const, src, x: center.x, y: center.y, width: img.naturalWidth, height: img.naturalHeight }
              : o
            ))
            setSelectedIds([placeholderId])
            break
          }
        }
      } catch (err) {
        console.error('Text-to-image error:', err)
        setObjects(prev => prev.filter(o => o.id !== placeholderId))
      } finally {
        setGenerating(false)
      }
      return
    }

    saveHistory()
    setGenerating(true)
    const placeholderId = crypto.randomUUID()
    const GAP = 24
    setObjects(prev => [...prev, {
      id: placeholderId,
      type: 'placeholder' as const,
      x: targetImg.x + targetImg.width + GAP,
      y: targetImg.y,
      width: targetImg.width,
      height: targetImg.height,
    }])

    const offscreen = document.createElement('canvas')
    const htmlImg = new Image()
    htmlImg.src = (targetImg as { src: string }).src
    htmlImg.onerror = () => {
      setObjects(prev => prev.filter(o => o.id !== placeholderId))
      setGenerating(false)
    }
    htmlImg.onload = async () => {
      const naturalW = htmlImg.naturalWidth
      const naturalH = htmlImg.naturalHeight
      offscreen.width = naturalW
      offscreen.height = naturalH
      const ctx = offscreen.getContext('2d')!
      ctx.drawImage(htmlImg, 0, 0)
      const base64 = offscreen.toDataURL('image/jpeg', 0.9).split(',')[1]

      const hasLasso = lassoSelectionImageIdRef.current === targetImg.id && lassoSelectionRef.current.length >= 3
      const hasMagic = magicSelectionImageIdRef.current === targetImg.id && magicSelectionRef.current.length >= 3
      const hasRect = rectSelectionImageIdRef.current === targetImg.id && rectSelectionRef.current !== null
      const drawings = objectsRef.current.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        o => o.type === 'drawing' && (o as any).parentImageId === targetImg.id
      )
      const hasMask = hasLasso || hasMagic || hasRect || drawings.length > 0

      let maskBase64: string | null = null
      if (hasMask) {
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = naturalW
        maskCanvas.height = naturalH
        const mctx = maskCanvas.getContext('2d')!
        mctx.fillStyle = 'black'
        mctx.fillRect(0, 0, naturalW, naturalH)
        mctx.fillStyle = 'white'
        mctx.strokeStyle = 'white'

        const toImgPx = (cx: number, cy: number) => ({
          x: (cx - targetImg.x) / targetImg.width * naturalW,
          y: (cy - targetImg.y) / targetImg.height * naturalH,
        })

        if (hasLasso) {
          mctx.beginPath()
          lassoSelectionRef.current.forEach((p, i) => {
            const { x, y } = toImgPx(p.x, p.y)
            if (i === 0) mctx.moveTo(x, y); else mctx.lineTo(x, y)
          })
          mctx.closePath()
          mctx.fill()
        }

        if (hasMagic) {
          mctx.beginPath()
          magicSelectionRef.current.forEach((p, i) => {
            const { x, y } = toImgPx(p.x, p.y)
            if (i === 0) mctx.moveTo(x, y); else mctx.lineTo(x, y)
          })
          mctx.closePath()
          mctx.fill()
        }

        if (hasRect) {
          const r = rectSelectionRef.current!
          const { x: px, y: py } = toImgPx(r.x, r.y)
          const pw = r.width / targetImg.width * naturalW
          const ph = r.height / targetImg.height * naturalH
          mctx.fillRect(px, py, pw, ph)
        }

        if (drawings.length > 0) {
          const scaleX = naturalW / targetImg.width
          const scaleY = naturalH / targetImg.height
          for (const d of drawings) {
            mctx.save()
            mctx.translate((d.x - targetImg.x) * scaleX, (d.y - targetImg.y) * scaleY)
            mctx.scale(scaleX, scaleY)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const path = new Path2D((d as any).d)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mctx.lineWidth = (d as any).strokeWidth
            mctx.lineCap = 'round'
            mctx.lineJoin = 'round'
            mctx.stroke(path)
            mctx.restore()
          }
        }

        maskBase64 = maskCanvas.toDataURL('image/png').split(',')[1]
      }

      try {
        const { createAI } = await import('../../../lib/gemini')
        const ai = createAI()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [{ inlineData: { data: base64, mimeType: 'image/jpeg' } }]

        if (furnitureFile) {
          const furnitureBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve((reader.result as string).split(',')[1])
            reader.onerror = reject
            reader.readAsDataURL(furnitureFile)
          })
          const furnitureMime = furnitureFile.type || 'image/jpeg'
          parts.push({ inlineData: { data: furnitureBase64, mimeType: furnitureMime } })
          if (maskBase64) {
            parts.push({ inlineData: { data: maskBase64, mimeType: 'image/png' } })
            parts.push({ text: `I provided three images:
1. The original interior room photo.
2. The furniture item the user wants to place in the room.
3. A mask where the WHITE area marks the exact zone where the furniture should be placed.

Place the furniture item from image 2 into the WHITE area of image 1. Make it look realistic: match the lighting, perspective, shadows and scale of the room. ${prompt ? `Additional instructions: ${prompt}` : ''}
Return only the final room image.` })
          } else {
            parts.push({ text: `I provided two images:
1. The original interior room photo.
2. A furniture item the user wants to see in their room.

Place the furniture item from image 2 into the room in image 1 in the most natural and suitable location. Make it look realistic: match the lighting, perspective, shadows and scale. ${prompt ? `Additional instructions: ${prompt}` : ''}
Return only the final room image.` })
          }
        } else if (maskBase64) {
          parts.push({ inlineData: { data: maskBase64, mimeType: 'image/png' } })
          parts.push({ text: `This is an interior image editing (inpainting) task. I provided two images:
1. The original interior photo.
2. A mask (black and white) where the WHITE area indicates the zone to be changed.

Change ONLY the white area according to: "${prompt}".
The rest of the image must remain completely unchanged.
Return only the result image.` })
        } else {
          parts.push({ text: `Restyle this interior room image based on: "${prompt}". Preserve the exact same layout, composition, furniture positions and room structure. Only change visual style, colors, materials and textures. Return only the result image.` })
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
        })
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData) {
            const { data, mimeType } = part.inlineData
            const blob = await fetch(`data:${mimeType};base64,${data}`).then(r => r.blob())
            const newSrc = URL.createObjectURL(blob)
            setObjects(prev => prev
              .filter(o => !(o.type === 'drawing' && o.parentImageId === targetImg.id))
              .map(o => o.id === placeholderId
                ? { id: placeholderId, type: 'image' as const, src: newSrc, x: o.x, y: o.y, width: o.width, height: o.height }
                : o
              )
            )
            setSelectedIds([placeholderId])
            clearLasso()
            clearRect()
            clearMagic()
            break
          }
        }
      } catch (err) {
        console.error('Gemini image generation error:', err)
        setObjects(prev => prev.filter(o => o.id !== placeholderId))
      } finally {
        setGenerating(false)
      }
    }
  }, [
    objectsRef, selectedIdsRef,
    canvasRef, zoomRef, offsetRef,
    lassoSelectionRef, lassoSelectionImageIdRef,
    rectSelectionRef, rectSelectionImageIdRef,
    magicSelectionRef, magicSelectionImageIdRef,
    saveHistory, setObjects, setSelectedIds,
    clearLasso, clearRect, clearMagic,
  ])

  return { generating, handlePromptSubmit }
}
