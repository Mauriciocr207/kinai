# EjecuciÃ³n del ASR de Jolkan-Baalam en Hailo-10H

Esta carpeta documenta la evaluaciÃ³n del ASR maya `mau-cr/mayan_best_model` para el prototipo Jolkan-Baalam. El objetivo actual es investigar la compatibilidad del grafo con Hailo-10H; todavÃ­a no es una integraciÃ³n completa del asistente.

## Flujo

```text
ONNX + external data â†’ DFC â†’ HAR â†’ calibraciÃ³n/cuantiÂ­zaciÃ³n â†’ HEF â†’ HailoRT en Raspberry Pi
```

La compilaciÃ³n se realiza en x86_64/Google Colab. La Raspberry Pi se incorporarÃ¡ despuÃ©s de obtener un artefacto HEF y una ruta de inferencia validada.

## Referencias

- ASR: `mau-cr/mayan_best_model`.
- TTS: `mau-cr/mms-tts-yua-6voces`.
- ONNX: `models/onnx/mayan_model_repo/onnx/model.onnx` y `model.onnx_data`.
- Notebook organizada: `compile_mayan_asr_hailo_organizada.ipynb` en `thesis-mayan-ai/notebooks/onnx_hailo/` dentro de Drive.
- Notebook documental: [`notebooks/compile_mayan_asr_hailo_documentacion.ipynb`](notebooks/compile_mayan_asr_hailo_documentacion.ipynb).
- GuÃ­a para leer y continuar el registro: [`docs/guia-notebook-onnx-a-hef.md`](docs/guia-notebook-onnx-a-hef.md).
- Plan acotado para obtener el primer HEF: [`docs/plan-ejecucion-hef-2026-09-18.md`](docs/plan-ejecucion-hef-2026-09-18.md).
- Registro de la continuidad reproducible y la notebook de Drive: [`docs/SESION-2026-09-18-continuidad-reproducible.md`](docs/SESION-2026-09-18-continuidad-reproducible.md).

## Estado actual â€” 2026-09-18

El DFC 5.4.0 acepta el frontend convertido a Conv2D, la convoluciÃ³n posicional con pesos estÃ¡ticos y el Transformer 0 completo. El Transformer probado incluye atenciÃ³n, FFN/GELU, residuales y adapter YUA.

Las conversiones se realizan sobre copias temporales. El ONNX original no se sobrescribe.

## Decisiones tÃ©cnicas

- Las convoluciones 1D se representan como Conv2D con una dimensiÃ³n espacial de tamaÃ±o uno.
- Los pesos de `weight_norm` de la convoluciÃ³n posicional se calculan una vez y se guardan como initializer estÃ¡tico. Esto no altera la inferencia; elimina una subred de pesos dinÃ¡micos que el fuser no acepta.
- Las formas internas de atenciÃ³n se fijan para la ventana experimental `[1,199,1280]`. La duraciÃ³n aproximada es cuatro segundos de audio a 16 kHz.
- El `Transpose` 3D de la convoluciÃ³n posicional no se conserva dentro del candidato Hailo; el layout se resuelve con `Reshape` y Conv2D. Los `Transpose` de la atenciÃ³n sÃ­ fueron aceptados en el candidato del Transformer 0.
- CTC y KenLM se mantienen fuera de Hailo inicialmente.

## Validaciones disponibles

- Equivalencia del extractor Conv2D: error mÃ¡ximo aproximado `1.89e-4`.
- Equivalencia de pesos posicionales estÃ¡ticos: error mÃ¡ximo aproximado `4.70e-5`.
- ValidaciÃ³n numÃ©rica FP32 del Transformer 0: formas `(1,199,1280)` en referencia y candidato, con errores absoluto y relativo mÃ¡ximos `0.0`.
- Parser aprobado para los 48 Transformers encadenados.
- Candidato `encoder48â†’logits` validado en FP32: desde `[1,199,1280]` hasta logits `[1,199,38]`, con error absoluto y relativo mÃ¡ximos `0.0` frente al subgrafo original.
- El extractor Conv2D y el extractor mÃ¡s proyecciÃ³n pasan el parser por separado. El recorrido completo audioâ†’logits conserva FP32 (error mÃ¡ximo aproximado `4.87e-4`), pero un Ãºnico grafo DFC termina con `-9`.
- La posicional compatible se ejecuta como subred independiente en layout canal-primero `[1,1280,199]`: `Reshape â†’ Conv2D â†’ Reshape3D â†’ Slice â†’ GELU`, sin los `Transpose` de interfaz. Pasa el parser, al igual que la suma residual con dos entradas en ese mismo layout.
- El pipeline ONNX particionado `frontend â†’ posicional â†’ residual â†’ encoder48â†’logits` fue validado hasta logits con error mÃ¡ximo `4.86850739e-4` y medio `1.49634570e-5` frente al ONNX original.
- Se prepararon 128 ventanas autorizadas de calibraciÃ³n desde `mau-cr/mayan-voice`, en `/content` y sin guardar texto ni identificadores. La optimizaciÃ³n del frontend terminÃ³, pero la asignaciÃ³n DFC fallÃ³ con `BackendAllocatorException: buffers key conv1_ws doesn't exist`; aÃºn no hay HEF.

Estos son resultados de parseo y equivalencia de candidatos. No son todavÃ­a mÃ©tricas de sistema: faltan HEF, cuantizaciÃ³n, WER, latencia, RTF y prueba en Raspberry Pi.

## PrÃ³ximo paso

Reintentar la compilaciÃ³n del frontend con calibraciÃ³n/configuraciÃ³n reforzada; si falla igual, dividirlo en dos bloques antes de continuar con las demÃ¡s subredes.

