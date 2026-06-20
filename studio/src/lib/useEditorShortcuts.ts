import { useEffect } from 'react'
import { useStore } from '../store'

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/** Global editor keyboard shortcuts. Ignored while typing in form fields. */
export function useEditorShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return // let the browser handle text editing/undo
      const s = useStore.getState()
      const meta = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()

      if (meta && k === 'z') {
        e.preventDefault()
        e.shiftKey ? s.redo() : s.undo()
      } else if (meta && k === 'y') {
        e.preventDefault()
        s.redo()
      } else if (meta && k === 'a') {
        e.preventDefault()
        s.selectAll()
      } else if (meta && k === 'c') {
        s.copySelection()
      } else if (meta && k === 'v') {
        e.preventDefault()
        s.paste()
      } else if (meta && k === 'd') {
        e.preventDefault()
        s.duplicateSelection()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        s.deleteSelection()
      } else if (e.key === 'Escape') {
        s.clearSelection()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
