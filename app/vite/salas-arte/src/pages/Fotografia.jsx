import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Fotografia.css'

const FONTS = 'Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600'
const TONES = ['#4A4A48', '#6B5A4E', '#3A424A', '#5A4A42', '#42504A']

function negSvg(id) {
  const c = TONES[hashId(id) % TONES.length]
  const h2 = hashId(id + 'x')
  return `<svg viewBox="0 0 90 60" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="90" height="60" fill="${c}"/>
    <rect x="0" y="${20 + (h2 % 15)}" width="90" height="${18 + (h2 % 10)}" fill="rgba(0,0,0,0.35)"/>
    <circle cx="${20 + (h2 % 40)}" cy="${15 + (h2 % 20)}" r="${8 + (h2 % 6)}" fill="rgba(255,255,255,0.12)"/>
  </svg>`
}

const GROUPS = [
  { id: 'retrato', label: 'Retrato', items: [
    { id: 'f1', title: 'Retrato N°12', artist: 'Yamila Bosco', medium: '35mm, B/N', license: 'CC BY 4.0', source: 'ArtStation — fotografía', saved: '23 jun 2026', tags: ['grano', 'luz lateral'], notes: '' },
    { id: 'f2', title: 'Manos de Taller', artist: 'Cristian Nuñez', medium: 'digital, 50mm', license: 'unknown', source: 'feed RSS — bitácora de estudio', saved: '11 feb 2026', tags: ['oficio', 'close-up'], notes: '' },
    { id: 'f3', title: 'Ventana al Patio', artist: 'Lorena Achával', medium: 'medio formato', license: 'dominio público', source: 'Wikimedia Commons', saved: '02 ago 2025', tags: ['luz natural'], notes: '' },
  ]},
  { id: 'paisaje', label: 'Paisaje', items: [
    { id: 'f4', title: 'Bruma sobre el Muelle', artist: 'Ignacio Farfán', medium: 'panorámica digital', license: 'CC BY-SA', source: 'Behance', saved: '28 jul 2026', tags: ['niebla', 'minimal'], notes: '' },
    { id: 'f5', title: 'Sombra al Mediodía', artist: 'Carla Wenceslao', medium: '35mm, color', license: 'CC BY-NC', source: 'import manual', saved: '16 may 2026', tags: ['alto contraste'], notes: '' },
    { id: 'f6', title: 'Camino de Sal', artist: 'Bruno Iturralde', medium: 'dron, 24mm', license: 'todos los derechos reservados', source: 'portafolio curado', saved: '09 mar 2026', tags: ['vista aérea'], notes: '' },
  ]},
  { id: 'callejera', label: 'Callejera', items: [
    { id: 'f7', title: 'Esquina Después de la Lluvia', artist: 'Denise Ocampo', medium: 'digital, 28mm', license: 'unknown', source: 'DeviantArt — sección foto', saved: '05 ago 2026', tags: ['reflejos', 'nocturno'], notes: '' },
    { id: 'f8', title: 'Kiosco a las Seis', artist: 'Pablo Reinaga', medium: '35mm, color', license: 'CC BY 4.0', source: 'archivo urbano abierto', saved: '20 ene 2026', tags: ['cotidiano'], notes: '' },
  ]},
]

export default function Fotografia() {
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
    <div className="page-fotografia">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← Salas de Arte</Link><span className="mark">Fotografía</span><span className="sub">— el cuarto oscuro</span></div>
          <div className="search"><input type="text" placeholder="buscar foto, autor, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} negativos</div>
        </header>
        <aside className="sidebar">
          <h2>Rollos</h2>
          <ShelfList groups={GROUPS} allLabel="Todos los rollos" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Cada negativo es una foto guardada. Click para verla en la <b>mesa de luz</b>.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>Hoja de contacto</h1><p>Fotografías guardadas para estudio de luz, encuadre y textura.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          {visibleGroups.map((g) => (
            <div key={g.id}>
              <div className="grp-label">{g.label} · {g.items.length}</div>
              <div className="contact-sheet">
                {g.items.map((it, idx) => {
                  const i = gi; gi++
                  return (
                    <button key={it.id} className="neg" style={{ '--i': i }} aria-pressed={selected?.id === it.id} title={it.title} onClick={() => select(it)}>
                      <span dangerouslySetInnerHTML={{ __html: negSvg(it.id) }} />
                      <span className="mark-select" />
                      <span className="frame-no">#{String(idx + 1).padStart(2, '0')}</span>
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
          <article className="loupe-card">
            <div className="loupe-preview" dangerouslySetInnerHTML={{ __html: negSvg(selected.id) }} />
            <button className="lp-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar" style={{ position: 'absolute', top: 12, right: 12 }}>✕</button>
            <div className="lp-body">
              <div className="catno">ROLLO FOT-{(hashId(selected.id) % 900) + 100}</div>
              <h3>{selected.title}</h3>
              <p className="by">por {selected.artist}</p>
              <div className="exif">
                <div><span className="lbl">Medio</span><b>{selected.medium}</b></div>
                <div><span className="lbl">Guardado</span><b>{selected.saved}</b></div>
              </div>
              <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
              <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
              <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
              <div className="noteblock">{selected.notes || 'Sin notas todavía.'}</div>
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
