# Resultados de integración y calibración — 2026-09-18

## Alcance

Se trabajó con `mau-cr/mayan_best_model`, DFC 5.4.0 y la ventana estática de
audio `[1,64000]` (aproximadamente 4 s a 16 kHz). Los candidatos y derivados
viven temporalmente en `/content`; el ONNX original y sus datos externos no se
modifican.

## Estructura validada

```text
audio [1,64000]
→ extractor Conv2D + proyección [1,199,1280]
→ Transpose de interfaz [1,1280,199]
→ posicional Hailo [1,1280,199]
→ suma residual Hailo [1,1280,199]
→ Transpose de interfaz [1,199,1280]
→ 48 Transformers + LayerNorm + lm_head
→ logits [1,199,38]
→ CTC/KenLM en CPU (pendiente de ejecución)
```

Los cambios de layout son de interfaz entre subredes; no cambian valores.

## Evidencia por componente

| Componente | Contrato | Resultado |
|---|---|---|
| Extractor Conv2D | audio → `[1,199,512]` | Parser DFC aprobado. |
| Extractor + proyección | audio → `[1,199,1280]` | Parser DFC aprobado. |
| Posicional | `[1,1280,199]` → `[1,1280,199]` | Parser aprobado para `Reshape → Conv2D → Reshape3D → Slice → GELU`. |
| Suma residual | dos `[1,1280,199]` → `[1,1280,199]` | Parser DFC aprobado. |
| Encoder | `[1,199,1280]` → logits `[1,199,38]` | 48 Transformers + cabeza CTC: parser y equivalencia FP32 exacta. |

La posicional usa una Conv2D estática con 16 grupos, 80 canales por grupo y
kernel temporal 128. Los pesos `weight_norm` se materializaron como
initializer. La prueba histórica mostró que el patrón
`Transpose → Reshape → Conv2D` termina con `-9`; el bloque probado recibe su
entrada directamente en layout canal-primero y no incluye el `Transpose` final.

## Validación del pipeline particionado

Se ejecutó ONNX Runtime por subred con el mismo audio sintético determinista y
se comparó con el ONNX original de audio a logits. Resultado:

```text
Referencia y candidato: [1,199,38]
Error absoluto máximo: 4.86850739e-04
Error absoluto medio: 1.49634570e-05
Error relativo máximo: 7.62926117e-02
```

La diferencia es consistente con las conversiones previas Conv1D→Conv2D y
posicional estática; no se introdujo una diferencia adicional al particionar.
Un ONNX único audio→logits también fue construido y validado, pero DFC termina
con `-9` al traducir el grafo completo. Esto no invalida el ONNX: justifica la
partición para Hailo.

## Calibración

Se autenticó Hugging Face mediante `notebook_login()` sin registrar tokens. El
dataset `mau-cr/mayan-voice` expone configuración `default`, split `train` y
columnas `audio`, `maya`, `utt_id`, `spk_id`; los últimos dos y la transcripción
no se guardaron en derivados de calibración.

Se tomaron en streaming 128 ventanas, se convirtieron a mono, se recortaron o
rellenaron a 64,000 muestras y se normalizaron por ventana (media 0, varianza
1). Se guardaron solo temporalmente en `/content` como tensores de audio y
activaciones. No se añadieron datos, audio, transcripciones ni tokens al repo.

## Primer intento de cuantización y compilación del frontend

Se ejecutó `translate_onnx_model()`, `optimize()` y `compile()` para el
frontend audio→proyección usando las ventanas autorizadas. La traducción y la
optimización finalizaron: DFC realizó calibración, `LayerNorm Decomposition`,
recolección de estadísticas, corrección de sesgo y análisis de ruido. El SNR de
salida comunicado por DFC fue `-6.277 dB`; es una señal que debe evaluarse con
una comparación cuantizada posterior, no una prueba de calidad ASR.

DFC redujo el nivel de optimización a 1 porque el conjunto entregado era menor
que las 1024 muestras recomendadas. En la fase de asignación al hardware, el
frontend no pudo ubicarse como un solo contexto: varias Conv y LayerNorm no
obtuvieron asignación y el backend terminó con:

```text
BackendAllocatorException: buffers key conv1_ws doesn't exist
```

No se produjo HEF. El fallo ocurre después de validar ONNX y calibrar; no
demuestra un problema con el audio de calibración ni con la equivalencia FP32.
Es un límite o error interno de asignación de DFC 5.4.0 que debe preservarse en
el log `/content/compile_frontend_hef.log`.

La estrategia acordada es: (1) un reintento controlado con más calibración y
ajustes de compilación antes de transformar el grafo; (2) si el mismo error se
repite, dividir el frontend en dos bloques razonables (Conv1–Conv4 y
Conv5–Conv7 más proyección), no capa por capa; (3) si ambos fallan, investigar
configuración/versión oficial de DFC o reconsiderar el reparto de aceleración.

## CTC y KenLM

`lm_head` produce logits, no texto. CTC greedy/beam search, vocabulario y
KenLM se ejecutarán en CPU. La notebook incluye preflight de
`pyctcdecode`/`kenlm` y rutas del vocabulario y `lm_3gram.arpa`, pero no se ha
medido todavía una transcripción real ni latencia de decodificación.

## Próximos pasos

1. Reintentar la compilación del frontend con calibración/configuración
   reforzada y comparar el resultado de asignación.
2. Si persiste el fallo, dividir el frontend en dos bloques y volver a compilar.
3. Solo tras obtener HEF del frontend, generar HEF de posicional, residual y
   encoder usando las activaciones ya derivadas.
4. Validar entradas/salidas cuantizadas y ejecutar los HEF secuencialmente con
   HailoRT en la Raspberry Pi 5.
5. Añadir CTC/KenLM en CPU y medir WER, latencia, RTF y memoria con audio
   autorizado.

Ningún HEF ni inferencia en Raspberry Pi está confirmado aún.
