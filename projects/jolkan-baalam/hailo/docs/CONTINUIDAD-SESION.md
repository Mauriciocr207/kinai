# Continuidad de sesión: ASR maya en Hailo-10H

**Última actualización:** 2026-09-16
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
6. El parser acepta la convolución posicional en el subgrafo `Reshape → Conv2D → Reshape3D → Slice → activación`, evitando el `Transpose` 3D que provocaba un fallo por consumo de memoria.

### Transformer 0

Hailo aceptó por separado y después integrado en un único candidato:

```text
LayerNorm → atención Q/K/V → Softmax y MatMul → out_proj y residual
→ FFN/GELU y residual → adapter YUA y residual
```

El candidato `/content/mayan_transformer0_completo/model.onnx` pasó el parser con entrada y salida `[1,199,1280]`.

## Limitaciones

El parser aprobado demuestra que el subgrafo es traducible por el DFC; todavía no demuestra cuantización, generación de HEF, equivalencia numérica del bloque completo, latencia ni inferencia en Raspberry Pi.

Las formas estáticas fijan el tamaño de la ventana, no el contenido del audio. La aplicación podrá rellenar audios cortos y segmentar audios largos en ventanas de aproximadamente cuatro segundos.

## Pendientes inmediatos

1. Validar numéricamente el Transformer 0 completo frente al grafo original.
2. Intentar encadenar más bloques Transformer, vigilando el consumo de RAM del DFC.
3. Integrar la salida CTC y decidir qué parte permanece en CPU.
4. Ejecutar calibración, cuantización y compilación a HEF solamente después de obtener un grafo funcional.
5. Medir inferencia en Raspberry Pi: controlador, HailoRT, latencia, RTF y memoria.

El decoder CTC y KenLM se mantienen fuera de Hailo en esta fase; no deben confundirse con el LLM conversacional de Jolkan-Baalam.
