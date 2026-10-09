import { useEffect, useRef } from 'react'

/**
 * Mecánica de apertura/cierre compartida por todas las páginas: maneja
 * el scrim, la clase "open", el foco al abrir y la tecla Escape.
 * El contenido visual de la ficha (catálogo / cartela / gatefold / etc.)
 * lo define cada página — este componente no sabe nada de eso.
 */
export default function DetailDrawer({ open, onClose, className = '', children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (open && panelRef.current) {
      const focusable = panelRef.current.querySelector('[data-autofocus]')
      focusable?.focus()
    }
  }, [open])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <div className={`drawer ${className} ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div ref={panelRef} style={{ width: '100%' }}>
          {open && children}
        </div>
      </div>
    </>
  )
}
