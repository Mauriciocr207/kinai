# Instrucciones para agentes

Kinai es un laboratorio para investigar y construir un asistente de voz y tecnología de voz en maya yucateco.

## Antes de trabajar

1. Leer `README.md` y `docs/status.md`.
2. Leer el `AGENTS.md` más cercano al área modificada.
3. Revisar `git status` y no sobrescribir cambios existentes.
4. Identificar si la tarea afecta código, datos, modelos, documentación o despliegue.

## Flujo obligatorio

- Crear una rama descriptiva desde `main`.
- Mantener cada PR enfocado en una tarea.
- Ejecutar las validaciones aplicables.
- Abrir un PR; nunca hacer push directo a `main`.
- Documentar fuentes, decisiones, limitaciones y resultados.
- Dejar los conflictos para el agente autor, salvo cambios mecánicos triviales.

## Seguridad y datos

- No guardar tokens, claves ni archivos `.env`.
- No publicar audio, transcripciones o metadatos privados.
- No modificar los datos originales; generar derivados en ubicaciones nuevas.
- No descargar modelos o corpus pesados dentro de Git si pueden referenciarse externamente.
- No cambiar licencias, permisos o políticas de datos sin revisión humana.
- No llamar “reproducible” a un experimento sin indicar qué accesos requiere.

## Clasificación de cambios

Usar una categoría clara: `docs`, `research`, `data`, `model`, `app`, `package`, `infra`, `security` o `legacy`.

## Definición de terminado

- El alcance del PR está completo y delimitado.
- Las pruebas o validaciones aplicables pasan.
- La documentación está actualizada.
- No hay secretos ni datos sensibles nuevos.
- Se explican riesgos y dependencias externas.

Las instrucciones específicas de `projects/hailo/AGENTS.md` complementan estas reglas.

