# Estado del proyecto

Última revisión: 2026-09-16.

## Activo

- Corpus y pipeline de construcción en `projects/corpus/`.
- Análisis lingüístico y acústico en `projects/analysis/`.
- Fine-tuning y evaluación de MMS en `projects/mms_asr/`.
- Modelo ASR publicado `mau-cr/mayan_best_model`.
- Chatbot importado en `apps/chatbot/`.

## Experimental

- Prototipo de asistente Jolkan-Baalam y ejecución del ASR en Hailo: `projects/jolkan-baalam/`.
- El frontend Conv2D, la convolución posicional con pesos estáticos y el Transformer 0 completo pasan el parser de Hailo-10H; aún no hay HEF ni inferencia en Raspberry Pi.
- Uso del modelo TTS publicado dentro de una aplicación integrada.

## Archivado

- Pipeline Kaldi en `projects/legacy/kaldi_asr/`.

## Pendiente

- Validar numéricamente el Transformer 0 completo y extender la prueba a más bloques.
- Ejecutar calibración, cuantización y generar un HEF funcional.
- Comprobar HailoRT, latencia y RTF en Raspberry Pi.
- Auditar el inventario real de Google Drive.
- Resolver el estado de las grabaciones propias y sus permisos.
- Completar ejemplos ASR/TTS ejecutables.
- Establecer CI y protección de `main` en GitHub.
- Definir licencia del código y condiciones particulares de datos y modelos.
