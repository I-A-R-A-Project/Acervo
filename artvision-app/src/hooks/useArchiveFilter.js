import { useMemo, useState } from 'react'

/**
 * Filtro compartido por categoría (grupo/estante/sala/etc.) y por búsqueda.
 *
 * Ojo con el bug que tenían las versiones en HTML estático: filtraban
 * `group.items` (los arrays originales, sin el campo groupId) contra
 * `item.groupId` — que solo existía en la copia aplanada `allItems`.
 * Resultado: elegir "todos" funcionaba (no depende de groupId) pero
 * cualquier categoría específica quedaba vacía.
 *
 * Acá el filtro por categoría se resuelve una sola vez, sobre la lista
 * de grupos original (por group.id, que siempre existe), y la búsqueda
 * se aplica después sobre esos mismos items — sin depender de ningún
 * campo derivado.
 */
export function useArchiveFilter(groups) {
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
            it.artist.toLowerCase().includes(q) ||
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
