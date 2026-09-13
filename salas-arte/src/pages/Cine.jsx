import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Cine.css'

const FONTS = 'Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600'
const PALETTES = ['#D98A3D', '#7A1F2B', '#4A5B7A', '#7A6A2A', '#6B4166']

function celSvg(id) {
  const c = PALETTES[hashId(id) % PALETTES.length]
  return `<svg viewBox="0 0 100 75" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="100" height="75" fill="#0D0D0F"/>
    <rect x="0" y="20" width="100" height="35" fill="${c}" opacity="0.85"/>
    <rect x="0" y="0" width="100" height="8" fill="rgba(0,0,0,0.6)"/>
    <rect x="0" y="67" width="100" height="8" fill="rgba(0,0,0,0.6)"/>
  </svg>`
}

const GROUPS = [
  { id: 'drama', label: 'Drama', items: [
    { id: 'c1', title: 'Última Toma', artist: 'Wren Salto', medium: 'cortometraje, 12 min', license: 'CC BY 4.0', source: 'ArtStation — cine', saved: '25 jun 2026', tags: ['B/N', 'plano secuencia'], notes: '' },
    { id: 'c2', title: 'Ciudad en Negativo', artist: 'Federico Ansaldo', medium: 'largometraje (fragmento)', license: 'unknown', source: 'feed RSS — festival independiente', saved: '14 mar 2026', tags: ['urbano', 'nocturno'], notes: '' },
  ]},
  { id: 'documental', label: 'Documental', items: [
    { id: 'c3', title: 'Luz de Andén', artist: 'Micaela Fonrouge', medium: 'documental, 24 min', license: 'CC BY-SA', source: 'archivo audiovisual abierto', saved: '29 jul 2026', tags: ['ferrocarril', 'retrato'], notes: '' },
    { id: 'c4', title: 'Manos que Tejen', artist: 'Osvaldo Perea', medium: 'documental corto', license: 'dominio público', source: 'museo digital — archivo abierto', saved: '02 ene 2026', tags: ['oficio', 'tradición'], notes: '' },
    { id: 'c5', title: 'El Río que Vuelve', artist: 'Dana Iribarne', medium: 'ensayo audiovisual', license: 'CC BY-NC', source: 'import manual', saved: '18 may 2026', tags: ['naturaleza', 'tiempo'], notes: '' },
  ]},
  { id: 'experimental', label: 'Experimental', items: [
    { id: 'c6', title: 'Bucle de Fósforo', artist: 'Nazareno Quintar', medium: 'video-arte', license: 'todos los derechos reservados', source: 'portafolio de artista', saved: '06 ago 2026', tags: ['found footage', 'glitch'], notes: '' },
  ]},
]

export default function Cine() {
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

  const marqueeText = useMemo(() => {
    const all = GROUPS.flatMap(g => g.items)
    return all.map(i => `AHORA EN CATÁLOGO — ${i.title.toUpperCase()}`).join('   ★   ').repeat(2)
  }, [])

  let gi = 0
  return (
    <div className="page-cine">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← ArtVision</Link><span className="mark">Cine</span><span className="sub">— sala de proyección</span></div>
          <div className="search"><input type="text" placeholder="buscar título, director, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} fotogramas</div>
        </header>
        <aside className="sidebar">
          <h2>Programación</h2>
          <ShelfList groups={GROUPS} allLabel="Toda la programación" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Cada fotograma es una referencia guardada. Click para abrir la <b>claqueta</b>.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>Rollo de referencias</h1><p>Piezas audiovisuales para estudio de encuadre, montaje y color.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          <div className="marquee"><span>{marqueeText}</span></div>
          {visibleGroups.map((g) => (
            <div key={g.id}>
              <div className="grp-label">{g.label} · {g.items.length}</div>
              <div className="reel">
                {g.items.map((it) => {
                  const idx = gi; gi++
                  return (
                    <button key={it.id} className="frame-btn" style={{ '--i': idx }} aria-pressed={selected?.id === it.id} title={it.title} onClick={() => select(it)}>
                      <span className="sprockets">{Array.from({length:6}).map((_,k)=><span key={k}/>)}</span>
                      <span className="cel" dangerouslySetInnerHTML={{ __html: celSvg(it.id) }} />
                      <span className="cel-cap"><b>{it.title}</b>{it.artist}</span>
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
          <article className="slate">
            <div className="slate-top"><button className="sl-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar">✕</button></div>
            <div className="slate-body">
              <div className="catno">ESCENA {(hashId(selected.id) % 90) + 10} · TOMA {(hashId(selected.id) % 9) + 1}</div>
              <h3>{selected.title}</h3>
              <p className="by">dirección de {selected.artist}</p>
              <div className="prow"><span className="k">Formato</span><span className="v">{selected.medium}</span></div>
              <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
              <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
              <div className="prow"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
              <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
              <div className="noteblock">{selected.notes || 'Sin notas de producción todavía.'}</div>
              <div className="actions">
                <button className="btn-g" onClick={() => setMoodSaved(true)}>{moodSaved ? 'Añadido ✓' : 'Añadir al moodboard'}</button>
              </div>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
