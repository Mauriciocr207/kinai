# Roadmap de Jolkan-Baalam

Última revisión: 2026-09-14.

## Etapas y criterios de terminado

| Etapa | Resultado esperado | Estado |
|---|---|---|
| Organización | Directorio del prototipo, responsabilidades y rutas documentadas | En curso |
| ASR en Hailo | Grafo traducible, HEF y equivalencia frente al modelo de referencia | Experimental; pendiente resolver pesos posicionales |
| Raspberry Pi | PCIe, controlador, inferencia y métricas comprobadas localmente | Pendiente |
| Prototipo 3D | Diseño, impresión y montaje documentados | Pendiente |
| Asistente integrado | Audio → ASR → LLM → TTS con reparto de ejecución explícito | Pendiente |

## Reglas de validación

- Una publicación en ONNX o PyTorch no demuestra compatibilidad con Hailo.
- Registrar por separado detección del dispositivo, controlador operativo e
  inferencia comprobada.
- Comparar la transcripción del ASR con `mau-cr/mayan_best_model`; el decoder CTC
  y KenLM no son el LLM conversacional.
- Medir WER, latencia y RTF solo después de obtener una ruta de inferencia funcional.
- Conservar los originales y generar candidatos en ubicaciones nuevas.

## Próximos pasos

1. Materializar los pesos `weight_norm` de la convolución posicional en una copia
   temporal del ONNX.
2. Validar equivalencia con ONNX Runtime y repetir el parseo hasta esa capa.
3. Solo si el grafo es traducible, continuar con Transformer, cuantización, HEF y
   pruebas controladas en la Raspberry Pi.
4. Levantar los requisitos físicos de la carcasa antes de diseñar el prototipo 3D.
