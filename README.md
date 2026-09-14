# Kinai

> Kinai es la plataforma para investigar y construir un asistente de voz y tecnología de voz en maya yucateco.

KINAI es un laboratorio abierto: conserva la investigación, los datos autorizados, los modelos, las herramientas, las aplicaciones y los experimentos que forman el camino hacia el asistente de voz final.

## Qué existe hoy

| Área | Estado | Dónde continuar |
|---|---|---|
| Corpus y anotaciones | Activo; parte privada | [`projects/corpus`](projects/corpus/README.md) |
| ASR maya yucateco | Modelos publicados | [`docs/models/asr.md`](docs/models/asr.md) |
| TTS maya yucateco | Modelo publicado; integración por documentar | [`docs/models/tts.md`](docs/models/tts.md) |
| Análisis lingüístico y acústico | Activo | [`projects/analysis`](projects/analysis/README.md) |
| Chatbot | Prototipo funcional | [`apps/chatbot`](apps/chatbot/README.md) |
| Hailo / edge inference | Experimental | [`projects/hailo`](projects/hailo/README.md) |
| Kaldi | Archivado | [`projects/legacy/kaldi_asr`](projects/legacy/kaldi_asr/README.md) |

## Empezar

- [Visión de KINAI](docs/overview.md)
- [Estado actual y prioridades](docs/status.md)
- [Arquitectura del laboratorio](docs/architecture.md)
- [Modelos ASR](docs/models/asr.md)
- [Modelo TTS](docs/models/tts.md)
- [Contribuir](CONTRIBUTING.md)
- [Trabajar con agentes](docs/development/working-with-agents.md)

Para el entorno Python:

```bash
./tools/install_system_deps.sh
uv sync
uv run ytclip where
```

La aplicación web tiene su propio entorno Node y sus instrucciones en [`apps/chatbot`](apps/chatbot/README.md).

## Dónde viven los artefactos

- Código, notebooks, manifiestos y documentación: este repositorio.
- Audio original y material privado: Google Drive controlado.
- Modelos y datasets publicados: Hugging Face.
- Resultados grandes o temporales: almacenamiento externo documentado.

Consulta [`docs/storage.md`](docs/storage.md) antes de añadir datos o artefactos grandes.

## Alcance actual

El foco es el maya yucateco (`yua`). El corpus publicado permanece restringido por ahora; no se debe inferir autorización de publicación a partir de que un archivo exista localmente o en Drive.

La documentación de la tesis que dio origen a este laboratorio está en [`docs/research/thesis.md`](docs/research/thesis.md).

