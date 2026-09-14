# ASR maya yucateco

## Modelo recomendado

- Hugging Face: [`mau-cr/mayan_best_model`](https://huggingface.co/mau-cr/mayan_best_model)
- Base: `facebook/mms-1b-all`
- Lengua objetivo: maya yucateco, código `yua`
- Entrenamiento: adapters de lengua sobre corpus propio
- Decodificación publicada: greedy y KenLM 3-gramas según el flujo evaluado

El corpus de entrenamiento permanece restringido. Consultar la ficha del dataset antes de reutilizarlo.

## Uso

El ejemplo mínimo está reservado para `examples/asr/`; debe mantenerse sincronizado con el processor y la revisión publicada del modelo. No fijar referencias a `latest` en resultados científicos.

## Limitaciones

Las métricas dependen de la normalización, el conjunto de hablantes, el decoder y la versión exacta del modelo. La documentación debe distinguir resultados publicados de inferencias comprobadas localmente.

