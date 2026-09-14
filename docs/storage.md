# Almacenamiento y fuentes de verdad

| Recurso | Fuente principal | En Git |
|---|---|---|
| Código, notebooks y documentación | Repositorio KINAI | Sí |
| Audio original y datos privados | Google Drive controlado | No |
| Modelos publicados | Hugging Face | Referencia y ejemplos |
| Datasets públicos o restringidos | Hugging Face | Referencia y manifiestos |
| Resultados pesados | Drive o Hugging Face | Resumen, métricas y enlace |

El repositorio actual documenta recursos en `MyDrive/thesis-mayan-ai/`, especialmente vocabulario, KenLM, modelos ONNX y resultados de Colab. Ese inventario debe verificarse directamente en Drive antes de migrar o eliminar cualquier archivo.

Reglas:

- El audio original nunca se modifica.
- Los derivados se generan en carpetas nuevas.
- Las rutas locales deben configurarse mediante variables, no quedar codificadas en notebooks públicos.
- Cada artefacto importante debe indicar versión, fecha, origen y permisos.
- Drive no es automáticamente una fuente pública ni autoriza redistribución.

