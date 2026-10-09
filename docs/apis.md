# APIs y documentación oficial

Índice de APIs potencialmente útiles para las nueve salas de arte. Los enlaces
apuntan a documentación o portales oficiales; no hay integraciones implementadas
por este documento. “Gratis” describe el acceso al servicio/API, no los derechos
de uso de las obras devueltas. Volver a revisar condiciones y límites antes de
integrar.

| API | Salas | Acceso y requisitos conocidos | Documentación oficial |
|---|---|---|---|
| [MangaDex API](https://api.mangadex.org/docs/) | Literatura (manga) | API pública para catálogo y metadatos; comprobar documentación vigente para autenticación, límites y permisos de cada recurso. La API no concede licencia para redistribuir capítulos. | [API docs](https://api.mangadex.org/docs/) |
| [Open Library](https://openlibrary.org/developers/api) | Literatura (libros) | API pública sin clave para consultas de lectura/discovery. Identificar la aplicación con `User-Agent` y contacto, cachear y evitar tráfico masivo; no usar como backend de alto tráfico. | [Developer Center](https://openlibrary.org/developers/api) · [API interactiva](https://openlibrary.org/docs) |
| [Art Institute of Chicago](https://api.artic.edu/docs/) | Escultura, Pintura, Arquitectura | API pública de colecciones en JSON; la guía documenta consulta, búsqueda y paginación. Revisar derechos/licencia del registro e imagen por separado. | [API docs](https://api.artic.edu/docs/) · [Open Access](https://www.artic.edu/open-access/public-api) |
| [The Met Collection API](https://metmuseum.github.io/) | Escultura, Pintura, Arquitectura | API sin registro ni clave; la colección Open Access indicada por el museo puede reutilizarse bajo CC0. La API también contiene registros/imágenes que no son Open Access: comprobar cada registro. | [API docs](https://metmuseum.github.io/) · [Open Access](https://github.com/metmuseum/openaccess) |
| [Smithsonian Open Access API](https://www.si.edu/openaccess/devtools) | Escultura, Arquitectura, Pintura | Acceso gratuito a datos Open Access; requiere solicitar una clave API. La cobertura y derechos dependen de cada objeto. | [Developer tools](https://www.si.edu/openaccess/devtools) · [Open Access](https://www.si.edu/openaccess) |
| [Wikimedia Commons API](https://www.mediawiki.org/wiki/Commons:API) | Arquitectura, Escultura, Pintura, Danza, Fotografía | API de lectura pública; no requiere clave para consultas públicas ordinarias. Respetar políticas de uso, atribución y la licencia individual de cada archivo. | [Commons API](https://www.mediawiki.org/wiki/Commons:API) · [API general](https://www.mediawiki.org/wiki/API:Main_page) |
| [Europeana APIs](https://pro.europeana.eu/page/apis) | Arquitectura, Escultura, Pintura, Danza, Fotografía | Portal de APIs de patrimonio cultural. Revisar registro/clave y condiciones vigentes antes de usar; los derechos varían por objeto proveedor. | [API portal](https://pro.europeana.eu/page/apis) |
| [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) | Música | API de metadatos, sin clave para consultas de lectura; uso gratuito no comercial. Requiere `User-Agent` descriptivo y máximo de una solicitud por segundo por aplicación. | [API docs](https://musicbrainz.org/doc/MusicBrainz_API) · [Rate limiting](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting) |
| [Bandcamp Developer](https://bandcamp.com/developer) | Música | Documentación para desarrolladores; confirmar disponibilidad de API, aprobación y condiciones de acceso actuales. | [Developer](https://bandcamp.com/developer) |
| [SoundCloud API](https://developers.soundcloud.com/docs/api/guide) | Música | Guía oficial de API; revisar registro de aplicación, permisos, límites y disponibilidad vigentes. | [API guide](https://developers.soundcloud.com/docs/api/guide) |
| [Spotify Web API](https://beta.developer.spotify.com/documentation/web-api/) | Música | Documentación Web API; revisar acceso de desarrolladores, OAuth, cuotas y políticas vigentes. | [Web API docs](https://beta.developer.spotify.com/documentation/web-api/) |
| [Internet Archive Metadata / Search](https://archive.org/developers/) | Literatura, Danza, Cine, Videojuegos | APIs públicas para buscar e inspeccionar metadatos de ítems. Los derechos y restricciones son específicos de cada ítem; evitar descargas masivas. | [Developer docs](https://archive.org/developers/) · [Advanced Search API](https://archive.org/advancedsearch.php) |
| [TMDB API](https://developer.themoviedb.org/docs/getting-started) | Cine | API gratuita bajo sus condiciones de uso, para proyectos que cumplan sus requisitos (incluida atribución); requiere crear cuenta/clave y aceptar los términos. Revisar elegibilidad comercial y límites. | [Getting started](https://developer.themoviedb.org/docs/getting-started) · [Términos](https://www.themoviedb.org/documentation/api/terms-of-use) |
| [Unsplash API](https://unsplash.com/documentation) | Fotografía | API con modo demo de 50 solicitudes por hora; requiere cuenta y registrar una aplicación. La producción y los límites mayores requieren aprobación; seguir reglas de atribución y hotlinking. | [API docs](https://unsplash.com/documentation) · [Guidelines](https://help.unsplash.com/api-guidelines/unsplash-api-guidelines) |
| [Openverse API](https://api.openverse.org/v1/) | Fotografía, Pintura, Danza, Arquitectura | Búsqueda de medios con licencias abiertas. Revisar autenticación, límites y licencia/atribución de cada resultado antes de integrarlo o reutilizarlo. | [API root/docs](https://api.openverse.org/v1/) |
| [IGDB API](https://api-docs.igdb.com/) | Videojuegos | Gratuita para uso no comercial según su documentación; requiere cuenta Twitch, registrar aplicación y autenticarse con OAuth. Tiene límites de solicitudes y acuerdo de desarrollador aplicable. | [API docs](https://api-docs.igdb.com/) · [Twitch Developer Agreement](https://www.twitch.tv/p/legal/developer-agreement/) |

## Guía de selección

- Para una primera prueba sin credenciales, evaluar Art Institute of Chicago,
  The Met, Wikimedia Commons, MusicBrainz y consultas de lectura de Open Library.
- Algunas APIs gratuitas requieren clave, registro, atribución o excluyen el uso
  comercial. Confirmar los términos vigentes y guardar secretos fuera del repo.
- Los catálogos de metadatos no necesariamente ofrecen lectura, escucha,
  visualización o descarga de la obra. En Acervo, conservar la fuente original,
  autoría y licencia declarada; marcar los derechos no confirmados como
  `unknown`, sin inferir permiso de reutilización.
- MangaDex se incluye en Literatura por decisión de producto; comprobar las
  reglas actuales de su API y enlazar el contenido, sin redistribuir capítulos.

## Directorios para descubrir APIs

Estos sitios son directorios de descubrimiento, no documentación oficial ni
garantías de disponibilidad o seguridad de las APIs listadas. Antes de adoptar
una API encontrada allí, seguir el enlace a su documentación oficial y verificar
su propietario, términos, acceso, límites y licencias.

- [Free Public APIs](https://www.freepublicapis.com/)
- [APIs Públicas](https://www.apispublicas.com/)
