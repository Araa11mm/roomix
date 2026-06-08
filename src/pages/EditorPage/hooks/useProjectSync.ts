import { useEffect, useRef, useCallback, useState } from 'react'
import { supabase } from '../../../supabaseClient'
import type { CanvasObject } from '../types'

const DEBOUNCE_MS = 2000

async function blobToBase64(url: string): Promise<string> {
  if (!url.startsWith('blob:')) return url
  const blob = await fetch(url).then(r => r.blob())
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

async function serializeObjects(objects: CanvasObject[]): Promise<CanvasObject[]> {
  return Promise.all(objects.map(async o => {
    if (o.type === 'image') {
      const src = await blobToBase64((o as { src: string }).src)
      return { ...o, src }
    }
    return o
  }))
}

function generateThumbnail(objects: CanvasObject[]): string | null {
  const img = objects.find(o => o.type === 'image') as { src: string } | undefined
  if (!img) return null
  const canvas = document.createElement('canvas')
  const size = 400
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const el = new Image()
  el.src = img.src
  if (!el.complete) return img.src
  const scale = Math.min(size / el.naturalWidth, size / el.naturalHeight)
  const w = el.naturalWidth * scale
  const h = el.naturalHeight * scale
  ctx.drawImage(el, (size - w) / 2, (size - h) / 2, w, h)
  return canvas.toDataURL('image/jpeg', 0.7)
}

interface Deps {
  projectId: string
  objects: CanvasObject[]
  projectName: string
  setObjects: (objs: CanvasObject[]) => void
  setProjectName: (name: string) => void
}

export function useProjectSync({ projectId, objects, projectName, setObjects, setProjectName }: Deps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSaving = useRef(false)
  const isLoadedRef = useRef(false)
  const prevNameRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load project on mount
  useEffect(() => {
    supabase
      .from('projects')
      .select('name, objects')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setProjectName(data.name)
        if (Array.isArray(data.objects) && data.objects.length > 0)
          setObjects(data.objects as CanvasObject[])
        prevNameRef.current = data.name
        isLoadedRef.current = true
        setIsLoaded(true)
      })
  }, [projectId, setObjects, setProjectName])

  // Save name immediately on change (no debounce) so navigating away never loses the rename
  useEffect(() => {
    if (!isLoadedRef.current) return
    if (projectName === prevNameRef.current) return
    prevNameRef.current = projectName
    supabase.from('projects').update({ name: projectName }).eq('id', projectId)
  }, [projectName, projectId])

  const save = useCallback(async (objs: CanvasObject[], name: string) => {
    if (isSaving.current) return
    isSaving.current = true
    try {
      const serialized = await serializeObjects(objs)
      const thumbnail = generateThumbnail(serialized)
      await supabase
        .from('projects')
        .update({ objects: serialized, name, thumbnail, updated_at: new Date().toISOString() })
        .eq('id', projectId)
    } finally {
      isSaving.current = false
    }
  }, [projectId])

  // Auto-save with debounce
  useEffect(() => {
    if (!isLoadedRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(objects, projectName), DEBOUNCE_MS)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [objects, projectName, save])

  return { isLoaded }
}
