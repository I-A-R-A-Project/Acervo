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

## Captura de URLs para Literatura

Los extractores de Literatura cubren Open Library, Project Gutenberg, Wattpad
y Archive of Our Own. Acervo Browser también puede capturar título, autor y
descripción genéricos de la pestaña actual. Para probar fuentes, ejecutá desde
la raíz del repositorio:

```bash
python tests/add_books.py --url https://www.gutenberg.org/ebooks/2000
python tests/add_books.py --file fuentes-a-probar.txt
```

El browser abre las URLs de a una; **Save from tab** guarda cada captura en
Literatura y carga la siguiente. Las capturas de prueba se pueden quitar sin
afectar el resto del catálogo, y el catálogo se puede exportar con:

```bash
python tests/remove_books.py
python tests/dump_books.py
```

Cerrá Acervo Browser antes de ejecutar `dump_books.py`; no abras dos instancias
simultáneas. Las fuentes candidatas y APIs están documentadas en
[`docs/`](../docs/README.md).

## Shell de escritorio

Este módulo también describe la shell principal de la aplicación de escritorio.

- bootstrapping de la app
- composición del layout de escritorio
- navegación entre salas, bandeja, social y publicación
- coordinación de estado global y servicios compartidos
