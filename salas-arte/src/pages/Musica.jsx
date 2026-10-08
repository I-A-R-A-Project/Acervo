import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Musica.css'

const FONTS = 'Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600'
const PALETTES = ['#8FBF6B', '#E0A93A', '#B65B3A', '#6B4166', '#4A6B8A', '#B0455A']

function coverSvg(id) {
  const c = PALETTES[hashId(id) % PALETTES.length]
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="100" height="100" fill="${c}"/>
    <circle cx="30" cy="30" r="22" fill="rgba(0,0,0,0.15)"/>
    <rect x="0" y="60" width="100" height="40" fill="rgba(0,0,0,0.2)"/>
  </svg>`
}

const GROUPS = [
  { id: 'electronica', label: 'Electrónica', items: [
    { id: 'm1', title: 'Ritmo de Andén', artist: 'Dial Nocturno', medium: 'EP, 4 pistas', license: 'CC BY 4.0', source: 'blog de sellos independientes', saved: '20 jun 2026', tags: ['minimal', 'percusión seca'], notes: '' },
    { id: 'm2', title: 'Circuito Cerrado', artist: 'Vela Sintética', medium: 'single', license: 'unknown', source: 'feed RSS — netlabel', saved: '02 mar 2026', tags: ['ambient', 'loop'], notes: '' },
  ]},
  { id: 'acustica', label: 'Acústica', items: [
    { id: 'm3', title: 'Fuga en Sol Menor', artist: 'Cuarteto Umbral', medium: 'grabación en vivo', license: 'CC BY-SA', source: 'Behance — sección audio', saved: '27 jul 2026', tags: ['cuerdas', 'contrapunto'], notes: '' },
    { id: 'm4', title: 'Coplas del Alto', artist: 'Ines Marimón', medium: 'álbum, 8 pistas', license: 'dominio público', source: 'archivo folclórico abierto', saved: '09 ene 2026', tags: ['tradicional', 'voz'], notes: '' },
    { id: 'm5', title: 'Cuaderno de Guitarra', artist: 'Tomás Oyola', medium: 'demo instrumental', license: 'CC BY-NC', source: 'import manual', saved: '15 may 2026', tags: ['boceto'], notes: '' },
  ]},
  { id: 'experimental', label: 'Experimental', items: [
    { id: 'm6', title: 'Marea Baja EP', artist: 'Colectivo Sismo', medium: 'EP, 3 pistas', license: 'todos los derechos reservados', source: 'portafolio curado', saved: '01 ago 2026', tags: ['field recording', 'textura'], notes: '' },
    { id: 'm7', title: 'Ruido de Fondo N°2', artist: 'Ana Kessler', medium: 'pieza sonora', license: 'unknown', source: 'DeviantArt — sección audio', saved: '23 abr 2026', tags: ['noise', 'abstracto'], notes: '' },
  ]},
]

export default function Musica() {
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
    <div className="page-musica">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← SALAS DE ARTE</Link><span className="mark">MÚSICA</span><span className="sub">— la discoteca</span></div>
          <div className="search"><input type="text" placeholder="buscar pista, artista, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} fundas en el cajón</div>
        </header>
        <aside className="sidebar">
          <h2>Cajones</h2>
          <ShelfList groups={GROUPS} allLabel="Todos los cajones" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Cada funda contiene una pieza musical. Click para abrir el <b>gatefold</b>.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>Cajón de discos</h1><p>Piezas sonoras recolectadas para inspiración de ritmo, portada y campaña.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          {visibleGroups.map((g, gi) => (
            <div key={g.id}>
              <div className="grp-label">{g.label} · {g.items.length}</div>
              <div className="crate">
                {g.items.map((it, i) => (
                  <button key={it.id} className="sleeve" style={{ '--i': gi * 3 + i }} aria-pressed={selected?.id === it.id} title={it.title} onClick={() => select(it)}>
                    <span className="disc" />
                    <span className="cover" dangerouslySetInnerHTML={{ __html: coverSvg(it.id) + `<span class="label-txt">${it.title}</span>` }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)}>
        {selected && (
          <div className="gf-panel">
            <button className="gf-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar">✕</button>
            <div className="catno">CAT. MUS-{(hashId(selected.id) % 900) + 100}</div>
            <h3>{selected.title}</h3>
            <p className="by">por {selected.artist}</p>
            <div className="prow"><span className="k">Medio</span><span className="v">{selected.medium}</span></div>
            <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
            <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
            <div className="prow"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
            <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
            <div className="liner">{selected.notes || 'Sin notas de línea todavía.'}</div>
            <div className="actions">
              <button className="btn-g" onClick={() => setMoodSaved(true)}>{moodSaved ? 'Añadido ✓' : 'Añadir al moodboard'}</button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
