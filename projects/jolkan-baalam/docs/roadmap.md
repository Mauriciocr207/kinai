# Roadmap de Jolkan-Baalam

Última revisión: 2026-09-18.

## Etapas y criterios de terminado

| Etapa | Resultado esperado | Estado |
|---|---|---|
| Organización | Directorio del prototipo, responsabilidades y rutas documentadas | En curso |
| ASR en Hailo | Grafo traducible, HEF y equivalencia frente al modelo de referencia | Experimental; pipeline ONNX particionado validado; primera compilación del frontend falla en allocator DFC |
| Raspberry Pi | PCIe, controlador, inferencia y métricas comprobadas localmente | Pendiente |
| Prototipo 3D | Diseño, impresión y montaje documentados | Pendiente |
| Asistente integrado | Audio → ASR → LLM → TTS con reparto de ejecución explícito | Pendiente |

## Reglas de validación

- Una publicación en ONNX o PyTorch no demuestra compatibilidad con Hailo.
- Registrar por separado detección del dispositivo, controlador operativo e inferencia comprobada.
- Comparar la transcripción del ASR con `mau-cr/mayan_best_model`; el decoder CTC y KenLM no son el LLM conversacional.
- Medir WER, latencia y RTF solo después de obtener una ruta de inferencia funcional.
- Conservar los originales y generar candidatos en ubicaciones nuevas.

## Próximos pasos

1. Reintentar el frontend con calibración/configuración reforzada; si persiste, dividirlo en dos bloques.
2. Repetir para posicional, suma residual y encoder48→logits; validar interfaces cuantizadas.
3. Implementar el encadenamiento HailoRT y medir la ruta hasta logits en Raspberry Pi.
4. Añadir CTC/KenLM en CPU y medir calidad, latencia y RTF.
5. Levantar los requisitos físicos de la carcasa antes de diseñar el prototipo 3D.
