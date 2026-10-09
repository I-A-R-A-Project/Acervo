# Salas de Arte — prototipos de UI

Proyecto React (Vite + React Router) con una página temática para cada una de las nueve salas de arte, navegable desde
la home.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto http://localhost:5173).

## Estructura

- `src/pages/` — una página por arte (Literatura, Arquitectura, Escultura,
  Pintura, Música, Danza, Cine, Fotografía, Videojuegos) + Home. Cómics y
  manga forman parte de Literatura.
- `src/hooks/useArchiveFilter.js` — filtro de búsqueda + categoría,
  compartido por todas las páginas.
- `src/components/DetailDrawer.jsx` — panel lateral genérico (abrir/cerrar,
  foco, tecla Escape) que cada página rellena con su propia ficha temática.

## Notas

- Todo lo relacionado a "cola de publicación" / cross-posting fue
  removido a propósito — se va a construir como una página separada.
- Los datos de cada arte son de ejemplo (mock), listos para reemplazar
  por datos reales del backend de Salas de Arte.

## Guardado por URL y pruebas de fuentes

Literatura permite guardar una URL y completar metadatos manualmente. Al pegar
una URL, los extractores específicos cubren Open Library, Project Gutenberg,
Wattpad y Archive of Our Own; **Save from tab** en Acervo Browser también
captura título, autor y descripción genéricos cuando están disponibles.
Las fuentes candidatas por sala y la documentación de APIs oficiales están en
[`docs/`](../docs/README.md). Cómics y manga se incluyen en Literatura.

Antes de usar Acervo Browser por primera vez, generar los `dist` de ambas salas:

```bash
cd salas-arte
npm run build
cd ../salas-ciencia
npm run build
cd ..
```

Para probar una o más fuentes, pasar URLs directamente o un archivo UTF-8 con
una URL por línea:

```bash
python tests/add_books.py --url https://www.gutenberg.org/ebooks/2000 --url https://archiveofourown.org/works/...
python tests/add_books.py --file fuentes-a-probar.txt
```

El script abre esas páginas en Acervo Browser de a una: después de cada
captura, **Save from tab** la guarda en la sala Literatura y carga la próxima
fuente de la cola.
Las capturas de este flujo quedan marcadas como lote de prueba; para borrarlas
sin afectar los otros registros:

```bash
python tests/remove_books.py
```

Para exportar el catálogo guardado:

```bash
python tests/dump_books.py
```

Los servidores locales usan puertos estables para compartir el mismo origen y
perfil persistente entre el browser y los scripts. Cerrá Acervo Browser antes
de ejecutar `dump_books.py`; no abras dos instancias simultáneas.
