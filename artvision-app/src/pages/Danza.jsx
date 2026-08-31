import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Danza.css'

const FONTS = 'Playfair+Display:ital,wght@0,600;0,700;1,500;1,600&family=IBM+Plex+Mono:wght@400;500;600'

const GROUPS = [
  { id: 'contemporaneo', label: 'Contemporáneo', items: [
    { id: 'd1', title: 'Cuerpo de Agua', artist: 'Lucía Wren', medium: 'video de estudio, 4 min', license: 'CC BY 4.0', source: 'ArtStation — sección movimiento', saved: '24 jun 2026', tags: ['fluidez', 'piso'], notes: '' },
    { id: 'd2', title: 'Estudio en Silencio', artist: 'Ramiro Case', medium: 'ensayo filmado', license: 'unknown', source: 'feed RSS — compañía independiente', saved: '11 feb 2026', tags: ['minimal', 'pausa'], notes: '' },
    { id: 'd3', title: 'Peso y Caída', artist: 'Ainhoa Ledesma', medium: 'improvisación', license: 'CC BY-NC', source: 'import manual', saved: '03 ago 2026', tags: ['contacto', 'improvisación'], notes: '' },
  ]},
  { id: 'folclorica', label: 'Folclórica', items: [
    { id: 'd4', title: 'Vals de las Grietas', artist: 'Compañía del Alto', medium: 'registro de función', license: 'dominio público', source: 'archivo cultural abierto', saved: '19 may 2026', tags: ['pareja', 'tradición'], notes: '' },
    { id: 'd5', title: 'Zapateo de Fin de Cosecha', artist: 'Grupo Raíz', medium: 'presentación en vivo', license: 'CC BY-SA', source: 'Behance', saved: '30 mar 2026', tags: ['percusión con pies'], notes: '' },
  ]},
  { id: 'escenica', label: 'Escénica', items: [
    { id: 'd6', title: 'La Sombra Camina', artist: 'Delia Frontera', medium: 'obra de danza-teatro', license: 'todos los derechos reservados', source: 'portafolio de compañía', saved: '07 ago 2026', tags: ['narrativo', 'máscara'], notes: '' },
  ]},
]

const POS = [
  { top: 8, left: 8 }, { top: 14, left: 38 }, { top: 6, left: 66 },
  { top: 44, left: 20 }, { top: 50, left: 52 }, { top: 40, left: 78 },
  { top: 74, left: 10 }, { top: 70, left: 42 }, { top: 66, left: 70 },
  { top: 30, left: 4 }, { top: 26, left: 88 },
]

export default function Danza() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${FONTS}&display=swap`
    document.head.appendChild(link)
    return () => document.head.removeChild(link)
  }, [])

  const { active, setActive, query, setQuery, visibleGroups, visibleCount, totalCount, countsByGroup } = useArchiveFilter(GROUPS)
  const [selected, setSelected] = useState(null)
  const [moodSaved, setMoodSaved] = useState(false)
  const open = !!selected
  function select(it) { setSelected(it); setMoodSaved(false) }

  let gi = 0
  return (
    <div className="page-danza">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← ArtVision</Link><span className="mark">Danza</span><span className="sub">— el escenario</span></div>
          <div className="search"><input type="text" placeholder="buscar pieza, coreógrafo, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} marcas en escena</div>
        </header>
        <aside className="sidebar">
          <h2>Repertorio</h2>
          <ShelfList groups={GROUPS} allLabel="Todo el repertorio" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Cada foco marca una referencia guardada, como en un plano de blocking.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>Plano de escenario</h1><p>Referencias de movimiento y coreografía, ubicadas como marcas de blocking.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          {visibleGroups.map((g) => (
            <div key={g.id}>
              <div className="grp-label">{g.label} · {g.items.length}</div>
              <div className="stage-wrap">
                <div className="curtain-side left" /><div className="curtain-side right" />
                <div className="stage-floor">
                  {g.items.map((it) => {
                    const p = POS[gi % POS.length]
                    const idx = gi
                    gi++
                    return (
                      <button key={it.id} className="mark-pos" style={{ '--i': idx, top: `${p.top}%`, left: `${p.left}%` }} aria-pressed={selected?.id === it.id} title={it.title} onClick={() => select(it)}>
                        <span className="spotlight"><span className="dancer" /></span>
                        <span className="cap"><b>{it.title}</b>{it.artist}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)}>
        {selected && (
          <article className="program">
            <button className="pg-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar">✕</button>
            <div className="catno">PROGRAMA · DAN-{(hashId(selected.id) % 900) + 100}</div>
            <h3>{selected.title}</h3>
            <p className="by">coreografía de {selected.artist}</p>
            <div className="divider" />
            <div className="prow"><span className="k">Formato</span><span className="v">{selected.medium}</span></div>
            <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
            <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
            <div className="prow"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
            <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
            <div className="noteblock">{selected.notes || 'Sin notas de programa todavía.'}</div>
            <div className="actions">
              <button className="btn-g" onClick={() => setMoodSaved(true)}>{moodSaved ? 'Añadido ✓' : 'Añadir al moodboard'}</button>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
