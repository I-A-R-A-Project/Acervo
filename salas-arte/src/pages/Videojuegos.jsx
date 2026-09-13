import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Videojuegos.css'

const FONTS = 'Press+Start+2P&family=IBM+Plex+Mono:wght@400;500;600;700'
const COLORS = ['#4CE0D2', '#E14CC7', '#F2C230', '#7DE0A0', '#8A8FA3']

function pixelSvg(id) {
  const c = COLORS[hashId(id) % COLORS.length]
  const seed = hashId(id + 'p')
  let rects = ''
  for (let i = 0; i < 6; i++) {
    const x = (seed >> (i * 2)) % 4
    const y = (seed >> (i * 3 + 1)) % 4
    rects += `<rect x="${x * 6}" y="${y * 6}" width="6" height="6" fill="${c}"/>`
  }
  return `<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" fill="#0A0A0F"/>${rects}</svg>`
}

const GROUPS = [
  { id: 'plataformas', label: 'Plataformas', items: [
    { id: 'v1', title: 'Sendero de Píxeles', artist: 'Estudio Yuyo', medium: 'juego 2D, sprite art', license: 'CC BY 4.0', source: 'ArtStation — game art', saved: '27 jun 2026', tags: ['pixel art', 'plataformas'], notes: '' },
    { id: 'v2', title: 'Salto de Musgo', artist: 'Bruma Games', medium: 'prototipo jugable', license: 'unknown', source: 'feed RSS — devlog', saved: '13 feb 2026', tags: ['naturaleza', 'físicas'], notes: '' },
  ]},
  { id: 'rpg', label: 'RPG', items: [
    { id: 'v3', title: 'Jardín de Bits', artist: 'Nébula Studio', medium: 'concept art de mundo', license: 'todos los derechos reservados', source: 'portafolio de estudio', saved: '31 jul 2026', tags: ['isométrico', 'worldbuilding'], notes: '' },
    { id: 'v4', title: 'Crónicas del Faro', artist: 'Delta Rúa', medium: 'hoja de personajes', license: 'CC BY-SA', source: 'Behance', saved: '20 may 2026', tags: ['diseño de personaje'], notes: '' },
    { id: 'v5', title: 'Reino de Ceniza', artist: 'Colectivo Órbita', medium: 'arte conceptual', license: 'CC BY-NC', source: 'import manual', saved: '04 mar 2026', tags: ['ambientación oscura'], notes: '' },
  ]},
  { id: 'arcade', label: 'Arcade', items: [
    { id: 'v6', title: 'Ruinas de Neón', artist: 'Kioscograma', medium: 'arte de gabinete', license: 'dominio público', source: 'archivo retro abierto', saved: '09 ago 2026', tags: ['synthwave', 'high score'], notes: '' },
    { id: 'v7', title: 'Corredor Infinito', artist: 'Vórtice Lab', medium: 'sprite sheet', license: 'unknown', source: 'DeviantArt — sección juegos', saved: '22 ene 2026', tags: ['endless runner'], notes: '' },
  ]},
]

export default function Videojuegos() {
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
    <div className="page-videojuegos">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← SALAS DE ARTE</Link><span className="mark">SALAS DE ARTE</span><span className="sub">— la cartucho-teca</span></div>
          <div className="search"><input type="text" placeholder="buscar juego, estudio, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} cartuchos</div>
        </header>
        <aside className="sidebar">
          <h2>Géneros</h2>
          <ShelfList groups={GROUPS} allLabel="TODOS" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Cada cartucho es una referencia guardada. Click para abrir la <b>pantalla de guardado</b>.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>ESTANTE DE JUEGOS</h1><p>Referencias de videojuegos para estudio de arte, UI y worldbuilding.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          {visibleGroups.map((g, gi) => (
            <div key={g.id}>
              <div className="grp-label">{g.label.toUpperCase()} · {g.items.length}</div>
              <div className="shelf-row">
                {g.items.map((it, i) => (
                  <button key={it.id} className="cart" style={{ '--i': gi * 3 + i }} aria-pressed={selected?.id === it.id} title={it.title} onClick={() => select(it)}>
                    <span className="shell" style={{ background: `linear-gradient(180deg, ${COLORS[hashId(it.id) % COLORS.length]}33, #23283A)` }}>
                      <span className="label" dangerouslySetInnerHTML={{ __html: pixelSvg(it.id) }} />
                      <span className="cap">{it.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)}>
        {selected && (
          <article className="save-card">
            <button className="sc-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar">✕</button>
            <div className="catno">SLOT {(hashId(selected.id) % 9) + 1} · ID {(hashId(selected.id) % 9000) + 1000}</div>
            <h3>{selected.title}</h3>
            <p className="by">por {selected.artist}</p>
            <div className="prow"><span className="k">Formato</span><span className="v">{selected.medium}</span></div>
            <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
            <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
            <div className="prow"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
            <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
            <div className="devnotes">{selected.notes || 'Sin notas de desarrollo todavía.'}</div>
            <div className="actions">
              <button className="btn-g" onClick={() => setMoodSaved(true)}>{moodSaved ? 'AÑADIDO ✓' : 'Añadir al moodboard'}</button>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
