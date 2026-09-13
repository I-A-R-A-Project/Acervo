# Salas de Ciencia

Ocho ramas de la ciencia, cada una como una "sala" navegable dentro de
Acervo, con sus propias subclasificaciones (los "estantes" dentro de cada
sala). Mismo mecanismo de fondo que las Salas de Artes: buscador, filtro por
subclasificación y ficha de detalle.

| Sala | Metáfora | Subclasificaciones |
|---|---|---|
| **Física** | el laboratorio de mecánica | Mecánica clásica, Termodinámica, Electromagnetismo, Física cuántica |
| **Química** | la sala de reactivos | Química orgánica, Química inorgánica, Fisicoquímica, Bioquímica |
| **Biología** | el herbario | Genética, Ecología, Microbiología, Zoología |
| **Astronomía** | el observatorio | Sistema Solar, Estrellas y galaxias, Cosmología, Exoplanetas |
| **Ciencias de la Tierra** | la sala de estratos | Geología, Meteorología, Oceanografía, Paleontología |
| **Matemática** | la pizarra | Álgebra, Geometría, Cálculo, Estadística |
| **Ciencias de la Computación** | la sala de máquinas | Algoritmos, Inteligencia artificial, Redes y sistemas, Criptografía |
| **Medicina** | la sala de anatomía | Anatomía, Farmacología, Cardiología, Epidemiología |

## Ficha de cada ítem

Cada ítem guardado en una sala de ciencia comparte esta forma:

```json
{
  "id": "source:slug-or-uuid",
  "title": "Entrelazamiento cuántico",
  "source": "Artículo de divulgación",
  "type": "articulo",
  "room": "fisica",
  "subclassification": "cuantica",
  "level": "Avanzado",
  "source_url": "https://...",
  "tags": ["entrelazamiento", "información cuántica"],
  "notes": "",
  "saved_at": "2026-09-10"
}
```

`type` distingue de qué naturaleza es el ítem: `concepto`, `experimento`,
`articulo` o `video`. `level` es una estimación de dificultad
(Introductorio / Intermedio / Avanzado), pensada para poder filtrar por nivel
más adelante.

## Estado

- Las 8 salas ya existen como prototipo de UI (una página genérica que lee
  la configuración de cada rama desde un solo archivo de datos, en vez de
  duplicar código por disciplina).
- Por ahora los datos son de ejemplo (mock); están listos para reemplazarse
  por ítems reales guardados a mano o vía la Bandeja.
