# App de Acervo

La app web Vite multipágina vive en [`vite/`](vite/). Reúne en un solo proyecto
las salas de Arte y Ciencia, Bandeja, Social y Spam.

## Ejecutar y compilar la app Vite

Instalá las dependencias e iniciá un solo servidor desde la carpeta de la app:

```bash
cd app/vite
npm install
npm run dev
```

Abrí la URL que muestra Vite para entrar al inicio de Acervo. Para generar el
build único de producción:

```bash
npm run build
```

El build se guarda en `app/vite/dist/`. Acervo Browser sirve ese mismo build
local, así que ejecutá `npm run build` desde `app/vite/` antes de abrir el
browser.

## Secciones del prototipo

- **Salas de Arte** (`/salas-arte/`): Literatura, Arquitectura, Escultura,
  Pintura, Música, Danza, Cine, Fotografía y Videojuegos. Cómics y manga forman
  parte de Literatura. Literatura permite guardar URLs y completar metadatos.
- **Salas de Ciencia** (`/salas-ciencia/`): Física, Química, Biología,
  Astronomía, Ciencias de la Tierra, Matemática, Ciencias de la Computación y
  Medicina; las ramas usan una página común con subclasificaciones propias.
- **Bandeja** (`/bandeja/bandeja.html`): triage de contenido pendiente para
  aceptar sugerencias, reasignar salas o descartar posts.
- **Social** (`/social/social.html`): feed separado del catálogo, agrupado por
  persona y con notas privadas por publicación.
- **Spam** (`/spam.html`): sección prevista para contenido silenciado; el
  prototipo todavía no está implementado.

Las salas y las páginas de Bandeja y Social usan datos de ejemplo; todavía no
persisten en un backend.

## Importar y exportar enlaces

En Acervo Browser, **Import** captura la página de la pestaña actual y la envía
a Literatura. Mantené **Shift** al pulsarlo para abrir el diálogo de importación
y exportación múltiple: pegá enlaces `http(s)` (uno por línea), o cargá/guardá
la lista en un archivo de texto. **Exportar colección** guarda en un archivo
JSON toda la colección guardada de Literatura, incluyendo grupos, metadatos,
notas y etiquetas. **Exportar lista** guarda solo los enlaces escritos en el
diálogo como texto plano. La importación agrega los enlaces al catálogo y
extrae sus metadatos desde las páginas abiertas por el navegador, evitando
las restricciones CORS que bloquean solicitudes directas desde la app web.
Las fuentes candidatas y APIs están documentadas en [`docs/`](../docs/README.md).

Los scripts JavaScript que se ejecutan en las páginas del navegador están en
`browser_scripts/` y Acervo Browser los carga desde Python.

## Shell de escritorio

Este módulo también describe la shell principal de la aplicación de escritorio.

- bootstrapping de la app
- composición del layout de escritorio
- navegación entre salas, bandeja, social y publicación
- coordinación de estado global y servicios compartidos
