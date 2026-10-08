import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArchiveFilter } from '../hooks/useArchiveFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './Arquitectura.css'

const FONTS = 'Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600'

const ICONS = [
  `<svg viewBox="0 0 100 60" fill="none" stroke="#1B2430" stroke-width="1.4"><rect x="10" y="20" width="80" height="30"/><line x1="10" y1="20" x2="50" y2="6"/><line x1="90" y1="20" x2="50" y2="6"/><line x1="30" y1="50" x2="30" y2="30"/><line x1="55" y1="50" x2="55" y2="30"/></svg>`,
  `<svg viewBox="0 0 100 60" fill="none" stroke="#1B2430" stroke-width="1.4"><rect x="20" y="6" width="60" height="48"/><line x1="20" y1="24" x2="80" y2="24"/><line x1="20" y1="40" x2="80" y2="40"/><line x1="40" y1="6" x2="40" y2="54"/><line x1="60" y1="6" x2="60" y2="54"/></svg>`,
  `<svg viewBox="0 0 100 60" fill="none" stroke="#1B2430" stroke-width="1.4"><circle cx="50" cy="30" r="22"/><line x1="50" y1="8" x2="50" y2="52"/><line x1="28" y1="30" x2="72" y2="30"/></svg>`,
]

const GROUPS = [
  { id: 'residencial', label: 'Residencial', items: [
    { id: 'a1', title: 'Casa entre Medianeras', artist: 'Nicolás Ferro', type: 'vivienda unifamiliar', license: 'CC BY 4.0', source: 'ArtStation — arquitectura', saved: '11 jun 2026', tags: ['hormigón visto', 'patio interior'], notes: 'Referencia de luz cenital para la próxima serie.' },
    { id: 'a2', title: 'Módulo Apilado', artist: 'Bruno Askew', type: 'vivienda colectiva', license: 'unknown', source: 'feed RSS — bitácora de obra', saved: '02 ene 2026', tags: ['modular', 'prefabricado'], notes: '' },
    { id: 'a3', title: 'Refugio de Piedra', artist: 'Coral Miño', type: 'vivienda de montaña', license: 'CC BY-NC-ND', source: 'portafolio curado', saved: '19 ago 2025', tags: ['piedra local', 'techo a dos aguas'], notes: '' },
  ]},
  { id: 'publico', label: 'Público', items: [
    { id: 'a4', title: 'Pabellón de Sombra', artist: 'Iris Kell', type: 'pabellón temporal', license: 'CC BY-SA', source: 'Behance', saved: '27 jul 2026', tags: ['celosía', 'ligero'], notes: '' },
    { id: 'a5', title: 'Biblioteca de Barrio', artist: 'Máximo Solá', type: 'equipamiento cultural', license: 'dominio público', source: 'archivo municipal abierto', saved: '14 mar 2026', tags: ['luz natural', 'accesibilidad'], notes: '' },
    { id: 'a6', title: 'Mercado Cubierto', artist: 'Delfina Roig', type: 'espacio comercial', license: 'todos los derechos reservados', source: 'portafolio de estudio', saved: '30 abr 2026', tags: ['estructura metálica'], notes: '' },
  ]},
  { id: 'vertical', label: 'Vertical', items: [
    { id: 'a7', title: 'Torre de Ladrillo', artist: 'Emiliano Duarte', type: 'torre de oficinas', license: 'CC BY 4.0', source: 'Wikimedia Commons', saved: '05 ago 2026', tags: ['fachada ventilada'], notes: '' },
    { id: 'a8', title: 'Faro Residencial', artist: 'Nadia Ortelli', type: 'torre mixta', license: 'unknown', source: 'import manual', saved: '21 feb 2026', tags: ['mirador', 'terraza verde'], notes: '' },
  ]},
]

export default function Arquitectura() {
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

  function select(it, groupLabel) {
    setSelected({ ...it, groupLabel })
    setMoodSaved(false)
  }

  return (
    <div className="page-arquitectura">
      <div className="app">
        <header className="topbar">
          <div className="brand"><Link className="back" to="/">← Salas de Arte</Link><span className="mark">Arquitectura</span><span className="sub">— la mesa de dibujo</span></div>
          <div className="search"><input type="text" placeholder="buscar plano, autor, tag…" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="meta">{totalCount} planos archivados</div>
        </header>
        <aside className="sidebar">
          <h2>Legajos</h2>
          <ShelfList groups={GROUPS} allLabel="Todos los legajos" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="note">Cada hoja presenta una obra guardada. Click para abrir su <b>cajetín técnico</b> con datos y licencia.</div>
        </aside>
        <main className="main">
          <div className="heading">
            <div><h1>Mesa de planos</h1><p>Obras arquitectónicas recopiladas de portafolios y archivos abiertos.</p></div>
            <div className="count-tag">{visibleCount} en vista</div>
          </div>
          {visibleGroups.map((g, gi) => (
            <div className="grp" key={g.id}>
              <div className="grp-label">{g.label} · {g.items.length}</div>
              <div className="sheets">
                {g.items.map((it, i) => (
                  <button key={it.id} className="sheet" style={{ '--i': gi * 3 + i }} aria-pressed={selected?.id === it.id} onClick={() => select(it, g.label)}>
                    <span className="tape" />
                    <span dangerouslySetInnerHTML={{ __html: ICONS[hashId(it.id) % ICONS.length] }} />
                    <div className="name">{it.title}</div>
                    <div className="titleblock"><span>{it.artist}</span><span>ESC 1:100</span></div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)}>
        {selected && (
          <article className="plan-card">
            <button className="plan-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar">✕</button>
            <div className="plan-north">N ↑ ESC. VARIABLE</div>
            <h3>{selected.title}</h3>
            <p className="type">{selected.type} — por {selected.artist}</p>
            <div className="prow"><span className="k">Licencia</span><span className="v">{selected.license}</span></div>
            <div className="prow"><span className="k">Fuente</span><span className="v">{selected.source}</span></div>
            <div className="prow"><span className="k">Guardado</span><span className="v">{selected.saved}</span></div>
            <div className="prow"><span className="k">Tags</span><span className="v"><span className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</span></span></div>
            <div className="notes">{selected.notes || 'Sin notas todavía.'}</div>
            <div className="titleblock-full">
              <div><span className="lbl">Dibujado</span>{selected.artist.split(' ')[0]}</div>
              <div><span className="lbl">Revisión</span>Rev. A</div>
              <div><span className="lbl">Cat. N°</span>ARQ-{(hashId(selected.id) % 900) + 100}</div>
            </div>
            <div className="actions">
              <button className="btn-g" onClick={() => setMoodSaved(true)}>{moodSaved ? 'Añadido ✓' : 'Añadir al moodboard'}</button>
            </div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
