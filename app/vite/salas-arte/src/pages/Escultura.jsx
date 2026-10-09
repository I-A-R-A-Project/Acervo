import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Escultura.css'

const FONTS = 'Newsreader:ital,wght@0,500;0,600;0,700;1,500&family=IBM+Plex+Mono:wght@400;500;600'

const FIGS = [
  `<svg viewBox="0 0 64 74" width="64" height="74"><ellipse cx="32" cy="16" rx="10" ry="14" fill="#DCC79B"/><path d="M18 40 Q32 22 46 40 L42 74 L22 74 Z" fill="#C7B389"/></svg>`,
  `<svg viewBox="0 0 64 74" width="64" height="74"><rect x="14" y="8" width="36" height="60" rx="18" fill="#B8A278" transform="rotate(8 32 38)"/></svg>`,
  `<svg viewBox="0 0 64 74" width="64" height="74"><circle cx="32" cy="24" r="16" fill="#CDB98E"/><rect x="22" y="38" width="20" height="34" fill="#B8A278"/></svg>`,
  `<svg viewBox="0 0 64 74" width="64" height="74"><path d="M10 66 L32 6 L54 66 Z" fill="#C2AD82"/></svg>`,
]

const GROUPS = [
  { id: 'figura', label: 'Figura', items: [
    { id: 's1', title: 'Torso en Bronce', artist: 'Helena Cruz', medium: 'bronce patinado', license: 'CC BY 4.0', source: 'ArtStation — escultura', saved: '22 jun 2026', tags: ['figurativo', 'clásico'], notes: '' },
    { id: 's2', title: 'Figura Erguida', artist: 'Adrián Loyo', medium: 'terracota', license: 'dominio público', source: 'museo digital — archivo abierto', saved: '08 mar 2026', tags: ['arcaico'], notes: '' },
    { id: 's3', title: 'Retrato en Yeso', artist: 'Sole Baigorria', medium: 'yeso', license: 'unknown', source: 'import manual', saved: '14 ene 2026', tags: ['estudio de rostro'], notes: '' },
  ]},
  { id: 'abstracta', label: 'Abstracta', items: [
    { id: 's4', title: 'Nudo de Piedra', artist: 'Tobías Reinoso', medium: 'mármol tallado', license: 'todos los derechos reservados', source: 'portafolio curado', saved: '30 jul 2026', tags: ['tensión', 'curva continua'], notes: 'Falta confirmar licencia antes de publicar.' },
    { id: 's5', title: 'Pliegue Suspendido', artist: 'Mora Estévez', medium: 'acero inoxidable', license: 'CC BY-SA', source: 'Behance', saved: '19 may 2026', tags: ['cinético', 'reflectante'], notes: '' },
  ]},
  { id: 'instalacion', label: 'Instalación', items: [
    { id: 's6', title: 'Campo de Astas', artist: 'Renzo Villagra', medium: 'madera e hilo', license: 'CC BY-NC-ND', source: 'DeviantArt — sección 3D', saved: '03 ago 2026', tags: ['site-specific', 'escala humana'], notes: '' },
    { id: 's7', title: 'Sombra Habitada', artist: 'Julieta Manes', medium: 'instalación lumínica', license: 'unknown', source: 'feed RSS — bienal abierta', saved: '27 abr 2026', tags: ['luz', 'espacio negativo'], notes: '' },
  ]},
]

export default function Escultura() {
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
    <div className="page-escultura">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← Salas de Arte</Link><span className="mark">Escultura</span><span className="sub">— la sala de vitrinas</span></div>
          <div className="search"><input type="text" placeholder="buscar pieza, autor, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} piezas en sala</div>
        </header>
        <aside className="sidebar">
          <h2>Salas</h2>
          <ShelfList groups={GROUPS} allLabel="Todas las salas" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Cada pedestal es una pieza guardada. Click para abrir la <b>cartela de museo</b>.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>Sala de esculturas</h1><p>Referencias tridimensionales para estudio de volumen, material y escala.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          {visibleGroups.map((g, gi) => (
            <div className="grp" key={g.id}>
              <div className="grp-label">{g.label} · {g.items.length}</div>
              <div className="room">
                {g.items.map((it, i) => (
                  <button key={it.id} className="exhibit" style={{ '--i': gi * 3 + i }} aria-pressed={selected?.id === it.id} onClick={() => select(it)}>
                    <span className="spot" />
                    <span className="figure" dangerouslySetInnerHTML={{ __html: FIGS[hashId(it.id) % FIGS.length] }} />
                    <span className="plinth" />
                    <span className="ex-label"><b>{it.title}</b>{it.artist}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)}>
        {selected && (
          <article className="label-card">
            <button className="lc-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar">✕</button>
            <div className="accession">N° INV. ESC-{(hashId(selected.id) % 900) + 100}</div>
            <h3>{selected.title}</h3>
            <p className="by">por {selected.artist}</p>
            <div className="prow"><span className="k">Material</span><span className="v">{selected.medium}</span></div>
            <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
            <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
            <div className="prow"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
            <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
            <div className="cond">{selected.notes || 'Sin notas de estado de conservación todavía.'}</div>
            <div className="actions">
              <button className="btn-g" onClick={() => setMoodSaved(true)}>{moodSaved ? 'Añadido ✓' : 'Añadir al moodboard'}</button>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
