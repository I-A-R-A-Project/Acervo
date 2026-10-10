# Fuentes: Literatura

Esta sala incluye **libros, cómics, manga, webcómics, fanfiction y ficción
serializada**. Cómics y manga no tienen sala separada. Para obras de usuarios o
con copyright, guardar enlaces y metadatos; no descargar ni redistribuir sin
permiso.

| Fuente | URL | Tipo / notas |
|---|---|---|
| Project Gutenberg | https://www.gutenberg.org/ | Libros digitales; comprobar jurisdicción y derechos de cada obra. |
| Standard Ebooks | https://standardebooks.org/ebooks | Ediciones de libros de dominio público; revisar licencia de edición. |
| Biblioteca Virtual Miguel de Cervantes | https://www.cervantesvirtual.com/ | Literatura e investigación hispánica; derechos por obra. |
| Wikisource | https://es.wikisource.org/wiki/Portada | Textos libres o de dominio público según la obra. |
| Internet Archive — textos | https://archive.org/details/texts | Catálogo de textos; acceso y derechos son por ítem. |
| Open Library | https://openlibrary.org/ | Catálogo y préstamo digital sujeto a disponibilidad. |
| MangaDex | https://mangadex.org/ | Catálogo de manga y capítulos aportados por grupos; disponibilidad y derechos varían por obra. |
| MANGA Plus by SHUEISHA | https://mangaplus.shueisha.co.jp/ | Lectura oficial; disponibilidad por región y obra. |
| WEBTOON | https://www.webtoons.com/ | Cómics digitales y webcómics. |
| Comic Book Plus | https://comicbookplus.com/ | Archivo de cómics históricos; confirmar derechos por ejemplar. |
| Archive of Our Own (AO3) | https://archiveofourown.org/ | Fanfiction y obras transformativas de autores. |
| Wattpad | https://www.wattpad.com/ | Ficción serializada y obras de usuarios. |
| FanFiction.net | https://www.fanfiction.net/ | Fanfiction; respetar términos de uso. |
| Royal Road | https://www.royalroad.com/ | Ficción serializada de autores independientes. |

## Descubrimiento, feeds y apoyo a las fuentes

La sala de Literatura ofrece una pestaña de descubrimiento y mantiene la
colección personal en su propia pestaña. Los enlaces siguientes son accesos
oficiales; los directorios de feeds y páginas informativas no se tratan como
si fueran publicaciones RSS. El feed de noticias de AO3 se puede leer desde
`https://archiveofourown.org/admin_posts.rss`; el contenido de otros feeds
puede depender de una selección desde sus directorios oficiales.

| Fuente | Catálogo / publicaciones | Descargas | Ayuda, políticas o feeds | Donación |
|---|---|---|---|---|
| Standard Ebooks | [Ebooks](https://standardebooks.org/ebooks) · [Blog](https://standardebooks.org/blog) · [Blog RSS/Atom](https://standardebooks.org/feeds/atom/blog) | [Descargas masivas](https://standardebooks.org/bulk-downloads) · la página de cada libro ofrece opciones de descarga | [Nuevos lanzamientos RSS/Atom](https://standardebooks.org/feeds/atom/new-releases) · [OPDS](https://standardebooks.org/feeds/opds) (OPDS 2.0 vía `Accept: application/opds+json`; acceso Patrons Circle) · [Feeds y condiciones de acceso](https://standardebooks.org/feeds) · [Ayuda](https://standardebooks.org/help) | [Donar](https://standardebooks.org/donate) |
| Archive of Our Own (AO3) | [Noticias RSS](https://archiveofourown.org/admin_posts.rss) | La descarga de obras depende de sus autores y opciones del sitio | [AO3](https://archiveofourown.org/) | [Donar](https://archiveofourown.org/donate) |
| Open Library / Internet Archive | [Developer Center](https://openlibrary.org/developers) | Préstamo o acceso depende de cada registro | [Open Library](https://openlibrary.org/) | [Apoyar Open Library](https://archive.org/donate/?platform=ol&origin=olwww-TopNavDonateButton) |
| Project Gutenberg | [Catálogo](https://www.gutenberg.org/) | Las descargas aparecen en la página de cada ebook; verificar jurisdicción y derechos | [RSS diario](https://www.gutenberg.org/cache/epub/feeds/today.rss) · [Catálogo OPDS](https://www.gutenberg.org/ebooks/search.opds/) · [Feeds y catálogos offline](https://www.gutenberg.org/ebooks/offline_catalogs.html) · [Política de enlaces](https://www.gutenberg.org/policy/linking.html) · [Política de robots](https://www.gutenberg.org/policy/robot_access.html) | [Donar](https://www.gutenberg.org/donate/) |

Los botones de descarga conducen a páginas oficiales de opciones de descarga;
no automatizan la descarga de libros. Las licencias y disponibilidad se deben
confirmar por obra. Para evitar CORS, la sala solicita los feeds desde rutas
locales `/api/feeds/...`: Vite reenvía esas rutas en desarrollo/preview y el
servidor local de Acervo Browser las reenvía a sus orígenes con el tipo
`Accept` requerido. La máquina debe poder conectarse a las fuentes.
Standard Ebooks indica que los feeds de nuevos lanzamientos RSS/Atom son
públicos; el catálogo OPDS requiere acceso de Patrons Circle u otras formas
de contribución. Project Gutenberg ofrece RSS diario y un catálogo OPDS XML;
su OPDS 2 JSON sigue siendo experimental y requiere acceso.

## APIs relacionadas

- [MangaDex API](apis.md#apis-y-documentación-oficial): API para explorar el
  catálogo de manga y sus metadatos. Consultar su documentación oficial vigente
  sobre endpoints, límites y autenticación; no redistribuir capítulos.
- [Open Library](apis.md#apis-y-documentación-oficial): búsqueda y consulta de
  metadatos bibliográficos. No usar para extracción masiva ni como backend de
  alto tráfico.
- [Internet Archive](apis.md#apis-y-documentación-oficial): búsqueda y
  metadatos de textos; los derechos, préstamos y descargas dependen del ítem.
