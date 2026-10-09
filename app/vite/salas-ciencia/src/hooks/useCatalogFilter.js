import { useMemo, useState } from 'react'

/**
 * Filtro compartido por subclasificación (grupo) y por búsqueda libre.
 * El filtro por grupo se resuelve sobre la lista original (por group.id,
 * que siempre existe) y la búsqueda se aplica después sobre esos mismos
 * ítems, buscando en título, fuente y tags.
 */
export function useCatalogFilter(groups) {
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')

  const allItems = useMemo(
    () => groups.flatMap((g) => g.items.map((it) => ({ ...it, groupId: g.id, groupLabel: g.label }))),
    [groups]
  )

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = active === 'all' ? groups : groups.filter((g) => g.id === active)
    return base
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => {
          if (!q) return true
          return (
            it.title.toLowerCase().includes(q) ||
            it.source.toLowerCase().includes(q) ||
            it.tags.some((t) => t.toLowerCase().includes(q))
          )
        }),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, active, query])

  const countsByGroup = useMemo(() => {
    const counts = { all: allItems.length }
    groups.forEach((g) => { counts[g.id] = g.items.length })
    return counts
  }, [groups, allItems])

  const visibleCount = visibleGroups.reduce((sum, g) => sum + g.items.length, 0)

  return {
    active, setActive,
    query, setQuery,
    visibleGroups, visibleCount,
    totalCount: allItems.length,
    countsByGroup,
  }
}
