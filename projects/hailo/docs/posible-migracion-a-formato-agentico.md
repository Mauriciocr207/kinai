# Posible migración de `thesis-mayan-ai` a formato agéntico

## Contexto

`kinai` se ha utilizado como espacio de trabajo local para agentes. Contiene reglas
operativas en `AGENTS.md`, contexto global en `README.md` y documentación de los
experimentos para adaptar el ASR a Hailo-10H.

`thesis-mayan-ai` es el repositorio principal de la tesis de Mauricio. Contiene la
investigación, notebooks, corpus y modelos, pero originalmente no fue organizado
como un repositorio pensado para agentes.

La propuesta es trasladar la estructura agéntica de `kinai` a `thesis-mayan-ai`, sin
convertirlo en un repositorio distinto ni copiar datos pesados o privados.

## Objetivo de la migración

El repositorio de la tesis debe servir simultáneamente como:

- fuente de contexto académico del proyecto;
- registro reproducible de experimentos;
- espacio de colaboración para agentes;
- referencia de los artefactos necesarios para el pipeline de voz.

El pipeline global es:

```text
audio → ASR → texto maya → LLM → texto de respuesta → TTS → audio
```

## Estructura propuesta

```text
thesis-mayan-ai/
├── AGENTS.md
├── README.md
├── docs/
│   ├── project-overview.md
│   ├── deployment/
│   │   └── raspberry-pi-hailo.md
│   └── onnx_hailo/
│       └── README.md
├── projects/
│   ├── corpus/
│   ├── analysis/
│   ├── mms_asr/
│   └── hailo/
│       ├── notebooks/
│       ├── scripts/
│       └── experiments/
└── tools/
    └── onnx/
```

## Papel de cada archivo

### `AGENTS.md`

Debe contener instrucciones breves y aplicables a todo el repositorio:

- leer `README.md` antes de proponer cambios;
- comunicarse en español;
- conservar los modelos propios de ASR y TTS como referencias;
- distinguir KenLM del LLM conversacional;
- no publicar corpus privados, tokens ni credenciales;
- distinguir detección PCIe, controlador e inferencia comprobada en Hailo;
- separar resultados observados, hipótesis y propuestas;
- mantener las notebooks y scripts reproducibles.

Las instrucciones específicas pueden vivir en `AGENTS.md` adicionales dentro de
subproyectos, siempre que sean más concretas y no contradigan las reglas de la raíz.

### `README.md`

Debe conservar la descripción académica del repositorio y enlazar a la documentación
global, la línea Hailo y las reglas para agentes. No debe convertirse en un registro
detallado de cada prueba exploratoria.

### `docs/project-overview.md`

Debe explicar el proyecto completo: objetivo, modelos, pipeline, hardware, estado de
la investigación y relación entre entrenamiento, conversión y despliegue.

### `docs/onnx_hailo/README.md`

Debe conservar la bitácora de la conversión ONNX → HAR → HEF, incluyendo operaciones
incompatibles, candidatos, equivalencia numérica, errores del parser y decisiones
descartadas.

### `projects/hailo/`

Debe contener la línea experimental específica de Hailo: notebooks, scripts y
resultados de compilación. Los archivos `.hef`, modelos ONNX de varios GB y datos de
calibración no deben entrar al repositorio Git si ya tienen un almacenamiento adecuado
en Drive o Hugging Face.

### `tools/onnx/`

Debe contener utilidades reutilizables, como la transformación experimental de
Conv1D a Conv2D. Cada herramienta debe indicar sus entradas, salidas y si modifica o
preserva el modelo original.

## Migración desde `kinai`

La migración debe trasladar contenido seleccionado, no anidar `kinai` como submódulo:

```text
kinai/AGENTS.md                         → thesis-mayan-ai/AGENTS.md
kinai/docs/onnx_hailo/README.md         → thesis-mayan-ai/docs/onnx_hailo/README.md
kinai/README.md                          → fuente para docs/project-overview.md
kinai/conv1d_to_conv2d_colab_cell.py    → thesis-mayan-ai/tools/onnx/
```

Los logs, cachés, archivos temporales, credenciales, corpus privado y modelos grandes
deben permanecer fuera del repositorio público.

La migración conviene realizarla en una rama como `agent-hailo-integration`. Después
de revisar los cambios, se puede integrar a `main`. Drive seguirá siendo el espacio
para notebooks y archivos pesados; GitHub conservará código, documentación y
referencias reproducibles.

## Ventajas y límites

Esta organización evita duplicar el contexto del proyecto y permite que un agente
encuentre primero las reglas y la descripción global antes de modificar una línea de
código. También mantiene separadas la investigación académica y los experimentos de
despliegue.

El formato agéntico no sustituye la documentación académica ni garantiza que un agente
respete técnicamente una restricción. Las reglas deben complementarse con rutas claras,
revisiones Git y exclusión de secretos y datos privados.

