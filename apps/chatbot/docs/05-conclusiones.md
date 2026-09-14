---
id: conclusiones
title: Conclusiones
sidebar_label: Conclusiones
sidebar_position: 7
description: Síntesis de hallazgos, validación de la hipótesis y trabajo futuro.
keywords: [conclusiones, síntesis, hipótesis, trabajo futuro, preservación lingüística]
---

# Conclusiones

El trabajo **confirma la hipótesis planteada**: un corpus modesto de maya yucateco, debidamente
organizado, es suficiente para **describir computacionalmente la lengua** y para llevar un modelo
E2E preentrenado a un **desempeño razonable** —WER cercano al **40 %** con 240 minutos de audio, y
hasta **30 puntos** de ganancia gracias al modelo de lenguaje.

## Síntesis de hallazgos

- Se construyó un **corpus público** de ≈ 4 horas, segmentado a nivel de enunciado, organizado en
  dos subcorpus complementarios.
- El **análisis léxico y acústico** reprodujo patrones lingüísticos esperados (ley de Zipf, glotal
  que no se repite, triángulo vocálico), lo que **valida la calidad** del corpus.
- El **ajuste fino de `mms-1b-all`** demostró la utilidad del corpus, y el **modelo de lenguaje**
  resultó decisivo en un contexto de bajos recursos.

## Contribución

Más allá de las métricas, el proyecto aporta a la **inclusión digital**: construir un corpus público
en maya yucateco reduce la brecha que afecta a las lenguas originarias y abre la puerta a
herramientas de aprendizaje, subtitulado y accesibilidad que fortalezcan la **transmisión
intergeneracional** de la lengua. El mismo flujo es **transferible** a otras lenguas indígenas
mexicanas.

## Limitaciones

- **Desbalance de género** (mayor proporción de voces masculinas).
- **Concentración** del material narrativo en pocos hablantes.
- Volumen de audio **insuficiente** para el alineamiento forzado con Kaldi.

## Trabajo futuro

1. **Ampliar y diversificar** el corpus: más voces femeninas y registros conversacionales naturales.
2. **Integrar el ASR** en flujos de documentación lingüística (transcripción asistida).
3. **Retomar Kaldi** con un corpus enriquecido para producir modelos ligeros migrables a **Vosk**,
   viables para inferencia **en tiempo real** (Raspberry Pi, móviles).

> En conjunto, este trabajo establece una **base metodológica reproducible** y evidencia el potencial
> de la IA para fortalecer la presencia digital del Maya Yucateco.
