import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBranch } from '../data/scienceData.js'
import { useCatalogFilter } from '../hooks/useCatalogFilter.js'
import { hashId } from '../hooks/hashId.js'
import ShelfList from '../components/ShelfList.jsx'
import DetailDrawer from '../components/DetailDrawer.jsx'
import './SciencePage.css'

const FONTS = 'Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600'

const TYPE_LABEL = {
  concepto: 'Concepto',
  experimento: 'Experimento',
  articulo: 'Artículo',
  video: 'Video',
}

function codeFor(item, branch) {
  const shelfCode = item.groupLabel.slice(0, 3).toUpperCase()
  const num = (hashId(item.id) % 900) + 100
  return `${branch.code}/${shelfCode} ${num}.${item.id.slice(-2)}`
}

export default function SciencePage() {
  const { branchId } = useParams()
  const branch = getBranch(branchId)
  const { active, setActive, query, setQuery, visibleGroups, visibleCount, totalCount, countsByGroup } =
    useCatalogFilter(branch ? branch.groups : [])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${FONTS}&display=swap`
    document.head.appendChild(link)
    return () => document.head.removeChild(link)
  }, [])

  useEffect(() => {
    setSelected(null)
  }, [branchId])

  if (!branch) {
    return (
      <div className="page-science" style={{ padding: 40, color: '#EDEDED', background: '#0B0C0E', minHeight: '100%' }}>
        <p>No existe esa sala.</p>
        <Link to="/">← Volver</Link>
      </div>
    )
  }

  const open = !!selected
  const cssVars = {
    '--accent': branch.accent,
    '--bg-from': branch.from,
    '--bg-to': branch.to,
  }

  return (
    <div className="page-science" style={cssVars}>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <Link className="back" to="/">← Salas de Ciencia</Link>
            <span className="mark">{branch.name}</span>
            <span className="room-title">— {branch.tag}</span>
          </div>
          <div className="search" role="search">
            <input
              type="text"
              placeholder="Buscar por título, fuente o tag…"
              aria-label="Buscar en el catálogo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="topbar-meta">{totalCount} ítems catalogados</div>
        </header>

        <aside className="sidebar">
          <p className="subtitle">{branch.subtitle}</p>
          <h2>Subclasificaciones</h2>
          <ShelfList groups={branch.groups} allLabel="Todas" active={active} onSelect={setActive} counts={countsByGroup} />
          <div className="card-index">
            Cada ficha es un ítem de referencia.<br />
            Hacé clic para ver su <b>detalle</b> completo.
          </div>
        </aside>

        <main className="main">
          <div className="main-heading">
            <div>
              <h1>Catálogo</h1>
              <p>Conceptos, experimentos y artículos organizados por subclasificación.</p>
            </div>
            <div className="result-count">{visibleCount} en vista</div>
          </div>

          {visibleGroups.map((group) => (
            <div className="shelf-unit" key={group.id}>
              <div className="shelf-unit-label">{group.label} · {group.items.length}</div>
              <div className="card-row">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className="spec-card"
                    aria-pressed={selected?.id === item.id}
                    onClick={() => setSelected(item)}
                  >
                    <span className="spec-type">{TYPE_LABEL[item.type] || item.type}</span>
                    <span className="spec-title">{item.title}</span>
                    <span className="spec-source">{item.source}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {visibleCount === 0 && <div className="empty-state">No hay ítems en esta subclasificación todavía.</div>}
        </main>
      </div>

      <DetailDrawer open={open} onClose={() => setSelected(null)}>
        {selected && (
          <article className="catalog-card">
            <button className="card-close" data-autofocus onClick={() => setSelected(null)} aria-label="Cerrar ficha">✕</button>
            <span className="guide-tab">{selected.groupLabel}</span>
            <div className="call-number">{codeFor(selected, branch)}</div>
            <h3>{selected.title}</h3>
            <p className="by">{selected.source}</p>
            <div className="field-row"><span className="k">Tipo</span><span className="v">{TYPE_LABEL[selected.type] || selected.type}</span></div>
            <div className="field-row"><span className="k">Rama</span><span className="v">{branch.name} — {selected.groupLabel}</span></div>
            <div className="field-row"><span className="k">Nivel</span><span className="v">{selected.level}</span></div>
            <div className="field-row"><span className="k">Tags</span><span className="v"><span className="tag-row">{selected.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</span></span></div>
            <div className="notes-block">{selected.summary}</div>
          </article>
        )}
      </DetailDrawer>
    </div>
  )
}
