# Continuidad de sesión: ASR maya en Hailo-10H

**Última actualización:** 2026-09-18
**Modelo:** `mau-cr/mayan_best_model`
**Hardware objetivo:** Hailo-10H en Raspberry Pi 5

## Objetivo

Evaluar si el ASR MMS adaptado a maya yucateco puede dividirse en subgrafos compatibles con Hailo-10H, manteniendo el modelo original como referencia.

## Entorno y almacenamiento

- DFC 5.4.0 en `/content/dfc-env`, con Python 3.10.21.
- La compilación se realiza en Google Colab; la Raspberry Pi todavía no participa.
- El ONNX original y `model.onnx_data` están en `thesis-mayan-ai/models/onnx/mayan_model_repo/onnx/` dentro de Drive.
- Los candidatos se generan en `/content` y no sustituyen el modelo original.
- La notebook organizada es `compile_mayan_asr_hailo_organizada.ipynb`.

## Modelo confirmado

- ONNX IR 8, opset 18 y 3906 nodos.
- Entrada original: `[batch, sequence_length]`.
- Salida: `[batch, tiempo, 38]`.
- Siete convoluciones `Conv1D` en el extractor y una convolución posicional.
- 48 bloques Transformer con adapter específico de YUA.
- La prueba usa `[1,64000]`: aproximadamente cuatro segundos a 16 kHz, que producen 199 posiciones del encoder.

## Resultados confirmados

1. El parser original falla en `/wav2vec2/feature_extractor/Unsqueeze`.
2. La conversión `Conv1D → Reshape → Conv2D → Reshape` del extractor fue aceptada por Hailo.
3. ONNX Runtime confirmó equivalencia del extractor: salida `(1,199,38)`, error máximo aproximado `1.89e-4` y error medio `9.61e-6`.
4. La convolución posicional usa `group=16`, kernel temporal 128 y padding `[0,64,0,64]` como Conv2D.
5. Sus pesos `weight_norm` se materializaron como initializer estático. La comparación dinámica/estática produjo error máximo `4.70e-5` y error medio `2.11e-6`.
6. El extractor Conv2D y el extractor más proyección pasan el parser de forma aislada. La posicional compatible es el bloque histórico sin `Transpose`: entrada y salida `[1,1280,199]`, `Reshape → Conv2D → Reshape3D → Slice → GELU`. También pasa una suma residual aislada con dos entradas de ese layout.

### Encoder y logits CTC

Hailo aceptó por separado y después integrado en un único candidato:

```text
LayerNorm → atención Q/K/V → Softmax y MatMul → out_proj y residual
→ FFN/GELU y residual → adapter YUA y residual
```

El candidato del Transformer 0 pasó el parser y la equivalencia FP32 exacta.

Después, el candidato acumulativo de los 48 Transformers pasó el parser DFC con
entrada `[1,199,1280]` y salida en
`/wav2vec2/encoder/layers.47/Add_2`. La traducción tardó aproximadamente 72.57
segundos.

El candidato `/content/mayan_encoder48_logits/model.onnx` añade al final:

```text
LayerNormalization final → lm_head/MatMul → lm_head/Add → logits [1,199,38]
```

La validación FP32 del candidato completo desde activaciones hasta logits produjo
error absoluto máximo, medio y relativo máximo `0.0`. La comparación también fue
exacta en la salida de los Transformers, la normalización final y la salida de
`lm_head/MatMul`.

Para preservar esos resultados, los pesos externos de los Transformers se usan
desde el archivo existente mediante un hardlink local dentro del directorio del
candidato. Los pesos finales se guardan como archivos externos locales. Cargar y
volver a serializar todos los pesos externos produjo una divergencia FP32 y no se
debe repetir ese método.

## Integración, calibración y límites

El parser aprobado demuestra que el subgrafo del encoder es traducible por el
DFC; todavía no demuestra cuantización, generación de HEF, latencia ni
inferencia en Raspberry Pi. El candidato actual del encoder recibe activaciones,
no audio. El pipeline ONNX particionado hasta logits fue validado con error
máximo `4.86850739e-4` y medio `1.49634570e-5`; el ONNX unido continúa
terminando con `-9` en DFC, por lo que la partición es deliberada.

Se prepararon 128 ventanas autorizadas de `mau-cr/mayan-voice` en `/content` y
las activaciones para frontend, posicional, residual y encoder. No se guardaron
audio, transcripciones ni identificadores en Git. Falta ejecutar y validar la
cuantización/compilación de cada HEF. Ver el registro detallado en
[`RESULTADOS-2026-09-18.md`](RESULTADOS-2026-09-18.md).

Las formas estáticas fijan el tamaño de la ventana, no el contenido del audio. La aplicación podrá rellenar audios cortos y segmentar audios largos en ventanas de aproximadamente cuatro segundos.

## Pendientes inmediatos

1. Cuantizar/compilar frontend con audio real de calibración.
2. Cuantizar/compilar posicional, residual y encoder con sus activaciones.
3. Validar interfaces cuantizadas e integrar HailoRT en Raspberry Pi.
4. Ejecutar CTC/KenLM en CPU con audio autorizado y medir WER, latencia y RTF.

El decoder CTC y KenLM se mantienen fuera de Hailo en esta fase; no deben confundirse con el LLM conversacional de Jolkan-Baalam.
