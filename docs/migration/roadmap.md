# Hoja de ruta de migración a KINAI

## Completado en esta fase

- Identidad de laboratorio KINAI.
- Portal README.
- Contrato raíz para agentes.
- Guía de contribución.
- Documentación inicial de arquitectura, estado, almacenamiento, modelos y dataset.
- Ubicación de la aplicación chatbot en `apps/chatbot/`.
- Kaldi clasificado bajo `projects/legacy/`.

## Siguiente fase

- Importar el chatbot desde `maya-asr-chatbot` conservando historial.
- Auditar variables de entorno, despliegue y enlaces antiguos.
- Crear ejemplos ejecutables de ASR y TTS.
- Añadir CI para documentación, Python, frontend y secretos.
- Añadir plantilla de PR, `CODEOWNERS` y etiquetas.

## Fases posteriores

- Extraer `mayanlab` y `ytclip` como paquetes cuando existan pruebas mínimas.
- Clasificar `speech-collector`.
- Completar inventario de Drive.
- Activar protección de `main`.
- Probar el agente maestro primero en modo observador y después con merge limitado.

