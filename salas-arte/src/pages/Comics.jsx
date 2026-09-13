import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Comics.css'

const FONTS = 'Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600;700'
const COLORS = ['#D3272C', '#2B5BA8', '#F2C230', '#151515']
const SPANS = ['p-a', 'p-b', 'p-c', 'p-d', 'p-e', 'p-f']
const BUBBLES = ['¡GUARDADO!', 'REF. NUEVA', '¡MIRÁ ESTO!', 'A LA COLA']

function panelSvg(id) {
  const c1 = COLORS[hashId(id) % COLORS.length]
  const c2 = COLORS[(hashId(id + 'y') + 1) % COLORS.length]
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
    <rect width="100" height="100" fill="#fff"/>
    <polygon points="0,100 45,20 100,60 100,100" fill="${c1}" opacity="0.85"/>
    <circle cx="72" cy="28" r="14" fill="${c2}" opacity="0.9"/>
  </svg>`
}

const GROUPS = [
  { id: 'accion', label: 'Acción', items: [
    { id: 'k1', title: 'Barrio Fantasma #3', artist: 'Nico Salcedo', medium: 'página de cómic, 6 viñetas', license: 'CC BY 4.0', source: 'ArtStation — cómics', saved: '26 jun 2026', tags: ['acción', 'noir'], notes: '' },
    { id: 'k2', title: 'Motor de Tinta', artist: 'Deb Larralde', medium: 'splash page', license: 'unknown', source: 'feed RSS — webcómic', saved: '12 feb 2026', tags: ['mecha', 'dinámico'], notes: '' },
    { id: 'k3', title: 'Persecución en Sepia', artist: 'Gastón Ibarreche', medium: 'tira de 4 viñetas', license: 'CC BY-NC', source: 'import manual', saved: '03 ago 2026', tags: ['retro'], notes: '' },
  ]},
  { id: 'humor', label: 'Humor', items: [
    { id: 'k4', title: 'Recreo Eterno', artist: 'Sofi Landriel', medium: 'tira diaria', license: 'dominio público', source: 'archivo de prensa abierto', saved: '19 may 2026', tags: ['costumbrista'], notes: '' },
    { id: 'k5', title: 'El Gato del Piso 4', artist: 'Rulo Beviglia', medium: 'webcómic, 3 páginas', license: 'CC BY-SA', source: 'Behance', saved: '30 mar 2026', tags: ['slice of life'], notes: '' },
  ]},
  { id: 'fantasia', label: 'Fantasía', items: [
    { id: 'k6', title: 'El Último Faro', artist: 'Ivo Marchese', medium: 'página doble', license: 'todos los derechos reservados', source: 'portafolio de artista', saved: '08 ago 2026', tags: ['épico', 'criaturas'], notes: '' },
  ]},
]

export default function Comics() {
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
    <div className="page-comics">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← Salas de Arte</Link><span className="mark">Cómics</span><span className="sub">— la página</span></div>
          <div className="search"><input type="text" placeholder="buscar viñeta, autor, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} viñetas</div>
        </header>
        <aside className="sidebar">
          <h2>Ediciones</h2>
          <ShelfList groups={GROUPS} allLabel="Toda la edición" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Cada viñeta es una pieza guardada. Click para abrir la <b>nota editorial</b>.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>La página de cómics</h1><p>Viñetas guardadas para estudio de narrativa secuencial y estilo de trazo.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          {visibleGroups.map((g) => (
            <div key={g.id}>
              <div className="grp-label">{g.label} · {g.items.length}</div>
              <div className="page-grid">
                {g.items.map((it) => {
                  const span = SPANS[hashId(it.id) % SPANS.length]
                  const bub = BUBBLES[hashId(it.id + 'b') % BUBBLES.length]
                  const idx = gi; gi++
                  return (
                    <button key={it.id} className={`panel ${span}`} style={{ '--i': idx }} aria-pressed={selected?.id === it.id} title={it.title} onClick={() => select(it)}>
                      <span dangerouslySetInnerHTML={{ __html: panelSvg(it.id) }} />
                      <span className="bubble">{bub}</span>
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
          <article className="caption-card">
            <button className="cc-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar">✕</button>
            <span className="catno">EDICIÓN COM-{(hashId(selected.id) % 900) + 100}</span>
            <h3>{selected.title}</h3>
            <p className="by">guion y arte de {selected.artist}</p>
            <div className="prow"><span className="k">Formato</span><span className="v">{selected.medium}</span></div>
            <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
            <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
            <div className="prow"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
            <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
            <div className="caption-block">{selected.notes || 'Sin notas editoriales todavía.'}</div>
            <div className="actions">
              <button className="btn-g" onClick={() => setMoodSaved(true)}>{moodSaved ? 'Añadido ✓' : 'Añadir al moodboard'}</button>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
