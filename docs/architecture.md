# Arquitectura del laboratorio

```text
Datos y corpus
      ↓
Investigación y entrenamiento
      ↓
Modelos ASR / TTS publicados
      ↓
Ejemplos y paquetes reutilizables
      ↓
Aplicaciones, demos y asistente de voz
```

## Límites de cada área

- `projects/`: investigación y pipelines con contexto propio.
- `packages/`: código reutilizable por más de un consumidor.
- `apps/`: aplicaciones ejecutables o desplegables.
- `examples/`: rutas mínimas para aprender a usar los modelos.
- `data/`: datos pequeños, manifiestos y derivados autorizados.
- `docs/`: contexto común, decisiones y estado.

KenLM es parte del decodificador del ASR; no debe confundirse con el modelo de lenguaje conversacional de una aplicación.

