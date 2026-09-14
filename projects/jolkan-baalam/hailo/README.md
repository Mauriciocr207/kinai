# Ejecución del ASR de Jolkan-Baalam en Hailo-10H

Esta carpeta contiene las notebooks y experimentos de la etapa Hailo del prototipo
Jolkan-Baalam. Evalúa la ejecución del modelo ASR maya `mau-cr/mayan_best_model` en
una Raspberry Pi 5 con Hailo-10H; no representa por sí sola al asistente completo.

## Objetivo

Convertir progresivamente el modelo de Hugging Face a un formato que Hailo pueda ejecutar:

```text
ONNX + external data
        ↓
Hailo Dataflow Compiler (DFC)
        ↓
HAR
        ↓
calibración y cuantización
        ↓
HEF
        ↓
HailoRT en la Raspberry Pi
```

La compilación se realiza en una máquina x86_64, como Google Colab. La Raspberry Pi no participa en esta etapa.

## Modelo de referencia

El modelo original se encuentra en:

```text
models/onnx/mayan_model_repo/onnx/model.onnx
models/onnx/mayan_model_repo/onnx/model.onnx_data
```

`model.onnx_data` es obligatorio: el ONNX utiliza external data y ambos archivos deben mantenerse juntos. El modelo original es de referencia y no debe sobrescribirse.

Entrada experimental:

```text
input_values: [1, 64000]
```

Esto representa cuatro segundos de audio mono a 16 kHz, con padding cuando sea necesario.

## Entorno de compilación

El runtime estándar de Colab usa Python 3.13, que no es compatible con las dependencias fijadas por DFC 5.4.0. La notebook crea un entorno separado:

```text
/content/dfc-env
Python 3.10
hailo-dataflow-compiler 5.4.0
```

El wheel autorizado se instala desde:

```text
tools/hailo_dfc/
```

La GPU de Colab puede acelerar partes de la compilación. El mensaje `Selected GPU: 0` indica selección automática de la GPU disponible; no implica que el modelo vaya a ejecutarse en esa GPU.

## Notebooks

- `mms_yua_onnx_transform.ipynb`: exportación e inspección del ONNX.
- `compile_mayan_asr_hailo.ipynb`: instalación del DFC, validación y pruebas de parseo.

## Estado del primer parseo

El DFC 5.4.0 pudo cargar y restaurar el ONNX completo, incluyendo external data, pero falló durante la traducción del grafo con:

```text
KeyError: ONNXGraphNode
```

La inspección identificó el primer nodo problemático:

```text
/wav2vec2/feature_extractor/Unsqueeze
```

Ese nodo recibe:

```text
input_values
/wav2vec2/feature_extractor/Constant_output_0
```

El `Constant` contiene `[1]`, por lo que la operación es `Unsqueeze(axis=1)` y transforma:

```text
[batch, tiempo] → [batch, 1, tiempo]
```

Desactivar el simplificador del DFC produjo el mismo fallo. La GPU no es la causa del error.

## Candidato actual

La notebook crea una copia temporal en Colab:

```text
/content/mayan_asr_candidate_unsqueeze_reshape/model.onnx
/content/mayan_asr_candidate_unsqueeze_reshape/model.onnx_data
```

En esa copia se reemplaza únicamente el `Unsqueeze` por un `Reshape` equivalente usando la forma `[0, 1, -1]`. El ONNX original permanece intacto.

El siguiente paso es ejecutar la celda **Parsear candidato Unsqueeze → Reshape**. El resultado esperado es uno de estos:

- `PARSER OK`: continuar con inspección del HAR y preparar calibración.
- Otro error: identificar el siguiente límite del traductor antes de hacer más cambios.

La copia solo debe persistirse dentro de `models/onnx/candidates/` después de confirmar que el parser la acepta.

## Reglas experimentales

- No sobrescribir el ONNX original.
- Mantener siempre juntos `model.onnx` y `model.onnx_data`.
- Probar una transformación por vez.
- Conservar el traceback completo de cada fallo.
- No cuantizar ni compilar a HEF hasta obtener un grafo traducible.
- Mantener el decoder CTC y KenLM fuera de Hailo inicialmente.
## Resultado del candidato Reshape

El reemplazo del primer `Unsqueeze(axis=1)` permitió que el parser avanzara hasta la primera convolución. El siguiente error fue:

```text
IndexError en get_dynamic_kernel_shape()
```

La inspección del grafo confirmó que el frontend contiene siete convoluciones `Conv1D`:

```text
conv_layers.0: [512, 1, 10], stride 5
conv_layers.1–4: [512, 512, 3], stride 2
conv_layers.5–6: [512, 512, 2], stride 2
```

El DFC está intentando interpretar esas entradas como tensores de cuatro dimensiones, por lo que el problema no es la GPU. El candidato temporal tampoco se persiste todavía.

El próximo experimento debe conservar el original y probar una copia donde el frontend `Conv1D` se represente como `Conv2D` con una dimensión espacial de tamaño 1. Esto requiere transformar pesos, kernels y formas intermedias de las siete capas, y validar equivalencia antes de volver a ejecutar el parser. Si el coste o la compatibilidad resultan desfavorables, el frontend se mantendrá en CPU y se evaluará un subgrafo Hailo posterior.
## Proceso de adaptación del ONNX para Hailo

El ONNX original se conserva como referencia y no se sobrescribe. Cada experimento se genera como una copia temporal y se prueba primero con ONNX Runtime antes de enviarlo al DFC.

### 1. Entrada y `Unsqueeze` inicial

El modelo original recibe `input_values` con forma `[batch, tiempo]` y usa `Unsqueeze(axis=1)` para obtener `[batch, 1, tiempo]`. El DFC dejó este nodo fuera de alcance. La copia candidata lo reemplaza por un `Reshape` equivalente.

### 2. Frontend Conv1D

Las siete capas del feature extractor son `Conv1D`. El traductor DFC espera una representación de convolución de cuatro dimensiones, por lo que cada kernel se transforma de:

```text
[out_channels, in_channels, kernel]
```

a:

```text
[out_channels, in_channels, 1, kernel]
```

Se insertan `Reshape` antes y después de cada convolución para alternar entre `[B,C,T]` y `[B,C,1,T]`. Las formas temporales se fijan para una entrada de 64000 muestras:

```text
64000 → 12799 → 6399 → 3199 → 1599 → 799 → 399 → 199
```

El frontend completo de siete convoluciones ya fue aceptado por el parser Hailo.

### 3. Convolución posicional

El encoder contiene una octava `Conv1D` posicional con `group=16`, kernel temporal 128 y padding 64 a cada lado. También se transforma a Conv2D, conservando grupos y padding. Su salida temporal intermedia es 200 y el grafo original recorta una posición para volver a 199.

Sus pesos son generados por una subred de `weight_norm`, no por un initializer directo. El DFC falla al intentar tratar esa entrada como pesos dinámicos. El siguiente experimento consiste en materializar esos pesos una sola vez y guardarlos como un initializer estático.

### 4. Validación de equivalencia

La copia Conv2D produce la misma forma de salida que el original:

```text
Original:   (1, 199, 38)
Candidata:  (1, 199, 38)
Error máximo observado: aproximadamente 0.00019
```

Esto confirma que las transformaciones del frontend y de la convolución posicional conservan el comportamiento numérico dentro de la precisión esperada.

### 5. Estrategia de parseo

El parser se prueba por subgrafos para localizar límites sin modificar todo el modelo a ciegas:

```text
primera Conv2D                 ✓
7 Conv2D del frontend          ✓
convolución posicional         pendiente por pesos dinámicos
48 bloques Transformer         todavía no probados
proyección CTC                 todavía no probada
```

Una vez resuelta la convolución posicional se intentará el encoder completo. Si falla, se ampliarán los bloques Transformer por grupos para localizar el primer límite.

No se ejecutan todavía cuantización, calibración ni compilación a HEF.
## Historial de experimentos exploratorios

Estos experimentos se discutieron durante el desarrollo. Algunas celdas se retiraron de la notebook principal para conservar un flujo limpio, pero sus resultados se mantienen aquí.

| Experimento | Resultado | Decisión |
|---|---|---|
| Parser del ONNX original | `KeyError` en `/wav2vec2/feature_extractor/Unsqueeze` | Investigar la operación antes de modificar el modelo |
| Parser con `disable_onnx_simplifier=True` | Mismo `KeyError` | El simplificador no era la causa |
| Inspección del `Unsqueeze` | `axis=1`; convierte `[B,T]` en `[B,1,T]` | Reemplazarlo por un `Reshape` equivalente en una copia |
| Candidato solo con `Unsqueeze → Reshape` | Fallo en `get_dynamic_kernel_shape()` de la primera Conv1D | Convertir el frontend a Conv2D |
| Conv1D→Conv2D con formas dinámicas | ONNX Runtime rechazó atributos y formas dinámicas | Usar atributos 2-D y formas estáticas |
| Conv1D→Conv2D con formas estáticas | Equivalencia numérica confirmada; salida `(1,199,38)` | Conservar como candidato de trabajo |
| Parser de la primera Conv2D | `PARSER OK` | La representación Conv2D es aceptada |
| Parser de las siete Conv2D del frontend | `PARSER OK` | El frontend completo es compatible |
| Conversión de la convolución posicional | Requirió conservar `group=16`, padding temporal y pesos dinámicos | Materializar los pesos de `weight_norm` |
| Parser hasta la convolución posicional | Falla del fuser con pesos dinámicos | No continuar al Transformer hasta hacerlos estáticos |
| Candidato con formas/padding incorrectos | Errores de ONNX Runtime y ciclo interno de Hailo | Descartar esas copias y conservar solo el original y el candidato validado |

La métrica de equivalencia observada para el candidato Conv2D fue:

```text
Error máximo: aproximadamente 0.00019
Error medio: aproximadamente 0.00001
```

Estos resultados son evidencia de desarrollo y deben distinguirse de las métricas finales del sistema. Para el paper se reportarán como parte de la metodología de adaptación y de los estudios de compatibilidad, mientras que WER, latencia y RTF se medirán únicamente después de obtener un HEF funcional.

