# Ejecución del ASR de Jolkan-Baalam en Hailo-10H

Esta carpeta documenta la evaluación del ASR maya `mau-cr/mayan_best_model` para el prototipo Jolkan-Baalam. El objetivo actual es investigar la compatibilidad del grafo con Hailo-10H; todavía no es una integración completa del asistente.

## Flujo

```text
ONNX + external data → DFC → HAR → calibración/cuanti­zación → HEF → HailoRT en Raspberry Pi
```

La compilación se realiza en x86_64/Google Colab. La Raspberry Pi se incorporará después de obtener un artefacto HEF y una ruta de inferencia validada.

## Referencias

- ASR: `mau-cr/mayan_best_model`.
- TTS: `mau-cr/mms-tts-yua-6voces`.
- ONNX: `models/onnx/mayan_model_repo/onnx/model.onnx` y `model.onnx_data`.
- Notebook organizada: `compile_mayan_asr_hailo_organizada.ipynb` en `thesis-mayan-ai/notebooks/onnx_hailo/` dentro de Drive.
- Notebook documental: [`notebooks/compile_mayan_asr_hailo_documentacion.ipynb`](notebooks/compile_mayan_asr_hailo_documentacion.ipynb).
- Guía para leer y continuar el registro: [`docs/guia-notebook-onnx-a-hef.md`](docs/guia-notebook-onnx-a-hef.md).

## Estado actual — 2026-09-18

El DFC 5.4.0 acepta el frontend convertido a Conv2D, la convolución posicional con pesos estáticos y el Transformer 0 completo. El Transformer probado incluye atención, FFN/GELU, residuales y adapter YUA.

Las conversiones se realizan sobre copias temporales. El ONNX original no se sobrescribe.

## Decisiones técnicas

- Las convoluciones 1D se representan como Conv2D con una dimensión espacial de tamaño uno.
- Los pesos de `weight_norm` de la convolución posicional se calculan una vez y se guardan como initializer estático. Esto no altera la inferencia; elimina una subred de pesos dinámicos que el fuser no acepta.
- Las formas internas de atención se fijan para la ventana experimental `[1,199,1280]`. La duración aproximada es cuatro segundos de audio a 16 kHz.
- El `Transpose` 3D de la convolución posicional no se conserva dentro del candidato Hailo; el layout se resuelve con `Reshape` y Conv2D. Los `Transpose` de la atención sí fueron aceptados en el candidato del Transformer 0.
- CTC y KenLM se mantienen fuera de Hailo inicialmente.

## Validaciones disponibles

- Equivalencia del extractor Conv2D: error máximo aproximado `1.89e-4`.
- Equivalencia de pesos posicionales estáticos: error máximo aproximado `4.70e-5`.
- Validación numérica FP32 del Transformer 0: formas `(1,199,1280)` en referencia y candidato, con errores absoluto y relativo máximos `0.0`.
- Parser aprobado para los 48 Transformers encadenados.
- Candidato `encoder48→logits` validado en FP32: desde `[1,199,1280]` hasta logits `[1,199,38]`, con error absoluto y relativo máximos `0.0` frente al subgrafo original.
- El extractor Conv2D y el extractor más proyección pasan el parser por separado. El recorrido completo audio→logits conserva FP32 (error máximo aproximado `4.87e-4`), pero un único grafo DFC termina con `-9`.
- La posicional compatible se ejecuta como subred independiente en layout canal-primero `[1,1280,199]`: `Reshape → Conv2D → Reshape3D → Slice → GELU`, sin los `Transpose` de interfaz. Pasa el parser, al igual que la suma residual con dos entradas en ese mismo layout.
- El pipeline ONNX particionado `frontend → posicional → residual → encoder48→logits` fue validado hasta logits con error máximo `4.86850739e-4` y medio `1.49634570e-5` frente al ONNX original.
- Se prepararon 128 ventanas autorizadas de calibración desde `mau-cr/mayan-voice`, en `/content` y sin guardar texto ni identificadores. La optimización del frontend terminó, pero la asignación DFC falló con `BackendAllocatorException: buffers key conv1_ws doesn't exist`; aún no hay HEF.

Estos son resultados de parseo y equivalencia de candidatos. No son todavía métricas de sistema: faltan HEF, cuantización, WER, latencia, RTF y prueba en Raspberry Pi.

## Próximo paso

Reintentar la compilación del frontend con calibración/configuración reforzada; si falla igual, dividirlo en dos bloques antes de continuar con las demás subredes.
