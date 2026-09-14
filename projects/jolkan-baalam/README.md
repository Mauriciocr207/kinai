# Jolkan-Baalam

Primer prototipo de asistente de voz para maya yucateco.

Jolkan-Baalam integra las etapas necesarias para pasar de una interacción de voz
a una respuesta hablada:

```text
audio → ASR → texto → LLM → texto → TTS → audio
```

## Alcance del prototipo

Este proyecto reúne dos líneas que deben evolucionar coordinadamente:

- `hailo/`: adaptación y ejecución experimental del ASR en una Raspberry Pi 5
  con Hailo-10H.
- `hardware/3d-prototype/`: diseño, fabricación e impresión 3D de la carcasa y
  componentes físicos del prototipo.

La integración completa todavía no está terminada. El ASR y el TTS de referencia
son `mau-cr/mayan_best_model` y `mau-cr/mms-tts-yua-6voces`; cualquier sustitución
debe compararse contra ellos.

## Etapas

1. **Organización y definición:** delimitar interfaces, artefactos y criterios de
   validación del prototipo.
2. **Conversión del ASR:** obtener un grafo traducible por Hailo y, después, un
   artefacto HEF validado.
3. **Ejecución edge:** comprobar detección PCIe, controlador, inferencia y
   rendimiento en la Raspberry Pi por separado.
4. **Prototipo físico:** diseñar e imprimir la carcasa y montar la electrónica.
5. **Integración de voz:** conectar audio, ASR, LLM y TTS, documentando qué parte
   corre en CPU, Hailo o servicios remotos.

El estado y los criterios de salida de cada etapa están en
[`docs/roadmap.md`](docs/roadmap.md).

## Punto de partida técnico

La línea Hailo está documentada en [`hailo/README.md`](hailo/README.md). El
frontend del ASR ya tiene un candidato Conv2D con equivalencia numérica observada;
la materialización de los pesos de la convolución posicional es el siguiente paso.
No se debe modificar la Raspberry Pi ni iniciar cuantización antes de resolver el
parseo del grafo.

Los modelos originales, el corpus privado y los artefactos pesados permanecen en
sus almacenamientos autorizados y no deben copiarse a Git.
