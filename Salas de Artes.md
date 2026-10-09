# Salas de Artes

Nueve salas de arte navegables dentro de Acervo,
con su propia identidad visual y su propia ficha de detalle. Comparten el
mismo mecanismo de fondo (buscador, colecciones, ficha de detalle) pero cada
una tiene su metáfora y paleta propia.

| Sala | Metáfora | Qué guarda |
|---|---|---|
| **Literatura** | la sala de lectura | Expresión estética por medio del lenguaje escrito: cuentos, poemas, novelas, cómics, manga y fanfiction. |
| **Arquitectura** | la mesa de dibujo | Diseño artístico de espacios habitables y monumentales. |
| **Escultura** | la sala de vitrinas | Modelado de volúmenes en materiales sólidos. |
| **Pintura** | el salón | Representación gráfica mediante pigmentos y lienzos. |
| **Música** | la discoteca | Composición sonora expresiva en el tiempo. |
| **Danza** | el escenario | Movimiento corporal rítmico con fines artísticos. |
| **Cine** | sala de proyección | Narración visual y auditiva mediante metrajes. |
| **Fotografía** | el cuarto oscuro | Captura estética de la luz y la realidad. |
| **Videojuegos** | la cartucho-teca | Mezcla de las disciplinas anteriores con la participación activa del jugador. |

## Ficha de cada ítem

Cada pieza guardada en una sala de arte comparte esta forma:

```json
{
  "id": "source:slug-or-uuid",
  "title": "Retrato en Ocre",
  "artist": "Valeria Nuin",
  "medium": "óleo sobre lienzo",
  "room": "pintura",
  "source": "ArtStation — pintura",
  "source_url": "https://...",
  "license": "CC BY 4.0",
  "tags": ["expresivo", "paleta cálida"],
  "notes": "",
  "saved_at": "2026-06-16"
}
```

## Estado

- Las 9 salas ya existen como prototipo de UI (una página por disciplina,
  con carga manual de ítems — ver el caso de **Literatura**, que ya soporta
  guardar una pieza pegando una URL y completando metadatos a mano).
- Publicación cruzada a redes sociales (subir la misma obra a varios
  canales a la vez) **no** es parte de esta capa: si se retoma esa idea del
  concepto original, va a vivir en una sección aparte, no mezclada con las
  salas de descubrimiento y colección.

## Fuentes y APIs

El directorio [`docs/`](docs/README.md) contiene fuentes candidatas por sala y
enlaces a documentación oficial de APIs. Cómics y manga se documentan dentro de
Literatura. Las fuentes son referencias para guardar/enlazar contenido; sus
licencias y condiciones de acceso deben comprobarse por obra y servicio.
