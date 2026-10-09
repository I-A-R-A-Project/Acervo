# Acervo

Acervo es un programa de escritorio para descubrir, guardar y organizar
obras, publicaciones y artículos sobre arte y ciencia en un mismo lugar, con la posibilidad
de sumar automáticamente lo que aparece mientras navegás redes sociales, sin
perder el control manual de qué entra a la colección.

## Idea central

El usuario navega por internet y por redes sociales de todos modos. Acervo
no reemplaza esa navegación: la acompaña, capturando lo que vale la pena
guardar y ordenándolo solo, en la medida de lo posible, para que después sea
fácil de volver a encontrar. Lo que no puede ordenar solo, lo deja en una
bandeja para que la persona decida.

Tres formas de que algo entre a Acervo:

1. **Manual** — pegar una URL o cargar un ítem a mano, como ya funciona hoy
   en la sala de Literatura.
2. **Bandeja** — un scraping lento y no autónomo de redes sociales que
   propone una sala y subclasificación con un porcentaje de confianza; la
   persona acepta, reasigna o descarta.
3. **Social** — posts de amigos y conocidos, que no se intentan encajar en
   ninguna sala de arte o ciencia porque no son ese tipo de contenido; viven
   en su propio feed, agrupados por persona, con espacio para notas.

## Usuario objetivo

Personas que consumen arte y ciencia, exploran inspiración o simplemente
quieren guardar posts, artículos y obras para volver a encontrarlos. Incluye
artistas, ilustradores, concept artists, fotógrafos,
diseñadores, creadores digitales, curadores, estudiantes, gente que sigue de
cerca alguna rama de la ciencia por interés propio, y usuarios que
simplemente disfrutan explorar y guardar ideas sin ser profesionales de
nada de esto.

Acervo debe ayudarlo a:
- descubrir obras, posts y artículos desde varias fuentes
- organizar colecciones y tableros de arte y ciencia
- llevar un archivo personal navegable, sin depender de los buscadores
  internos de cada red o sitio
- guardar contenido de interés sin necesidad de ser artista o científico
  profesional
- eventualmente, generar variantes de publicación para arte propio (ver
  "Capa de publicación" más abajo)

## Las secciones

- **[Salas de Artes](./Salas%20de%20Artes.md)** — nueve salas,
  cada una con su propia metáfora visual y ficha de detalle.
- **[Salas de Ciencia](./Salas%20de%20Ciencia.md)** — ocho ramas de la
  ciencia, cada una con sus propias subclasificaciones.
- **Bandeja** — posts que el scraping no pudo ubicar con confianza en
  ninguna sala; triage manual con aceptar / reasignar / descartar.
- **Social** — posts de amigos y conocidos, separados de los catálogos de
  arte y ciencia.
- **Spam** — anuncios o post con palabras/tags silenciadas

## Forma del producto

### 1. Capa de descubrimiento

Acervo reúne obras, publicaciones y artículos desde varias fuentes, según la sala:

- **Arte**: Behance, ArtStation, Dribbble, DeviantArt, Unsplash, Wikimedia
  Commons, Pinterest, museos y galerías, portfolios de artistas curados,
  feeds RSS/JSON de blogs y publicaciones.
- **Ciencia**: Wikipedia, repositorios de artículos de divulgación,
  Wikimedia Commons, canales y blogs de divulgación científica, feeds
  RSS/JSON de revistas y medios especializados.
- **Redes sociales** (vía Bandeja y Social): Instagram, X/Twitter, Reddit,
  Tumblr, Pinterest — con scraping lento y no autónomo, respetando las
  políticas de cada plataforma.

### 2. Capa de colecciones

Dentro de cada sala, y también cruzando salas, el usuario puede armar
tableros como:
- inspiración
- obras, publicaciones o artículos de un proyecto o campaña
- estudios por medio o por subclasificación
- moodboards por color, tema o nivel de dificultad (en ciencia)
- ítems listos para retomar o profundizar

### 3. Capa de visor

Un visor centrado en el contenido de cada ítem debe soportar:
- miniaturas y vista a tamaño completo
- zoom y recorte para imágenes
- overlays de metadata (fuente, licencia, tags)
- notas personales por ítem
- comparación lado a lado
- manejo de contenido guardado local y remoto

### 4. Capa de publicación

Para las Salas de Artes en particular, Acervo debería permitir que un
artista publique su propia obra en varias redes a la vez, sin repetir el
trabajo de subirla manualmente a cada una:

- Instagram, Threads, X/Twitter, Pinterest, Facebook, LinkedIn, Behance,
  Bluesky, TikTok, YouTube Shorts

Cada red necesitaría un adaptador propio con:
- generación de borrador (draft)
- plantillas de título y caption
- reglas de tamaño/formato por plataforma
- campos de alt text y descripción
- programación de publicación, cola y reintentos
- estado por plataforma: draft, queued, scheduled, published, failed, retry
  pending

Esta capa es la única pensada para *publicar* en vez de *coleccionar* —
conviene tratarla como una sección aparte, separada de las salas de
descubrimiento.

### Estrategia de ingesta de fuentes

Varias estrategias conviven, y los datos deben normalizarse al modelo común
antes de entrar a cualquier sala:
- crawling directo desde páginas públicas, respetando robots.txt y ToS
- ingesta por RSS
- adaptadores de API para plataformas soportadas
- import manual por parte del usuario
- scraping lento de redes sociales (Bandeja y Social)

## Arquitectura propuesta

```text
Acervo/
├── app/                     # shell principal de la app de escritorio
├── salas-arte/              # las 9 salas de arte
├── salas-ciencia/           # las 8 salas de ciencia (una por disciplina)
├── bandeja/                 # triage de posts sin clasificar
├── social/                  # feed de posts de amigos y conocidos
├── discovery/               # scraping lento de redes + adapters por fuente
├── models/                  # esquema de metadatos común a todos los ítems
├── storage/                 # SQLite / JSON local
├── viewer/                  # galería, visor y fichas de detalle compartidas
├── publishing/              # adapters de publicación cruzada (capa 4, obra propia)
├── ui/                      # componentes UI compartidos (drawer, shelf list, filtros)
├── docs/                    # fuentes candidatas y documentación de APIs
├── README.md                # este archivo
├── Salas de Artes.md
├── Salas de Ciencia.md
└── roadmap.md
```

`salas-arte` y `salas-ciencia` reutilizan los mismos componentes de `ui/`
(la lista de subclasificaciones, el panel de detalle, el buscador) en vez de
duplicar la lógica por disciplina — ya es así en los prototipos actuales de
ambas. `publishing/` queda separado de `social/` a propósito: `social/` es
el feed de amigos y conocidos (consumo), `publishing/` son los adapters
para subir obra propia (producción).

## Modelo de datos común

Todo ítem, sin importar de qué sala o sección venga, se normaliza a un
esquema compartido antes de guardarse:

```json
{
  "id": "source:slug-or-uuid",
  "title": "...",
  "origin": "manual | bandeja | social",
  "room": "arte:pintura | ciencia:astronomia | null",
  "subclassification": "...",
  "source": "autor, publicación o plataforma",
  "source_url": "https://...",
  "type": "obra | concepto | experimento | articulo | video | post",
  "tags": ["..."],
  "license": "CC BY 4.0 | unknown | ...",
  "notes": "",
  "saved_at": "2026-09-13T00:00:00Z"
}
```

`room` queda en `null` para los ítems que caen en Social, ya que
deliberadamente no se clasifican como arte o ciencia.

## Modelo UX

Un layout de escritorio útil, compartido por las salas:
- sidebar izquierda: subclasificaciones (o, en el caso de Social,
  personas) y colecciones
- centro: grilla o feed de ítems
- panel derecho (drawer): ficha de detalle del ítem seleccionado y sus
  acciones
- dock inferior, solo en la capa de publicación: cola de posts activos

## Guardrails

- El scraping de redes sociales es lento y no completamente autónomo, para
  no infringir las políticas de las plataformas ni disparar sus sistemas
  anti-bot.
- La licencia y la fuente de cada ítem de arte deben quedar registradas,
  aunque sea como "unknown", para no perder la atribución con el tiempo.
- El scraping y crawling directo debe respetar robots.txt y los términos de
  servicio de cada fuente.
- No debe publicarse nada en ninguna red sin aprobación explícita del
  usuario, ítem por ítem y red por red.
- Las credenciales de API se guardan en una configuración local segura,
  nunca en el repositorio.

El plan de fases para construir todo esto vive en [roadmap.md](./roadmap.md).
