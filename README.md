# ArtVision

ArtVision es un concepto para un espacio de descubrimiento y publicación de arte.
La idea es recolectar obras desde múltiples fuentes web, revisarlas en una app
clara de escritorio, organizar colecciones y ayudar a un artista a publicar la
misma obra en varias redes sociales sin repetir trabajo manual.

## Idea central

Esta app debe funcionar como un hub visual de investigación y publicación para
creadores. Un usuario podría:
- navegar arte desde varias fuentes en un solo lugar
- guardar piezas en colecciones y moodboards
- revisar metadatos, tags, fuentes y contexto de licencia
- comparar piezas por estilo, medio y tema
- programar o publicar una pieza en varias redes a la vez
- mantener un archivo de referencias y portfolio personal

## Las 10 bellas artes

* Arquitectura: Diseño artístico de espacios habitables y monumentales.
* Escultura: Modelado de volúmenes en materiales sólidos.
* Pintura: Representación gráfica mediante pigmentos y lienzos.
* Música: Composición sonora expresiva en el tiempo.
* Literatura: Expresión estética por medio del lenguaje escrito.
* Danza: Movimiento corporal rítmico con fines artísticos.
* Cine: Narración visual y auditiva mediante metrajes.
* Fotografía: Captura estética de la luz y la realidad.
* Cómics: Narración secuencial mediante dibujos y viñetas.
* Videojuegos: Capacidad de mezclar disciplinas anteriores con la participación activa del jugador.

Esta lista sirve como marco para categorías de contenido, tags, colecciones y
flujo editorial dentro de la app.

## Usuario objetivo

Usuario principal: personas que consumen arte, coleccionan referencias,
exploran inspiración visual y también pueden crear o publicar contenido.
Incluye artistas, ilustradores, concept artists, fotógrafos, diseñadores,
creadores digitales, curadores, comunidad de fanart y usuarios que simplemente
gustan de explorar arte y guardar ideas.

La app debe ayudarlo a:
- recopilar inspiración desde varios sitios web
- construir tableros y bibliotecas de referencia
- generar captions y variantes de publicación
- publicar la misma obra en varias redes
- llevar seguimiento del portfolio y campañas sociales
- guardar arte de interés personal sin necesidad de ser artista profesional

## Forma del producto

### 1. Capa de descubrimiento

La app reúne arte desde varias fuentes como:
- Behance
- ArtStation
- Dribbble
- DeviantArt
- Unsplash
- Wikimedia Commons
- Pinterest
- museos y galerías
- portfolios de artistas curados
- feeds RSS y JSON de blogs y publicaciones

### 2. Capa de colecciones

Los usuarios pueden crear tableros como:
- inspiración
- portfolio personal
- referencias de campaña
- estudios por medio
- moodboards por color o tema
- conceptos listos para cliente

### 3. Capa de visor

Un visor centrado en media debe soportar:
- miniaturas e imágenes a tamaño completo
- zoom y recorte para obras
- overlays de metadata
- notas y tags
- comparación lado a lado
- manejo de arte local y remoto

### 4. Capa de publicación

Esta es la parte productiva para artistas. La app debe permitir publicar la
misma obra en varios canales, por ejemplo:
- Instagram
- Threads
- X / Twitter
- Pinterest
- Facebook
- LinkedIn
- Behance
- Bluesky
- TikTok
- YouTube Shorts

Cada red debe tener un adaptador propio con:
- generación de draft
- plantillas de título y caption
- reglas de tamaño/formato
- campos de alt text y descripción
- programación de publicación
- cola y reintentos

## Arquitectura MVP

```text
ArtVision/
├── app/                     # shell principal de la app
├── discovery/               # crawlers y adapters por fuente
├── models/                  # esquema de metadatos del arte
├── storage/                 # SQLite / JSON local
├── viewer/                  # galería, visor y tableros
├── publisher/               # orquestación de cross-post
├── social/                  # adapters de redes
├── scheduler/               # posts programados y drafts
├── ui/                      # capa UI de escritorio
├── README.md                # plan del producto
└── roadmap.md               # milestones inmediatos
```

## Modelo de datos central

Cada pieza debe normalizarse a un esquema común como:

```json
{
  "id": "source:slug-or-uuid",
  "title": "Moonlit study",
  "artist": "Ari Vega",
  "medium": "digital painting",
  "category": "painting",
  "source_url": "https://example.com/art/123",
  "image_url": "https://example.com/images/123.jpg",
  "tags": ["portrait", "atmospheric", "concept art"],
  "license": "unknown",
  "notes": "Reference for the new series",
  "saved_at": "2026-08-29T00:00:00Z"
}
```

Esto permite mezclar fuentes sin romper el visor ni el sistema de publicación.

## Estrategia de ingesta de fuentes

La plataforma debería soportar varias estrategias de colección:
- crawling directo desde páginas públicas
- ingesta por RSS
- adapters de API para plataformas soportadas
- import manual por parte del usuario
- bookmarklet o extensión para capturar rápido

Regla: los datos recolectados deben normalizarse antes de entrar a la librería.

## Roadmap recomendado

### Fase 1: biblioteca de investigación
- lista de fuentes y adapters
- guardar imagen + metadata
- tags y colecciones
- visor local
- búsqueda por título, artista, medio y tag

### Fase 2: workspace para creadores
- creación de tableros
- comparación lado a lado
- notas y comentarios
- exportación de referencias y moodboards
- links guardados con atribución de fuente

### Fase 3: publicación social
- sistema de adapters por plataforma
- plantillas de captions
- publicación programada
- variantes por red
- flujo de aprobación de contenido

### Fase 4: automatización de portfolio
- mini-páginas automáticas de portfolio
- calendario de publicaciones
- resumenes de analítica
- seguimiento de piezas mejor rankeadas

## Diseño de publicación social

Cada plataforma debe definir:
- tipos de media aceptados
- reglas de formato/aspect ratio
- máximo de caption
- metadata requerida
- manejo de login/sesión
- permisos de publicación

Adaptadores ejemplo:
- Instagram API / Graph API wrapper
- cliente de X API
- adaptador de Pinterest API
- integración de LinkedIn
- soporte para Bluesky o Mastodon
- soporte para portfolio en Behance

La app debe poner posts en cola y conservar un estado por plataforma:
- draft
- queued
- scheduled
- published
- failed
- retry pending

## Modelo UX

Un layout útil de escritorio sería:
- sidebar izquierda: fuentes, colecciones y tableros
- centro: feed o grilla de galería
- panel derecho: metadata de la obra y acciones de publicación
- dock inferior: cola de posts activos

Esto mantiene la app útil tanto para investigación como para publicación.

## Riesgos y guardrails

- la licencia y atribución deben ser claras
- el scraping debe respetar robots.txt y TOS
- no debe publicarse nada sin aprobación del usuario por cada red
- guardar credenciales de API en una config local segura, no en el repo

## Recomendación

Construir esto como una app desktop con una capa sólida de metadata y
adaptadores flexibles por fuente. Lo importante no es solo recolectar arte,
sino normalizarlo en una librería reutilizable que pueda alimentar tanto el
visor como el pipeline de publicación.

Esto le da a IARA una línea creativa real: descubrimiento visual,
recolección y distribución multi-plataforma para artistas.
