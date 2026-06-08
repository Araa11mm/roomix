import { useEffect } from 'react'
import type { CanvasObject } from '../types'
import type { Tool } from './editorTypes'

interface Deps {
  undo: () => void
  redo: () => void
  saveHistory: () => void
  selectedIdsRef: { current: string[] }
  setActiveTool: (tool: Tool) => void
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  setObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>
  clearLasso: () => void
  clearRect: () => void
  clearMagic: () => void
}

export function useKeyboardShortcuts({
  undo, redo, saveHistory,
  selectedIdsRef,
  setActiveTool, setSelectedIds, setObjects,
  clearLasso, clearRect, clearMagic,
}: Deps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') setSelectedIds([])
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.code === 'KeyV') setActiveTool('select')
        if (e.code === 'KeyL') setActiveTool('lasso')
        if (e.code === 'KeyB') setActiveTool('brush')
        if (e.code === 'KeyM') setActiveTool('rect')
        if (e.code === 'KeyW') setActiveTool('magic')
      }
      if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.code === 'KeyY' && (e.ctrlKey || e.metaKey)) ||
          (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo() }
    }
    const onDelete = (e: KeyboardEvent) => {
      if (e.code !== 'Backspace' && e.code !== 'Delete') return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      saveHistory()
      setObjects(prev => prev.filter(o => !selectedIdsRef.current.includes(o.id)))
      setSelectedIds([])
      clearLasso()
      clearRect()
      clearMagic()
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keydown', onDelete)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keydown', onDelete)
    }
  }, [undo, redo, saveHistory, selectedIdsRef, setActiveTool, setSelectedIds, setObjects, clearLasso, clearRect, clearMagic])
}
