# Continuidad de sesión: ASR maya en Hailo-10H

**Fecha de corte:** 2026-09-13  
**Repositorio:** `thesis-mayan-ai`  
**Subproyecto:** `projects/hailo/`

## Objetivo

Integrar el pipeline `audio → ASR → texto → LLM → texto → TTS → audio` para maya yucateco usando `mau-cr/mayan_best_model` y `mau-cr/mms-tts-yua-6voces`. La prioridad actual es evaluar si el ASR MMS-1B puede compilarse para Hailo-10H.

## Almacenamiento

El ONNX original y sus datos externos están en Drive:

```text
gdrive:thesis-mayan-ai/models/onnx/mayan_model_repo/onnx/model.onnx
gdrive:thesis-mayan-ai/models/onnx/mayan_model_repo/onnx/model.onnx_data
```

La única ruta de Drive autorizada para modificar es `gdrive:thesis-mayan-ai`. El original no se sobrescribe. Candidatos temporales se generan en `/content` y se pierden al desconectar Colab.

## Entorno

El DFC 5.4.0 se instaló en `/content/dfc-env` con Python 3.10.21. Python 3.13 falló por dependencias antiguas (`matplotlib==3.5.2`, `numpy==1.26.4`, etc.). Colab selecciona automáticamente la A100 como GPU 0; la GPU acelera la compilación, pero no corrige incompatibilidades del grafo.

## Modelo confirmado

- ONNX IR 8, opset 18.
- 3906 nodos.
- Entrada dinámica `[batch, sequence_length]`.
- Salida `[batch, tiempo, 38]`.
- 48 bloques Transformer.
- Siete Conv1D en el feature extractor.
- Una Conv1D posicional en `encoder/pos_conv_embed`.

## Experimentos confirmados

1. El parser original falló en `/wav2vec2/feature_extractor/Unsqueeze` con `KeyError: ONNXGraphNode`.
2. Ese nodo usa `axis=1` y transforma `[B,T]` en `[B,1,T]`.
3. Reemplazarlo por un `Reshape` permitió avanzar hasta Conv1D.
4. Convertir las siete Conv1D del frontend a Conv2D permitió que Hailo aceptara la primera capa y luego el frontend completo.
5. La convolución posicional requiere `group=16`, kernel temporal 128 y padding `[0,64,0,64]` en Conv2D.
6. Los pesos posicionales se generan dinámicamente por `weight_norm`; el fuser de Hailo falla al recibirlos como entrada dinámica.
7. ONNX Runtime confirmó equivalencia de la copia Conv2D:

```text
Original:   (1, 199, 38)
Candidata:  (1, 199, 38)
Error máximo: aproximadamente 0.00019–0.00020
```

8. El parser aislado de la primera Conv2D y el parser del frontend de siete Conv2D terminaron correctamente.
9. El parser hasta la convolución posicional todavía falla por los pesos dinámicos. El parser del grafo completo también produjo un ciclo interno de Hailo; no hay nombres ni salidas duplicadas en el ONNX candidato.

## Estado

```text
ONNX original validado                 ✓
Entorno DFC/Python 3.10                ✓
Frontend de 7 Conv2D                   ✓ parser Hailo
Equivalencia numérica                  ✓
Pesos posicionales estáticos            pendiente
Parser posicional                      pendiente
48 bloques Transformer                 pendiente
HAR / cuantización / HEF               pendiente
Ejecución en Raspberry Pi              pendiente
```

## Siguiente paso exacto

Materializar una sola vez los pesos calculados por `weight_norm` para la convolución posicional y sustituir su subgrafo dinámico por un initializer estático en una copia temporal. Validar con ONNX Runtime y volver a probar el parser hasta esa capa. Después probar el encoder completo; si falla, ampliar por grupos de bloques Transformer.

No iniciar cuantización, HEF ni cambios de drivers de la Pi hasta obtener un grafo traducible.

## Archivos de este subproyecto

- `README.md`: proceso técnico detallado ONNX → HAR → HEF.
- `docs/CONTINUIDAD-SESION.md`: estado exacto y siguiente paso.
- `docs/posible-migracion-a-formato-agentico.md`: propuesta para organizar el repositorio para agentes.
- `AGENTS.md`: reglas operativas del área Hailo.
- `tools/conv1d_to_conv2d_colab_cell.py`: transformación candidata para copiar a Colab.
