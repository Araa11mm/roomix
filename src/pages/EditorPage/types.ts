export type CanvasObject =
  | { id: string; type: 'image'; src: string; x: number; y: number; width: number; height: number }
  | { id: string; type: 'drawing'; d: string; color: string; strokeWidth: number; x: number; y: number; width: number; height: number; parentImageId?: string }
  | { id: string; type: 'placeholder'; x: number; y: number; width: number; height: number }
