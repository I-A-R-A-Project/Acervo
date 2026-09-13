import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Pintura.css'

const FONTS = 'Cormorant:ital,wght@0,500;0,600;0,700;1,500&family=IBM+Plex+Mono:wght@400;500;600'
const PALETTES = [['#8A5E3C','#C79A5B','#3A2A1C'],['#2F6E62','#6FA89B','#173B34'],['#6E2A35','#B0596A','#3A1218'],['#4A5B7A','#8FA3C4','#20293A'],['#7A6A2A','#C4AE5B','#3A3013']]
const SPANS = ['s-a','s-b','s-c','s-d','s-e','s-f']

function brushSvg(id) {
  const p = PALETTES[hashId(id) % PALETTES.length]
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
    <rect width="100" height="100" fill="${p[2]}"/>
    <path d="M0 70 Q30 40 55 65 T100 55 L100 100 L0 100 Z" fill="${p[0]}" opacity="0.9"/>
    <path d="M0 40 Q40 10 70 35 T100 20 L100 60 Q60 45 30 60 T0 55 Z" fill="${p[1]}" opacity="0.8"/>
  </svg>`
}

const GROUPS = [
  { id: 'retrato', label: 'Retrato', items: [
    { id: 'p1', title: 'Retrato en Ocre', artist: 'Valeria Nuin', medium: 'óleo sobre lienzo', license: 'CC BY 4.0', source: 'ArtStation — pintura', saved: '16 jun 2026', tags: ['expresivo', 'paleta cálida'], notes: '' },
    { id: 'p2', title: 'Rostro Bajo Lluvia', artist: 'Ezequiel Ross', medium: 'acrílico', license: 'unknown', source: 'feed RSS — bitácora de estudio', saved: '02 feb 2026', tags: ['húmedo', 'difuminado'], notes: '' },
    { id: 'p3', title: 'La Tejedora', artist: 'Constanza Pilay', medium: 'óleo', license: 'dominio público', source: 'Wikimedia Commons', saved: '11 ago 2025', tags: ['oficio', 'luz de ventana'], notes: '' },
  ]},
  { id: 'paisaje', label: 'Paisaje', items: [
    { id: 'p4', title: 'Marea Interior', artist: 'Ignacio Sued', medium: 'óleo sobre tabla', license: 'CC BY-SA', source: 'Behance', saved: '25 jul 2026', tags: ['costa', 'nocturno'], notes: '' },
    { id: 'p5', title: 'Campo Después de la Tormenta', artist: 'Rocío Balza', medium: 'acuarela', license: 'CC BY-NC', source: 'import manual', saved: '19 mar 2026', tags: ['cielo', 'húmedo'], notes: '' },
    { id: 'p6', title: 'Cerros al Amanecer', artist: 'Franco Guiñazú', medium: 'óleo', license: 'todos los derechos reservados', source: 'portafolio curado', saved: '04 may 2026', tags: ['gradiente', 'minimal'], notes: '' },
  ]},
  { id: 'abstracto', label: 'Abstracto', items: [
    { id: 'p7', title: 'Naturaleza Muerta III', artist: 'Bianca Roldán', medium: 'técnica mixta', license: 'unknown', source: 'DeviantArt — pintura', saved: '30 abr 2026', tags: ['geométrico', 'collage'], notes: 'Falta confirmar licencia.' },
    { id: 'p8', title: 'Campo de Señales', artist: 'Martín Ocariz', medium: 'acrílico sobre lienzo', license: 'CC BY 4.0', source: 'museo digital — archivo abierto', saved: '21 ago 2026', tags: ['color puro'], notes: '' },
  ]},
]

export default function Pintura() {
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

  return (
    <div className="page-pintura">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← Salas de Arte</Link><span className="mark">Pintura</span><span className="sub">— el salón</span></div>
          <div className="search"><input type="text" placeholder="buscar obra, autor, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} obras colgadas</div>
        </header>
        <aside className="sidebar">
          <h2>Muros</h2>
          <ShelfList groups={GROUPS} allLabel="Todos los muros" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Los cuadros se cuelgan como en un salón real. Click para ver la <b>cartela</b>.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>El salón de pintura</h1><p>Cuadros guardados de fuentes abiertas y portafolios.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          {visibleGroups.map((g, gi) => (
            <div key={g.id}>
              <div className="grp-label">{g.label} · {g.items.length}</div>
              <div className="wall">
                {g.items.map((it, i) => {
                  const span = SPANS[hashId(it.id) % SPANS.length]
                  return (
                    <button key={it.id} className={`frame ${span}`} style={{ '--i': gi * 3 + i }} aria-pressed={selected?.id === it.id} title={it.title} onClick={() => select(it)}>
                      <div className="canvas" dangerouslySetInnerHTML={{ __html: brushSvg(it.id) + `<span class="cap">${it.title}</span>` }} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)}>
        {selected && (
          <article className="plaque">
            <button className="pq-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar">✕</button>
            <div className="catno">CAT. PINT-{(hashId(selected.id) % 900) + 100}</div>
            <h3>{selected.title}</h3>
            <p className="by">por {selected.artist}</p>
            <div className="prow"><span className="k">Técnica</span><span className="v">{selected.medium}</span></div>
            <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
            <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
            <div className="prow"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
            <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
            <div className="didactic">{selected.notes || 'Sin notas todavía.'}</div>
            <div className="actions">
              <button className="btn-g" onClick={() => setMoodSaved(true)}>{moodSaved ? 'Añadido ✓' : 'Añadir al moodboard'}</button>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
