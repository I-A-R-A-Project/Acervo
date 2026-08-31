import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Literatura.css'

const FONTS = 'Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500&family=Courier+Prime:wght@400;700'

const SPINE_COLORS = ['forest', 'burgundy', 'navy', 'mustard', 'plum']
const COLOR_VARS = { forest: 'var(--forest)', burgundy: 'var(--burgundy)', navy: 'var(--navy)', mustard: 'var(--mustard)', plum: 'var(--plum)' }

const GROUPS = [
  { id: 'poesia', label: 'Poesía', items: [
    { id: 'lit-01', title: 'El Peso de las Horas', artist: 'Marina Solt', medium: 'poemario, 64 pp.', tags: ['melancolía', 'tiempo', 'lírica breve'], license: 'CC BY-NC 4.0', source: 'blog personal — marinasolt.net', saved: '12 mar 2026', notes: 'Buscada por el ritmo de los versos cortos; útil como referencia de tono para la campaña de otoño.' },
    { id: 'lit-02', title: 'Cartas al Vacío', artist: 'Rubén Achaval', medium: 'poesía epistolar', tags: ['soledad', 'forma epistolar'], license: 'todos los derechos reservados', source: 'revista Umbral #14', saved: '02 ene 2026', notes: 'Estructura en cartas — considerar para el formato de posts seriados.' },
    { id: 'lit-03', title: 'Atlas de Sed', artist: 'Iara Beltrán', medium: 'poesía visual', tags: ['geografía', 'experimental'], license: 'dominio público', source: 'Wikimedia Commons', saved: '28 jul 2025', notes: '' },
  ]},
  { id: 'novela', label: 'Novela', items: [
    { id: 'lit-04', title: 'Cuaderno de Islas', artist: 'Tomás Nieva', medium: 'novela corta', tags: ['viaje', 'memoria'], license: 'CC BY 4.0', source: 'ArtStation — narrativa', saved: '19 jun 2026', notes: 'Buena referencia de estructura fragmentada.' },
    { id: 'lit-05', title: 'La Sed del Mapa', artist: 'Elena Yrigoyen', medium: 'novela, cap. 1–3 (avance)', tags: ['aventura', 'cartografía ficticia'], license: 'uso editorial autorizado', source: 'portafolio curado', saved: '05 ago 2026', notes: '' },
    { id: 'lit-06', title: 'Los Días de Cobre', artist: 'Facundo Ares', medium: 'novela', tags: ['realismo', 'oficios'], license: 'unknown', source: 'feed RSS — letras del sur', saved: '30 abr 2026', notes: '' },
    { id: 'lit-07', title: 'Umbral de Sal', artist: 'Noa Ferrer', medium: 'novela breve', tags: ['costa', 'duelo'], license: 'CC BY-NC-ND', source: 'import manual', saved: '14 feb 2026', notes: '' },
  ]},
  { id: 'ensayo', label: 'Ensayo', items: [
    { id: 'lit-08', title: 'Sobre el Ocio Necesario', artist: 'Guido Marchetti', medium: 'ensayo breve', tags: ['filosofía', 'tiempo libre'], license: 'CC BY-SA 4.0', source: 'blog académico', saved: '09 may 2026', notes: 'Referencia de tono para textos más reflexivos.' },
    { id: 'lit-09', title: 'El Ruido y la Forma', artist: 'Celia Prado', medium: 'ensayo sobre estética', tags: ['diseño', 'percepción'], license: 'dominio público', source: 'museo digital — archivo abierto', saved: '21 mar 2026', notes: '' },
  ]},
  { id: 'teatro', label: 'Teatro', items: [
    { id: 'lit-10', title: 'Tres Puertas', artist: 'Julián Corvo', medium: 'obra en un acto', tags: ['diálogo', 'absurdo'], license: 'todos los derechos reservados', source: 'portafolio de artista', saved: '17 ago 2026', notes: '' },
    { id: 'lit-11', title: 'La Sala de Espera', artist: 'Dana Quiroga', medium: 'monólogo', tags: ['introspección'], license: 'CC BY-NC', source: 'DeviantArt — sección texto', saved: '03 jul 2026', notes: '' },
  ]},
]

function bookStyle(book) {
  const h = hashId(book.id)
  const width = 40 + (h % 5) * 6
  const height = 168 + ((h >> 3) % 6) * 8
  const color = SPINE_COLORS[h % SPINE_COLORS.length]
  return { width, height, color }
}

function callNumberFor(book) {
  const shelfCode = book.groupLabel.slice(0, 3).toUpperCase()
  const num = (hashId(book.id) % 900) + 100
  return `LIT/${shelfCode} ${num}.${book.id.slice(-2)}`
}

export default function Literatura() {
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

  function selectBook(book, groupLabel) {
    setSelected({ ...book, groupLabel })
    setMoodSaved(false)
  }

  return (
    <div className="page-literatura">
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <Link className="back" to="/">← ArtVision</Link>
            <span className="mark">Literatura</span>
            <span className="room-title">— la sala de lectura</span>
          </div>
          <div className="search" role="search">
            <input
              type="text"
              placeholder="buscar por título, autor o tag…"
              aria-label="Buscar en el catálogo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="topbar-meta">{totalCount} volúmenes catalogados</div>
        </header>

        <aside className="sidebar">
          <h2>Estantes</h2>
          <ShelfList groups={GROUPS} allLabel="Todos los estantes" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="card-index">
            Cada lomo es una pieza guardada.<br />
            Click en un lomo para sacar su <b>ficha de catálogo</b> — autor, medio, licencia y notas.
          </div>
        </aside>

        <main className="main">
          <div className="main-heading">
            <div>
              <h1>Estantería de literatura</h1>
              <p>Referencias de texto guardadas desde blogs, revistas y publicaciones propias.</p>
            </div>
            <div className="result-count">{visibleCount} en vista</div>
          </div>

          {visibleGroups.map((group, gi) => (
            <div className="shelf-unit" key={group.id}>
              <div className="shelf-unit-label">{group.label} · {group.items.length}</div>
              <div className="shelf-row">
                {group.items.map((book, i) => {
                  const st = bookStyle(book)
                  return (
                    <button
                      key={book.id}
                      className="book"
                      style={{ '--w': `${st.width}px`, '--h': `${st.height}px`, '--spine': COLOR_VARS[st.color], '--i': gi * 3 + i }}
                      aria-pressed={selected?.id === book.id}
                      title={`${book.title} — ${book.artist}`}
                      onClick={() => selectBook(book, group.label)}
                    >
                      <span className="spine-cap" />
                      <span className="spine-band top" />
                      <span className="spine-title">{book.title}</span>
                      <span className="spine-band bottom" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {visibleCount === 0 && <div className="empty-state">No hay volúmenes en este estante todavía.</div>}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)} className="">
        {selected && (
          <article className="catalog-card">
            <button className="card-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar ficha">✕</button>
            <span className="guide-tab" style={{ background: COLOR_VARS[bookStyle(selected).color] }}>{selected.groupLabel}</span>
            <div className="call-number">{callNumberFor(selected)}</div>
            <h3>{selected.title}</h3>
            <p className="by">por {selected.artist}</p>
            <div className="field-row"><span className="k">Medio</span><span className="v">{selected.medium}</span></div>
            <div className="field-row"><span className="k">Categoría</span><span className="v">Literatura — {selected.groupLabel}</span></div>
            <div className="field-row"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
            <div className="field-row"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
            <div className="field-row"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
            <div className="field-row"><span className="k">Tags</span><span className="v"><span className="tag-row">{selected.tags.map(t => <span className="tag" key={t}>{t}</span>)}</span></span></div>
            <div className="notes-block">{selected.notes || 'Sin notas todavía. Añadí contexto para futuras publicaciones.'}</div>
            <span className="stamp">{selected.license === 'dominio público' ? 'Dominio público' : selected.license === 'unknown' ? 'Licencia sin confirmar' : 'Referencia guardada'}</span>
            <div className="card-actions">
              <button className="btn-ghost" onClick={() => setMoodSaved(true)}>{moodSaved ? 'Añadido ✓' : 'Añadir al moodboard'}</button>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
