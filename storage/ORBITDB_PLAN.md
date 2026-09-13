# Plan de implementación de OrbitDB en `storage/`

## Objetivo

Incorporar una capa de persistencia local y sincronizable para las Salas de
Arte, las Salas de Ciencia, Bandeja y Social, sin acoplarla a React ni perder
la compatibilidad con la persistencia actual en SQLite/JSON. OrbitDB será la
capa de replicación y almacenamiento distribuido; el modelo de dominio seguirá
siendo el definido en `models/`.

## Decisiones iniciales

- Mantener `storage/index.js` como punto de entrada y exponer una interfaz
  estable (`open`, `get`, `put`, `remove`, `list`, `close`, `export`).
- Usar una base por ámbito funcional: `items`, `collections`, `notes` y
  `inbox`, evitando mezclar datos de catálogo con preferencias locales.
- Identificar cada registro con el `id` canónico del modelo común
  (`source:slug-or-uuid`) y conservar `saved_at`, `updated_at` y `deleted_at`
  para resolver sincronización y borrados.
- Mantener SQLite/JSON como adaptador legado y respaldo exportable durante la
  migración; no hacer un reemplazo de “big bang”.
- Usar OrbitDB sobre IPFS/Helia con identidad local persistida. Las claves y
  credenciales nunca deben entrar al repositorio.

## Fases

### 1. Contrato y diagnóstico

1. Documentar las operaciones que hoy necesitan las vistas y scripts.
2. Definir tipos de registro, versión de esquema y reglas de validación.
3. Decidir el directorio de datos por perfil y los límites de tamaño para
   metadatos, notas y binarios.
4. Acordar qué datos son privados, qué datos pueden replicarse y quién puede
   publicar o aceptar una réplica.

**Salida:** contrato de `storage` versionado y matriz de datos
local/sincronizables.

### 2. Adaptador de OrbitDB

1. Añadir las dependencias de OrbitDB/IPFS compatibles con el runtime real
   (Node para la primera integración; navegador solo si se valida el bundle).
2. Crear `storage/orbitdb.js` con inicialización, apertura/cierre ordenado,
   manejo de identidad y directorio configurable.
3. Implementar operaciones idempotentes y validación antes de escribir.
4. Emitir eventos de cambio para que la UI pueda suscribirse sin conocer
   detalles de OrbitDB.
5. Registrar errores de red, replicación y corrupción; no ocultarlos con
   valores por defecto silenciosos.

**Salida:** adaptador probado de forma aislada contra una instancia local.

### 3. Migración desde SQLite/JSON

1. Implementar un importador que lea el formato actual y convierta registros
   al esquema versionado.
2. Hacer una copia de seguridad antes de la primera migración y guardar un
   marcador de versión.
3. Migrar primero en modo lectura/escritura dual: OrbitDB recibe cambios y el
   adaptador actual sigue siendo la fuente de lectura.
4. Comparar conteos, identificadores, hashes de contenido y metadatos entre
   ambos almacenes.
5. Habilitar lectura desde OrbitDB por ámbito, con fallback explícito al
   almacén legado solo durante la transición.

**Salida:** migración repetible, auditable y reversible.

### 4. Integración con las salas

1. Reemplazar el acceso directo a `localStorage` en Literatura por el
   repositorio de `storage`.
2. Conectar las demás salas, colecciones, Bandeja y Social al mismo contrato.
3. Suscribir la UI a cambios locales y remotos, mostrando estado
   `sincronizado`, `pendiente` o `conflicto`.
4. Mantener exportación/importación manual para recuperación y portabilidad.

**Salida:** la UI no depende de una implementación concreta de persistencia.

### 5. Sincronización y conflictos

1. Definir un identificador estable de dispositivo/usuario y permisos de
   acceso a cada base.
2. Probar replicación entre dos perfiles, desconexión, reconexión y cambios
   concurrentes.
3. Aplicar una política por tipo: último cambio válido para metadatos simples,
   unión para tags y resolución explícita para notas editadas en paralelo.
4. Conservar historial suficiente para diagnosticar conflictos y permitir
   exportar una copia antes de resolverlos.

**Salida:** sincronización reproducible con pruebas de conflicto documentadas.

### 6. Endurecimiento y retiro gradual del legado

1. Medir tiempos de apertura, lectura, escritura, uso de disco y recuperación.
2. Probar reinicio durante una escritura, base vacía, datos antiguos y
   pérdida temporal de red.
3. Activar OrbitDB detrás de una configuración/feature flag por perfil.
4. Tras un periodo estable, convertir SQLite/JSON en exportación y backup,
   no en fuente primaria.
5. Mantener un comando de rollback que restaure el backup y desactive la
   sincronización.

## Criterios de aceptación

- Una instalación nueva crea identidad, almacenes y esquema sin intervención
  manual.
- Los datos existentes se migran sin duplicados ni pérdida de `id`, tags,
  notas o fuente.
- Dos perfiles pueden replicar cambios y recuperarse de una desconexión.
- Los conflictos se muestran y resuelven según una política documentada.
- Exportar e importar produce datos equivalentes sin requerir OrbitDB activo.
- Las pruebas cubren apertura/cierre, CRUD, migración, replicación, conflicto,
  rollback y corrupción parcial.

## Riesgos y mitigaciones

- **Compatibilidad de runtime y bundle:** encapsular OrbitDB detrás del
  adaptador y validar Node/navegador antes de integrarlo en la UI.
- **Crecimiento de logs y blobs:** guardar binarios fuera de los registros,
  usar referencias a archivos y definir retención/compactación.
- **Privacidad:** replicar solo bases explícitamente compartidas y proteger la
  identidad local; no sincronizar credenciales.
- **Conflictos difíciles de deshacer:** versionar registros, exportar antes de
  resolver y mantener rollback durante toda la transición.
