export const itemSchema = {
  id: 'source:slug-or-uuid',
  title: 'string',
  origin: 'manual | bandeja | social',
  room: 'arte:pintura | ciencia:astronomia | null',
  subclassification: 'string',
  source: 'string',
  source_url: 'https://example.com',
  type: 'obra | concepto | experimento | articulo | video | post',
  tags: ['array'],
  license: 'CC BY 4.0 | unknown | string',
  notes: 'string',
  saved_at: 'ISO-8601 timestamp',
}
