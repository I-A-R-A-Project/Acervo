/**
 * Lista de categorías en la barra lateral (estantes / legajos / salas / etc.)
 * Usa siempre group.id como fuente de verdad — nunca un campo derivado —
 * así el filtro y el conteo nunca se desincronizan.
 */
export default function ShelfList({ groups, allLabel, active, onSelect, counts }) {
  const items = [{ id: 'all', label: allLabel }, ...groups.map((g) => ({ id: g.id, label: g.label }))]
  return (
    <ul className="flist" role="listbox">
      {items.map((it) => (
        <li key={it.id} role="presentation">
          <button
            role="option"
            aria-pressed={it.id === active}
            onClick={() => onSelect(it.id)}
          >
            <span className="dot" />
            {it.label}
            <span className="count">{counts[it.id] ?? 0}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
