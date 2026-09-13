// Datos de ejemplo (mock). Cada rama es una "sala" con sus propias
// subclasificaciones (estantes) e ítems. Pensado para reemplazarse
// después por datos reales de un backend.

export const BRANCHES = [
  {
    id: 'fisica',
    name: 'Física',
    tag: 'el laboratorio de mecánica',
    code: 'FIS',
    from: '#0B1A2A',
    to: '#12324f',
    accent: '#5EA8D9',
    subtitle: 'Del movimiento de los cuerpos a las partículas que no se ven.',
    groups: [
      {
        id: 'mecanica',
        label: 'Mecánica clásica',
        items: [
          { id: 'fis-mec-1', title: 'Leyes de Newton', source: 'Philosophiæ Naturalis, 1687', type: 'concepto', level: 'Introductorio', summary: 'Los tres principios que describen cómo las fuerzas cambian el movimiento de un cuerpo.', tags: ['fuerza', 'movimiento', 'clásica'] },
          { id: 'fis-mec-2', title: 'Péndulo doble y caos', source: 'Apunte de cátedra', type: 'experimento', level: 'Avanzado', summary: 'Un sistema simple que se vuelve impredecible: introducción práctica a la sensibilidad a condiciones iniciales.', tags: ['caos', 'simulación'] },
          { id: 'fis-mec-3', title: 'Momento angular en trompos', source: 'Video de divulgación', type: 'video', level: 'Intermedio', summary: 'Por qué un trompo no se cae mientras gira rápido, explicado con torque y precesión.', tags: ['rotación', 'torque'] },
        ],
      },
      {
        id: 'termodinamica',
        label: 'Termodinámica',
        items: [
          { id: 'fis-ter-1', title: 'Segunda ley y entropía', source: 'Clausius, 1865', type: 'concepto', level: 'Intermedio', summary: 'Por qué el calor fluye en una sola dirección y qué tiene que ver la flecha del tiempo.', tags: ['entropía', 'calor'] },
          { id: 'fis-ter-2', title: 'Ciclo de Carnot', source: 'Apunte de cátedra', type: 'concepto', level: 'Avanzado', summary: 'El límite teórico de eficiencia de cualquier máquina térmica.', tags: ['máquinas térmicas', 'eficiencia'] },
        ],
      },
      {
        id: 'electromagnetismo',
        label: 'Electromagnetismo',
        items: [
          { id: 'fis-ele-1', title: 'Ecuaciones de Maxwell', source: 'A Treatise on Electricity and Magnetism, 1873', type: 'concepto', level: 'Avanzado', summary: 'Cuatro ecuaciones que unifican electricidad, magnetismo y predicen la existencia de las ondas de luz.', tags: ['campos', 'ondas'] },
          { id: 'fis-ele-2', title: 'Inducción electromagnética casera', source: 'Guía de experimento', type: 'experimento', level: 'Introductorio', summary: 'Encender un LED moviendo un imán dentro de una bobina de cobre.', tags: ['inducción', 'DIY'] },
        ],
      },
      {
        id: 'cuantica',
        label: 'Física cuántica',
        items: [
          { id: 'fis-cua-1', title: 'Experimento de la doble rendija', source: 'Feynman Lectures, cap. 1', type: 'concepto', level: 'Intermedio', summary: 'El experimento que muestra que la luz y la materia se comportan como onda y partícula a la vez.', tags: ['dualidad', 'interferencia'] },
          { id: 'fis-cua-2', title: 'Entrelazamiento cuántico', source: 'Artículo de divulgación', type: 'articulo', level: 'Avanzado', summary: 'Cómo dos partículas pueden quedar correlacionadas sin importar la distancia entre ellas.', tags: ['entrelazamiento', 'información cuántica'] },
        ],
      },
    ],
  },
  {
    id: 'quimica',
    name: 'Química',
    tag: 'la sala de reactivos',
    code: 'QUI',
    from: '#142313',
    to: '#1f3a1c',
    accent: '#8FD16A',
    subtitle: 'Cómo se combinan, se rompen y se transforman los átomos.',
    groups: [
      {
        id: 'organica',
        label: 'Química orgánica',
        items: [
          { id: 'qui-org-1', title: 'Isomería en hidrocarburos', source: 'Apunte de cátedra', type: 'concepto', level: 'Intermedio', summary: 'Por qué dos moléculas con la misma fórmula pueden tener propiedades completamente distintas.', tags: ['carbono', 'estructura'] },
          { id: 'qui-org-2', title: 'Síntesis de la aspirina', source: 'Guía de laboratorio', type: 'experimento', level: 'Introductorio', summary: 'Reacción clásica de esterificación para obtener ácido acetilsalicílico.', tags: ['síntesis', 'laboratorio'] },
        ],
      },
      {
        id: 'inorganica',
        label: 'Química inorgánica',
        items: [
          { id: 'qui-ino-1', title: 'Tabla periódica y periodicidad', source: 'Mendeléiev, 1869', type: 'concepto', level: 'Introductorio', summary: 'Cómo la organización de los elementos predice propiedades antes de medirlas.', tags: ['elementos', 'tabla periódica'] },
          { id: 'qui-ino-2', title: 'Complejos de coordinación', source: 'Apunte de cátedra', type: 'concepto', level: 'Avanzado', summary: 'Metales de transición rodeados de ligandos: la química detrás del color de muchas piedras.', tags: ['metales', 'ligandos'] },
        ],
      },
      {
        id: 'fisicoquimica',
        label: 'Fisicoquímica',
        items: [
          { id: 'qui-fis-1', title: 'Equilibrio químico', source: 'Le Châtelier, 1884', type: 'concepto', level: 'Intermedio', summary: 'Qué pasa cuando una reacción parece haberse detenido pero en realidad sigue en ambos sentidos.', tags: ['equilibrio', 'reacciones'] },
          { id: 'qui-fis-2', title: 'Cinética de reacción', source: 'Video de cátedra', type: 'video', level: 'Intermedio', summary: 'Qué factores aceleran o frenan una reacción química y cómo medirlo.', tags: ['velocidad', 'catálisis'] },
        ],
      },
      {
        id: 'bioquimica',
        label: 'Bioquímica',
        items: [
          { id: 'qui-bio-1', title: 'Estructura del ADN', source: 'Watson y Crick, 1953', type: 'concepto', level: 'Intermedio', summary: 'La doble hélice que explica cómo se copia y transmite la información genética.', tags: ['ADN', 'genética molecular'] },
          { id: 'qui-bio-2', title: 'Enzimas como catalizadores', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'Por qué las reacciones del cuerpo ocurren a temperatura corporal y no a 300 °C.', tags: ['enzimas', 'metabolismo'] },
        ],
      },
    ],
  },
  {
    id: 'biologia',
    name: 'Biología',
    tag: 'el herbario',
    code: 'BIO',
    from: '#0E1F16',
    to: '#183c24',
    accent: '#79C99E',
    subtitle: 'La vida, desde una célula hasta un ecosistema entero.',
    groups: [
      {
        id: 'genetica',
        label: 'Genética',
        items: [
          { id: 'bio-gen-1', title: 'Leyes de Mendel', source: 'Experimentos con arvejas, 1866', type: 'concepto', level: 'Introductorio', summary: 'Cómo se heredan los caracteres de una generación a otra, explicado con plantas de guisante.', tags: ['herencia', 'genes'] },
          { id: 'bio-gen-2', title: 'Edición génica con CRISPR', source: 'Artículo de divulgación', type: 'articulo', level: 'Avanzado', summary: 'Una herramienta molecular que permite cortar y editar secuencias de ADN con precisión.', tags: ['CRISPR', 'biotecnología'] },
        ],
      },
      {
        id: 'ecologia',
        label: 'Ecología',
        items: [
          { id: 'bio-eco-1', title: 'Cadenas y redes tróficas', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'Quién se come a quién y cómo circula la energía dentro de un ecosistema.', tags: ['ecosistema', 'energía'] },
          { id: 'bio-eco-2', title: 'Especies clave', source: 'Estudio de campo', type: 'articulo', level: 'Intermedio', summary: 'Por qué la desaparición de una sola especie puede desarmar un ecosistema entero.', tags: ['biodiversidad', 'conservación'] },
        ],
      },
      {
        id: 'microbiologia',
        label: 'Microbiología',
        items: [
          { id: 'bio-mic-1', title: 'Descubrimiento de la penicilina', source: 'Fleming, 1928', type: 'concepto', level: 'Introductorio', summary: 'Un moho contaminante en una placa de laboratorio que abrió la era de los antibióticos.', tags: ['antibióticos', 'historia'] },
          { id: 'bio-mic-2', title: 'Microbiota intestinal', source: 'Artículo de divulgación', type: 'articulo', level: 'Intermedio', summary: 'Los billones de microorganismos que conviven con nosotros y ayudan a digerir.', tags: ['microbioma', 'salud'] },
        ],
      },
      {
        id: 'zoologia',
        label: 'Zoología',
        items: [
          { id: 'bio-zoo-1', title: 'Migración de aves', source: 'Estudio de campo', type: 'articulo', level: 'Intermedio', summary: 'Cómo algunas especies recorren miles de kilómetros usando el campo magnético terrestre.', tags: ['migración', 'comportamiento'] },
          { id: 'bio-zoo-2', title: 'Metamorfosis en anfibios', source: 'Video de divulgación', type: 'video', level: 'Introductorio', summary: 'El proceso que lleva a un renacuajo a convertirse en rana adulta.', tags: ['desarrollo', 'anfibios'] },
        ],
      },
    ],
  },
  {
    id: 'astronomia',
    name: 'Astronomía',
    tag: 'el observatorio',
    code: 'AST',
    from: '#0A0A1F',
    to: '#1b1440',
    accent: '#B79CFF',
    subtitle: 'Desde el patio de casa hasta el borde del universo observable.',
    groups: [
      {
        id: 'sistema-solar',
        label: 'Sistema Solar',
        items: [
          { id: 'ast-sis-1', title: 'Por qué Plutón dejó de ser planeta', source: 'UAI, 2006', type: 'concepto', level: 'Introductorio', summary: 'Los tres criterios que definen un planeta y cómo Plutón deja de cumplir el tercero.', tags: ['planetas', 'clasificación'] },
          { id: 'ast-sis-2', title: 'Anillos de Saturno', source: 'Datos de la misión Cassini', type: 'articulo', level: 'Intermedio', summary: 'De qué están hechos los anillos y por qué son tan delgados comparados con su ancho.', tags: ['Saturno', 'misiones espaciales'] },
        ],
      },
      {
        id: 'estrellas-galaxias',
        label: 'Estrellas y galaxias',
        items: [
          { id: 'ast-est-1', title: 'Ciclo de vida de una estrella', source: 'Apunte de cátedra', type: 'concepto', level: 'Intermedio', summary: 'De nube de gas a enana blanca, estrella de neutrones o agujero negro, según su masa.', tags: ['estrellas', 'evolución estelar'] },
          { id: 'ast-est-2', title: 'Clasificación de galaxias', source: 'Hubble, 1926', type: 'concepto', level: 'Introductorio', summary: 'Espirales, elípticas e irregulares: el esquema que todavía se usa para ordenar galaxias.', tags: ['galaxias', 'clasificación'] },
        ],
      },
      {
        id: 'cosmologia',
        label: 'Cosmología',
        items: [
          { id: 'ast-cos-1', title: 'Evidencia del Big Bang', source: 'Radiación de fondo cósmico, 1965', type: 'concepto', level: 'Avanzado', summary: 'La radiación que sobra del universo temprano y confirma que todo partió de un punto caliente y denso.', tags: ['Big Bang', 'radiación de fondo'] },
          { id: 'ast-cos-2', title: 'Materia oscura', source: 'Artículo de divulgación', type: 'articulo', level: 'Avanzado', summary: 'La masa invisible que hace falta para explicar cómo giran las galaxias.', tags: ['materia oscura', 'gravedad'] },
        ],
      },
      {
        id: 'exoplanetas',
        label: 'Exoplanetas',
        items: [
          { id: 'ast-exo-1', title: 'Método de tránsito', source: 'Misión Kepler', type: 'concepto', level: 'Intermedio', summary: 'Cómo detectar un planeta lejano midiendo la sombra que deja al pasar frente a su estrella.', tags: ['tránsito', 'Kepler'] },
          { id: 'ast-exo-2', title: 'Zona de habitabilidad', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'La franja de distancias a una estrella donde el agua líquida podría existir en la superficie.', tags: ['habitabilidad', 'búsqueda de vida'] },
        ],
      },
    ],
  },
  {
    id: 'ciencias-tierra',
    name: 'Ciencias de la Tierra',
    tag: 'la sala de estratos',
    code: 'TIE',
    from: '#221A10',
    to: '#3d2c16',
    accent: '#D9A15E',
    subtitle: 'Rocas, océanos, clima y todo lo que se mueve bajo nuestros pies.',
    groups: [
      {
        id: 'geologia',
        label: 'Geología',
        items: [
          { id: 'tie-geo-1', title: 'Tectónica de placas', source: 'Wegener, 1912 / consenso moderno', type: 'concepto', level: 'Introductorio', summary: 'Cómo la corteza terrestre está dividida en placas que se mueven y chocan lentamente.', tags: ['placas', 'deriva continental'] },
          { id: 'tie-geo-2', title: 'Datación radiométrica', source: 'Apunte de cátedra', type: 'concepto', level: 'Avanzado', summary: 'Cómo se calcula la edad de una roca midiendo la desintegración de isótopos.', tags: ['edad de la Tierra', 'isótopos'] },
        ],
      },
      {
        id: 'meteorologia',
        label: 'Meteorología',
        items: [
          { id: 'tie-met-1', title: 'Formación de un huracán', source: 'Artículo de divulgación', type: 'articulo', level: 'Intermedio', summary: 'Las condiciones de temperatura y humedad que convierten una tormenta tropical en huracán.', tags: ['huracanes', 'clima'] },
          { id: 'tie-met-2', title: 'El Niño y La Niña', source: 'Apunte de cátedra', type: 'concepto', level: 'Intermedio', summary: 'Cómo un cambio de temperatura en el Pacífico altera el clima en medio planeta.', tags: ['ENSO', 'clima global'] },
        ],
      },
      {
        id: 'oceanografia',
        label: 'Oceanografía',
        items: [
          { id: 'tie-oce-1', title: 'Corrientes oceánicas profundas', source: 'Video de divulgación', type: 'video', level: 'Intermedio', summary: 'La cinta transportadora global de agua que regula el clima del planeta.', tags: ['corrientes', 'circulación termohalina'] },
        ],
      },
      {
        id: 'paleontologia',
        label: 'Paleontología',
        items: [
          { id: 'tie-pal-1', title: 'Extinción del Cretácico', source: 'Hipótesis del impacto, Alvarez 1980', type: 'concepto', level: 'Intermedio', summary: 'La capa de iridio que llevó a proponer que un asteroide terminó con los dinosaurios no aviares.', tags: ['extinción', 'dinosaurios'] },
          { id: 'tie-pal-2', title: 'Cómo se forma un fósil', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'El camino, poco probable, que va de un organismo muerto a una roca con su huella.', tags: ['fosilización'] },
        ],
      },
    ],
  },
  {
    id: 'matematica',
    name: 'Matemática',
    tag: 'la pizarra',
    code: 'MAT',
    from: '#161616',
    to: '#2b2b2b',
    accent: '#E8DCC0',
    subtitle: 'Números, formas y estructuras que se sostienen solas.',
    groups: [
      {
        id: 'algebra',
        label: 'Álgebra',
        items: [
          { id: 'mat-alg-1', title: 'Ecuaciones de segundo grado', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'De dónde sale la fórmula resolvente y por qué siempre funciona.', tags: ['ecuaciones', 'fórmula resolvente'] },
          { id: 'mat-alg-2', title: 'Grupos y simetría', source: 'Galois, s. XIX', type: 'concepto', level: 'Avanzado', summary: 'La estructura matemática detrás de qué ecuaciones se pueden resolver con una fórmula.', tags: ['teoría de grupos', 'simetría'] },
        ],
      },
      {
        id: 'geometria',
        label: 'Geometría',
        items: [
          { id: 'mat-geo-1', title: 'Teorema de Pitágoras', source: 'Escuela pitagórica, s. VI a.C.', type: 'concepto', level: 'Introductorio', summary: 'La relación entre los lados de un triángulo rectángulo, demostrada de decenas de formas distintas.', tags: ['triángulos', 'demostración'] },
          { id: 'mat-geo-2', title: 'Geometrías no euclidianas', source: 'Lobachevski, Bolyai, s. XIX', type: 'concepto', level: 'Avanzado', summary: 'Qué pasa con la geometría cuando se cambia el quinto postulado de Euclides.', tags: ['no euclidiana', 'espacio curvo'] },
        ],
      },
      {
        id: 'calculo',
        label: 'Cálculo',
        items: [
          { id: 'mat-cal-1', title: 'Idea intuitiva de límite', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'Cómo acercarse infinitamente a un valor sin necesariamente llegar a él.', tags: ['límites', 'infinito'] },
          { id: 'mat-cal-2', title: 'Teorema fundamental del cálculo', source: 'Newton y Leibniz, s. XVII', type: 'concepto', level: 'Avanzado', summary: 'El puente que conecta derivar e integrar, dos operaciones que parecían no tener relación.', tags: ['derivadas', 'integrales'] },
        ],
      },
      {
        id: 'estadistica',
        label: 'Estadística',
        items: [
          { id: 'mat-est-1', title: 'Distribución normal', source: 'Gauss, s. XIX', type: 'concepto', level: 'Intermedio', summary: 'La curva de campana que aparece una y otra vez al medir cosas del mundo real.', tags: ['probabilidad', 'campana de Gauss'] },
          { id: 'mat-est-2', title: 'Correlación no implica causalidad', source: 'Artículo de divulgación', type: 'articulo', level: 'Introductorio', summary: 'Por qué dos variables que se mueven juntas no prueban que una cause la otra.', tags: ['causalidad', 'sesgos'] },
        ],
      },
    ],
  },
  {
    id: 'computacion',
    name: 'Ciencias de la Computación',
    tag: 'la sala de máquinas',
    code: 'COM',
    from: '#0A1A1A',
    to: '#123232',
    accent: '#4FD1C5',
    subtitle: 'Cómo se resuelven problemas cuando quien ejecuta es una máquina.',
    groups: [
      {
        id: 'algoritmos',
        label: 'Algoritmos',
        items: [
          { id: 'com-alg-1', title: 'Búsqueda binaria', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'Cómo encontrar un elemento en una lista ordenada descartando la mitad en cada paso.', tags: ['búsqueda', 'complejidad'] },
          { id: 'com-alg-2', title: 'Problema del viajante', source: 'Apunte de cátedra', type: 'concepto', level: 'Avanzado', summary: 'Un problema fácil de enunciar y, hasta ahora, imposible de resolver rápido en el caso general.', tags: ['NP-completo', 'optimización'] },
        ],
      },
      {
        id: 'ia',
        label: 'Inteligencia artificial',
        items: [
          { id: 'com-ia-1', title: 'Redes neuronales, idea básica', source: 'Artículo de divulgación', type: 'articulo', level: 'Intermedio', summary: 'Cómo un modelo aprende ajustando pesos a partir de ejemplos, inspirado (de lejos) en neuronas.', tags: ['redes neuronales', 'aprendizaje'] },
          { id: 'com-ia-2', title: 'Sesgo en modelos de IA', source: 'Estudio de caso', type: 'articulo', level: 'Intermedio', summary: 'Por qué un modelo puede reproducir o amplificar sesgos presentes en sus datos de entrenamiento.', tags: ['ética', 'sesgo algorítmico'] },
        ],
      },
      {
        id: 'redes-sistemas',
        label: 'Redes y sistemas',
        items: [
          { id: 'com-red-1', title: 'Cómo viaja un paquete por internet', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'El recorrido de un paquete de datos desde tu dispositivo hasta un servidor y de vuelta.', tags: ['redes', 'TCP/IP'] },
        ],
      },
      {
        id: 'criptografia',
        label: 'Criptografía',
        items: [
          { id: 'com-cri-1', title: 'Cifrado de clave pública', source: 'Diffie y Hellman, 1976', type: 'concepto', level: 'Avanzado', summary: 'Cómo dos personas pueden acordar un secreto compartido hablando por un canal público.', tags: ['criptografía', 'seguridad'] },
        ],
      },
    ],
  },
  {
    id: 'medicina',
    name: 'Medicina',
    tag: 'la sala de anatomía',
    code: 'MED',
    from: '#210D10',
    to: '#3d1218',
    accent: '#E88A93',
    subtitle: 'El cuerpo humano, cómo funciona y qué hacer cuando falla.',
    groups: [
      {
        id: 'anatomia',
        label: 'Anatomía',
        items: [
          { id: 'med-ana-1', title: 'Sistema circulatorio', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'El recorrido de la sangre entre el corazón, los pulmones y el resto del cuerpo.', tags: ['circulación', 'corazón'] },
        ],
      },
      {
        id: 'farmacologia',
        label: 'Farmacología',
        items: [
          { id: 'med-far-1', title: 'Cómo actúa un analgésico', source: 'Artículo de divulgación', type: 'articulo', level: 'Intermedio', summary: 'El camino de una pastilla desde que se traga hasta que reduce el dolor.', tags: ['analgésicos', 'farmacocinética'] },
        ],
      },
      {
        id: 'cardiologia',
        label: 'Cardiología',
        items: [
          { id: 'med-car-1', title: 'Lectura básica de un electrocardiograma', source: 'Guía clínica', type: 'concepto', level: 'Avanzado', summary: 'Qué representa cada onda del ECG y qué patrones son motivo de atención.', tags: ['ECG', 'ritmo cardíaco'] },
        ],
      },
      {
        id: 'epidemiologia',
        label: 'Epidemiología',
        items: [
          { id: 'med-epi-1', title: 'Número reproductivo básico (R0)', source: 'Artículo de divulgación', type: 'articulo', level: 'Intermedio', summary: 'El número que estima cuántas personas contagia, en promedio, alguien con una enfermedad.', tags: ['epidemiología', 'contagio'] },
          { id: 'med-epi-2', title: 'Curva epidémica y aplanamiento', source: 'Apunte de cátedra', type: 'concepto', level: 'Introductorio', summary: 'Por qué retrasar contagios, aunque el total final sea similar, alivia al sistema de salud.', tags: ['salud pública'] },
        ],
      },
    ],
  },
]

export function getBranch(id) {
  return BRANCHES.find((b) => b.id === id)
}
