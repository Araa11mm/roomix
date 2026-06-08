import { useRef, useState, useCallback } from 'react'
import type { Snapshot } from './editorTypes'

export function useHistory(
  getSnapshot: () => Snapshot,
  applySnapshot: (s: Snapshot) => void,
) {
  const historyRef = useRef<Snapshot[]>([])
  const futureRef = useRef<Snapshot[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const saveHistory = useCallback(() => {
    historyRef.current = [...historyRef.current, getSnapshot()]
    futureRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [getSnapshot])

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return
    const prev = historyRef.current[historyRef.current.length - 1]
    historyRef.current = historyRef.current.slice(0, -1)
    futureRef.current = [getSnapshot(), ...futureRef.current]
    applySnapshot(prev)
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(true)
  }, [getSnapshot, applySnapshot])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current[0]
    futureRef.current = futureRef.current.slice(1)
    historyRef.current = [...historyRef.current, getSnapshot()]
    applySnapshot(next)
    setCanUndo(true)
    setCanRedo(futureRef.current.length > 0)
  }, [getSnapshot, applySnapshot])

  return { saveHistory, undo, redo, canUndo, canRedo }
}
