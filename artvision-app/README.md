# ArtVision — prototipos de UI

Proyecto React (Vite + React Router) con una página temática por cada
una de las 10 bellas artes, navegable desde la home.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto http://localhost:5173).

## Estructura

- `src/pages/` — una página por arte (Literatura, Arquitectura, Escultura,
  Pintura, Música, Danza, Cine, Fotografía, Cómics, Videojuegos) + Home.
- `src/hooks/useArchiveFilter.js` — filtro de búsqueda + categoría,
  compartido por todas las páginas.
- `src/components/DetailDrawer.jsx` — panel lateral genérico (abrir/cerrar,
  foco, tecla Escape) que cada página rellena con su propia ficha temática.

## Notas

- Todo lo relacionado a "cola de publicación" / cross-posting fue
  removido a propósito — se va a construir como una página separada.
- Los datos de cada arte son de ejemplo (mock), listos para reemplazar
  por datos reales del backend de ArtVision.

## Importar links reales de literatura

`books.txt` contiene URLs de libros y publicaciones para revisar en la sala de
Literatura. Desde la raíz del repositorio se pueden abrir en la aplicación con:

```bash
python scripts/add_books.py
```

El script abre una pestaña del navegador Qt por cada link, espera a que la
página termine de renderizarse y guarda automáticamente los metadatos
disponibles en el estante de poesía. AO3 tiene una espera adicional de 30
segundos para permitir que termine su captcha temporizado; si todavía aparece
el desafío, resolvelo en esa pestaña y usá `Save from tab`. Para quitar
automáticamente únicamente ese lote:

```bash
python scripts/remove_books.py
```

Para exportar exactamente cómo están guardados actualmente los libros (sin
modificarlos), cerrá ArtVision y ejecutá:

```bash
python scripts/dump_books.py
```

El script genera `books-dump-YYYYMMDD-HHMMSS.json` en la raíz. También se puede
indicar otro destino con `python scripts/dump_books.py --output ruta/salida.json`.

Los scripts requieren que la app pueda ejecutarse con PyQt6 y que exista una
versión compilada en `artvision-app/dist` (`npm run build`).
