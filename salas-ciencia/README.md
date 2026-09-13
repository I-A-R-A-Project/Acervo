# Salas de Ciencia — prototipo de UI

Proyecto React (Vite + React Router), hermano de Salas de Arte, con una página
temática por cada rama de la ciencia, navegable desde la home.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto http://localhost:5173).

## Estructura

- `src/data/scienceData.js` — datos de ejemplo (mock): 8 ramas (Física,
  Química, Biología, Astronomía, Ciencias de la Tierra, Matemática,
  Ciencias de la Computación, Medicina), cada una con sus propias
  subclasificaciones e ítems.
- `src/pages/SciencePage.jsx` — página genérica que renderiza cualquier
  rama a partir del parámetro de ruta `/:branchId`, así no hay que
  duplicar una página por ciencia.
- `src/hooks/useCatalogFilter.js` — filtro de búsqueda + subclasificación,
  compartido por todas las ramas.
- `src/components/DetailDrawer.jsx` — panel lateral genérico (abrir/cerrar,
  foco, tecla Escape) que se rellena con la ficha del ítem seleccionado.

## Notas

- Es una versión simple/visual: sin formulario para agregar ítems ni
  scraping de metadatos desde URLs (a diferencia de Salas de Arte). Los datos
  están fijos en `scienceData.js`, listos para reemplazar por datos reales
  de un backend.
- Para agregar una rama nueva alcanza con sumar un objeto a `BRANCHES` en
  `scienceData.js` — la página y las rutas se generan solas.
