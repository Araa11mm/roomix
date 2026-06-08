import { useState, useCallback, useLayoutEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import EditorHeader from './EditorHeader/EditorHeader'
import EditorToolbar from './EditorToolbar/EditorToolbar'
import EditorPromptBar from './EditorPromptBar/EditorPromptBar'
import StylesPanel, { type StyleOption } from './StylesPanel/StylesPanel'
import CanvasObject from './CanvasObject/CanvasObject'
import styles from './EditorPage.module.scss'
import type { CanvasObject as TCanvasObject } from './types'
import type { Snapshot, SelectionRect } from './hooks/editorTypes'
import { useHistory } from './hooks/useHistory'
import { useZoomPan } from './hooks/useZoomPan'
import { useLassoTool } from './hooks/useLassoTool'
import { useBrushTool } from './hooks/useBrushTool'
import { useRectTool } from './hooks/useRectTool'
import { useMagicTool } from './hooks/useMagicTool'
import { useGenerate } from './hooks/useGenerate'
import { useProjectSync } from './hooks/useProjectSync'
import EditorLoader from './EditorLoader/EditorLoader'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCanvasInteractions } from './hooks/useCanvasInteractions'
import { useCanvasOverlays } from './hooks/useCanvasOverlays'

function EditorPage() {
  const { id: projectId = '' } = useParams<{ id: string }>()

  const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'lasso' | 'brush' | 'rect' | 'magic'>('select')
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null)
  const [stylesOpen, setStylesOpen] = useState(false)
  const [exportCandidates, setExportCandidates] = useState<{ id: string; src: string }[]>([])
  const [projectName, setProjectName] = useState('Новый проект')
  const [objects, setObjects] = useState<TCanvasObject[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)

  const canvasRef = useRef<HTMLElement>(null)
  const objectsRef = useRef(objects)
  const selectedIdsRef = useRef(selectedIds)
  const activeToolRef = useRef(activeTool)
  const selectionRectRef = useRef(selectionRect)

  // ── Zoom & Pan ────────────────────────────────────────────────────────────
  const {
    zoom, offset, spaceDown, grabbing,
    zoomRef, offsetRef, spaceDownRef,
    handleZoomIn, handleZoomOut,
    startPan, onPanMouseMove, onPanMouseUp,
  } = useZoomPan(canvasRef)

  // ── saveHistory via ref (breaks circular dependency) ──────────────────────
  const saveHistoryRef = useRef<() => void>(() => {})
  const saveHistoryCb = useCallback(() => saveHistoryRef.current(), [])

  // ── Tools ─────────────────────────────────────────────────────────────────
  const lasso = useLassoTool({ objectsRef, saveHistory: saveHistoryCb, setSelectedIds })
  const brush = useBrushTool({ objectsRef, saveHistory: saveHistoryCb, setObjects, setSelectedIds })
  const rect = useRectTool({ objectsRef, saveHistory: saveHistoryCb, setSelectedIds })
  const magic = useMagicTool({ objectsRef, setSelectedIds })

  // ── History ───────────────────────────────────────────────────────────────
  const getSnapshotFnRef = useRef<() => Snapshot>(() => ({
    objects: [], lassoSelection: [], lassoClipBounds: null, lassoSelectionImageId: null,
    rectSelection: null, rectSelectionImageId: null, magicSelection: [], magicSelectionImageId: null,
  }))
  const applySnapshotFnRef = useRef<(s: Snapshot) => void>(() => {})

  const getSnapshot = useCallback(() => getSnapshotFnRef.current(), [])
  const applySnapshot = useCallback((s: Snapshot) => applySnapshotFnRef.current(s), [])
  const { saveHistory, undo, redo, canUndo, canRedo } = useHistory(getSnapshot, applySnapshot)

  // ── Generation ────────────────────────────────────────────────────────────
  const { generating, handlePromptSubmit } = useGenerate({
    objectsRef, selectedIdsRef,
    lassoSelectionRef: lasso.lassoSelectionRef,
    lassoSelectionImageIdRef: lasso.lassoSelectionImageIdRef,
    rectSelectionRef: rect.rectSelectionRef,
    rectSelectionImageIdRef: rect.rectSelectionImageIdRef,
    magicSelectionRef: magic.magicSelectionRef,
    magicSelectionImageIdRef: magic.magicSelectionImageIdRef,
    saveHistory, setObjects, setSelectedIds,
    clearLasso: lasso.clearSelection,
    clearRect: rect.clearSelection,
    clearMagic: magic.clearSelection,
  })

  // ── Upload & Download ─────────────────────────────────────────────────────
  const handleUpload = useCallback((file: File) => {
    saveHistory()
    const src = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const el = canvasRef.current?.getBoundingClientRect()
      const maxW = el ? el.width * 0.75 : 500
      const maxH = el ? el.height * 0.75 : 400
      const scale = Math.min(img.width > maxW ? maxW / img.width : 1, img.height > maxH ? maxH / img.height : 1)
      const w = img.width * scale
      const h = img.height * scale
      const { x: ox, y: oy } = offsetRef.current
      const z = zoomRef.current / 100
      const cx = el ? (el.width / 2 - ox) / z : 300
      const cy = el ? (el.height / 2 - oy) / z : 200
      setObjects(prev => [...prev, { id: crypto.randomUUID(), type: 'image', src, x: cx - w / 2, y: cy - h / 2, width: w, height: h }])
    }
    img.src = src
  }, [saveHistory, offsetRef, zoomRef])

  const shareImage = useCallback(async (src: string) => {
    setExportCandidates([])
    const filename = `roomix-${Date.now()}.png`
    if (navigator.share) {
      try {
        const res = await fetch(src)
        const blob = await res.blob()
        const file = new File([blob], filename, { type: blob.type || 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Roomix' })
          return
        }
      } catch {
        // share cancelled or unavailable — fall through to download
      }
    }
    const a = document.createElement('a')
    a.href = src
    a.download = filename
    a.click()
  }, [])

  const handleDownload = useCallback(async () => {
    const isMobile = window.innerWidth <= 768
    const images = objectsRef.current.filter(o => o.type === 'image') as TCanvasObject[]
    if (!images.length) return

    if (isMobile) {
      if (images.length === 1) {
        shareImage((images[0] as unknown as { src: string }).src)
      } else {
        setExportCandidates(images.map(o => ({ id: o.id, src: (o as unknown as { src: string }).src })))
      }
    } else {
      const img = images.find(o => selectedIdsRef.current.includes(o.id)) as unknown as { src: string } | undefined
      if (!img) return
      const a = document.createElement('a')
      a.href = img.src
      a.download = `roomix-${Date.now()}.png`
      a.click()
    }
  }, [shareImage])

  // ── Project sync (load & auto-save) ──────────────────────────────────────
  const { isLoaded } = useProjectSync({ projectId, objects, projectName, setObjects, setProjectName })

  // ── Sync refs every render ────────────────────────────────────────────────
  useLayoutEffect(() => {
    objectsRef.current = objects
    selectedIdsRef.current = selectedIds
    activeToolRef.current = activeTool
    selectionRectRef.current = selectionRect
    saveHistoryRef.current = saveHistory
    getSnapshotFnRef.current = () => ({
      objects: objectsRef.current,
      lassoSelection: lasso.lassoSelectionRef.current,
      lassoClipBounds: lasso.lassoClipBoundsRef.current,
      lassoSelectionImageId: lasso.lassoSelectionImageIdRef.current,
      rectSelection: rect.rectSelectionRef.current,
      rectSelectionImageId: rect.rectSelectionImageIdRef.current,
      magicSelection: magic.magicSelectionRef.current,
      magicSelectionImageId: magic.magicSelectionImageIdRef.current,
    })
    applySnapshotFnRef.current = (s: Snapshot) => {
      setObjects(s.objects)
      lasso.setLassoSelection(s.lassoSelection)
      lasso.setLassoClipBounds(s.lassoClipBounds)
      lasso.setLassoSelectionImageId(s.lassoSelectionImageId)
      rect.setRectSelection(s.rectSelection)
      rect.setRectSelectionImageId(s.rectSelectionImageId)
      magic.setMagicSelection(s.magicSelection)
      magic.setMagicSelectionImageId(s.magicSelectionImageId)
    }
  })

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    undo, redo, saveHistory,
    selectedIdsRef,
    setActiveTool, setSelectedIds, setObjects,
    clearLasso: lasso.clearSelection,
    clearRect: rect.clearSelection,
    clearMagic: magic.clearSelection,
  })

  // ── Mouse interactions ────────────────────────────────────────────────────
  const { handleCanvasMouseDown, handleObjectMouseDown, handleResizeStart, handleMouseMove, handleMouseUp } =
    useCanvasInteractions({
      canvasRef, objectsRef, selectedIdsRef, activeToolRef, selectionRectRef,
      zoomRef, offsetRef, spaceDownRef,
      startPan, onPanMouseMove, onPanMouseUp,
      lasso, brush, rect, magic,
      saveHistory, setObjects, setSelectedIds, setSelectionRect,
    })

  // ── Computed screen values ────────────────────────────────────────────────
  const ov = useCanvasOverlays({
    zoom, offset, activeTool, objects, selectedIds, selectionRect,
    lasso, brush, rect, magic,
  })

  const getCursor = () => {
    if (magic.magicLoading) return 'wait'
    if (grabbing) return 'grabbing'
    if (spaceDown || activeTool === 'hand') return 'grab'
    if (activeTool === 'select') return 'default'
    return 'crosshair'
  }

  const dotSize = 24 * zoom / 100

  return (
    <div className={styles.layout}>
      <EditorLoader visible={!isLoaded} />

      {exportCandidates.length > 0 && (
        <div className={styles.exportOverlay} onClick={() => setExportCandidates([])}>
          <div className={styles.exportPicker} onClick={e => e.stopPropagation()}>
            <p className={styles.exportPickerTitle}>Выберите изображение</p>
            <div className={styles.exportPickerList}>
              {exportCandidates.map((img, i) => (
                <button
                  key={img.id}
                  className={styles.exportPickerItem}
                  onClick={() => shareImage(img.src)}
                >
                  <img src={img.src} alt={`Вариант ${i + 1}`} />
                  <span>Вариант {i + 1}</span>
                </button>
              ))}
            </div>
            <button className={styles.exportPickerCancel} onClick={() => setExportCandidates([])}>
              Отмена
            </button>
          </div>
        </div>
      )}
      <EditorHeader
        projectId={projectId}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onExport={handleDownload}
      />

      <div className={styles.body}>
        <main
          ref={canvasRef}
          className={styles.canvas}
          style={{
            backgroundSize: `${dotSize}px ${dotSize}px`,
            backgroundPosition: `${offset.x % dotSize}px ${offset.y % dotSize}px`,
            cursor: getCursor(),
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <EditorToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />

          <div
            className={styles.canvasStage}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom / 100})` }}
          >
            {objects.map(obj => (
              <CanvasObject
                key={obj.id}
                obj={obj}
                selected={ov.activeSelectedIds.includes(obj.id)}
                brushTarget={obj.id === ov.brushTargetId || obj.id === ov.lassoTargetId || obj.id === ov.rectTargetId || obj.id === ov.magicTargetId}
                onMouseDown={e => handleObjectMouseDown(e, obj)}
                onResizeStart={(corner, e) => handleResizeStart(corner, e, obj)}
              />
            ))}
          </div>

          {ov.screenRect && ov.screenRect.width > 4 && ov.screenRect.height > 4 && (
            <div className={styles.marquee} style={ov.screenRect} />
          )}

          {ov.lassoScreenPoints && (
            <svg className={styles.lassoOverlay}>
              {ov.lassoImageClipScreen && (
                <defs><clipPath id="lasso-draw-clip"><rect x={ov.lassoImageClipScreen.x} y={ov.lassoImageClipScreen.y} width={ov.lassoImageClipScreen.width} height={ov.lassoImageClipScreen.height} /></clipPath></defs>
              )}
              <path d={ov.lassoScreenPoints} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeDasharray="8 4" strokeLinejoin="round" strokeLinecap="round" clipPath={ov.lassoImageClipScreen ? 'url(#lasso-draw-clip)' : undefined} />
              <path d={ov.lassoScreenPoints} fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="8 4" strokeDashoffset="8" strokeLinejoin="round" strokeLinecap="round" className={styles.marchingAnts} clipPath={ov.lassoImageClipScreen ? 'url(#lasso-draw-clip)' : undefined} />
            </svg>
          )}

          {ov.lassoSelectionScreenPath && ov.lassoClipScreen && (
            <svg className={styles.lassoOverlay}>
              <defs><clipPath id="lasso-clip"><rect x={ov.lassoClipScreen.x} y={ov.lassoClipScreen.y} width={ov.lassoClipScreen.width} height={ov.lassoClipScreen.height} /></clipPath></defs>
              <path d={ov.lassoSelectionScreenPath} fill="rgba(0, 200, 255, 0.2)" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeDasharray="8 4" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#lasso-clip)" />
              <path d={ov.lassoSelectionScreenPath} fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="8 4" strokeDashoffset="8" strokeLinejoin="round" strokeLinecap="round" className={styles.marchingAnts} clipPath="url(#lasso-clip)" />
            </svg>
          )}

          {activeTool === 'brush' && (
            <div className={styles.brushSizePanel}>
              <button onClick={() => brush.setBrushSize(s => Math.max(5, s - 5))}>−</button>
              <span className={styles.brushSizeLabel}>{brush.brushSize}px</span>
              <input type="range" min="5" max="150" step="5" value={brush.brushSize} onChange={e => brush.setBrushSize(Number(e.target.value))} />
              <button onClick={() => brush.setBrushSize(s => Math.min(150, s + 5))}>+</button>
            </div>
          )}

          {ov.brushScreenPath && (
            <svg className={styles.lassoOverlay}>
              {ov.brushClipScreen && (
                <defs><clipPath id="brush-clip"><rect x={ov.brushClipScreen.x} y={ov.brushClipScreen.y} width={ov.brushClipScreen.width} height={ov.brushClipScreen.height} /></clipPath></defs>
              )}
              <path d={ov.brushScreenPath} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={brush.brushSize * ov.z100 + 2} strokeLinecap="round" strokeLinejoin="round" clipPath={ov.brushClipScreen ? 'url(#brush-clip)' : undefined} />
              <path d={ov.brushScreenPath} fill="none" stroke={brush.brushColor} strokeWidth={brush.brushSize * ov.z100} strokeLinecap="round" strokeLinejoin="round" clipPath={ov.brushClipScreen ? 'url(#brush-clip)' : undefined} />
            </svg>
          )}

          {ov.rectScreenPreview && ov.rectImageClipScreen && (
            <svg className={styles.lassoOverlay}>
              <defs><clipPath id="rect-draw-clip"><rect x={ov.rectImageClipScreen.x} y={ov.rectImageClipScreen.y} width={ov.rectImageClipScreen.width} height={ov.rectImageClipScreen.height} /></clipPath></defs>
              <rect x={ov.rectScreenPreview.x} y={ov.rectScreenPreview.y} width={ov.rectScreenPreview.width} height={ov.rectScreenPreview.height} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeDasharray="8 4" clipPath="url(#rect-draw-clip)" />
              <rect x={ov.rectScreenPreview.x} y={ov.rectScreenPreview.y} width={ov.rectScreenPreview.width} height={ov.rectScreenPreview.height} fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="8 4" strokeDashoffset="8" className={styles.marchingAnts} clipPath="url(#rect-draw-clip)" />
            </svg>
          )}

          {ov.rectSelectionScreen && ov.rectImageClipScreen && !ov.rectScreenPreview && (
            <svg className={styles.lassoOverlay}>
              <defs><clipPath id="rect-sel-clip"><rect x={ov.rectImageClipScreen.x} y={ov.rectImageClipScreen.y} width={ov.rectImageClipScreen.width} height={ov.rectImageClipScreen.height} /></clipPath></defs>
              <rect x={ov.rectSelectionScreen.x} y={ov.rectSelectionScreen.y} width={ov.rectSelectionScreen.width} height={ov.rectSelectionScreen.height} fill="rgba(0, 200, 255, 0.2)" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeDasharray="8 4" clipPath="url(#rect-sel-clip)" />
              <rect x={ov.rectSelectionScreen.x} y={ov.rectSelectionScreen.y} width={ov.rectSelectionScreen.width} height={ov.rectSelectionScreen.height} fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="8 4" strokeDashoffset="8" className={styles.marchingAnts} clipPath="url(#rect-sel-clip)" />
            </svg>
          )}

          {ov.magicSelectionScreenPath && ov.magicImageClipScreen && (
            <svg className={styles.lassoOverlay}>
              <defs><clipPath id="magic-clip"><rect x={ov.magicImageClipScreen.x} y={ov.magicImageClipScreen.y} width={ov.magicImageClipScreen.width} height={ov.magicImageClipScreen.height} /></clipPath></defs>
              <path d={ov.magicSelectionScreenPath} fill="rgba(0, 200, 255, 0.2)" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeDasharray="8 4" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#magic-clip)" />
              <path d={ov.magicSelectionScreenPath} fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="8 4" strokeDashoffset="8" strokeLinejoin="round" strokeLinecap="round" className={styles.marchingAnts} clipPath="url(#magic-clip)" />
            </svg>
          )}

          <StylesPanel
            selected={selectedStyle?.label ?? null}
            onSelect={style => { setSelectedStyle(style); setStylesOpen(false) }}
            mobileOpen={stylesOpen}
          />
          <EditorPromptBar
            onUpload={handleUpload}
            onSubmit={handlePromptSubmit}
            generating={generating}
            selectedStyle={selectedStyle?.label ?? null}
            selectedStylePrompt={selectedStyle?.prompt ?? null}
            onStyleRemove={() => setSelectedStyle(null)}
            stylesOpen={stylesOpen}
            onStylesToggle={() => setStylesOpen(o => !o)}
          />
        </main>
      </div>
    </div>
  )
}

export default EditorPage
