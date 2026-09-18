# Guía de la notebook: ONNX a HEF para Jolkan-Baalam

Esta guía explica cómo leer y mantener la notebook documental
`compile_mayan_asr_hailo_documentacion.ipynb`. La notebook no ejecuta Hailo ni
modifica modelos: registra el razonamiento, las transformaciones, las
validaciones y las decisiones que conducen desde el ASR ONNX hasta un posible
artefacto HEF.

## Ubicación de los artefactos

- Notebook de compilación: `compile_mayan_asr_hailo_organizada.ipynb`.
- Notebook documental: `projects/jolkan-baalam/hailo/notebooks/compile_mayan_asr_hailo_documentacion.ipynb`.
- La notebook de compilación vive en `thesis-mayan-ai/notebooks/onnx_hailo/` dentro de Google Drive; la documental se versiona en este repositorio.
- El ONNX original y `model.onnx_data` permanecen en su almacenamiento
  autorizado. Los candidatos se generan en rutas nuevas y no sobrescriben el
  original.

## Cómo leer el proceso

El flujo documentado es:

```text
ONNX + datos externos
  → transformación de operaciones incompatibles
  → equivalencia numérica
  → parseo DFC
  → bloques Transformer adicionales
  → calibración y cuantización
  → HEF
  → HailoRT en Raspberry Pi
```

Cada etapa debe distinguir tres resultados distintos:

1. **Equivalencia:** el candidato produce valores cercanos al modelo original.
2. **Parseo:** Hailo DFC acepta el grafo.
3. **Ejecución:** el artefacto compilado corre con HailoRT en el hardware.

Que una etapa pase no implica que las siguientes estén resueltas.

## Estado documentado al 2026-09-18

- El parser original falla en el `Unsqueeze` del extractor.
- El extractor Conv1D fue representado como `Reshape → Conv2D → Reshape` y
  aceptado por Hailo.
- La equivalencia observada del extractor tiene error máximo aproximado de
  `1.89e-4`.
- Los pesos `weight_norm` de la convolución posicional fueron materializados
  como un initializer estático.
- La equivalencia observada de esos pesos tiene error máximo aproximado de
  `4.70e-5`.
- El candidato integrado del Transformer 0 pasa el parser de DFC con entrada y
  salida `[1,199,1280]`.
- La validación numérica FP32 del Transformer 0 produjo forma `(1,199,1280)` en
  referencia y candidato, con errores absoluto y relativo máximos `0.0`.
- Los 48 Transformers encadenados pasaron el parser DFC.
- El candidato `encoder48→logits` integra los 48 Transformers, la normalización
  final y `lm_head`, con salida `[1,199,38]` y equivalencia FP32 exacta contra
  el subgrafo original para la entrada experimental.

El pipeline ONNX particionado completo llega a logits con error máximo
`4.86850739e-4`; las subredes son frontend, posicional canal-primero, suma
residual canal-primero y encoder48→logits. El ONNX unido termina con `-9` en
DFC, por lo que los cambios de layout se manejan entre subredes. Se prepararon
128 ventanas autorizadas de calibración de `mau-cr/mayan-voice` en `/content`.

Estos resultados todavía no son un HEF ni una prueba de inferencia. El registro
detallado está en [`RESULTADOS-2026-09-18.md`](RESULTADOS-2026-09-18.md).

## Registro de cada sesión

Al continuar el trabajo, añadir al final de la notebook una sección con:

- fecha y entorno usado;
- modelo y candidato exactos;
- cambio realizado;
- resultado observado;
- comando o celda que lo produjo;
- errores y limitaciones;
- siguiente paso acordado.

Usar las etiquetas **Confirmado**, **Hipótesis** y **Pendiente**. No presentar
un parser aprobado como inferencia funcional ni una métrica publicada como una
medición local.

## Criterio para declarar un HEF válido

Un HEF se considerará válido para este proyecto únicamente cuando:

1. se genere sin errores a partir de un candidato documentado;
2. sus entradas y salidas coincidan con el contrato del subgrafo;
3. se compare numéricamente contra el modelo de referencia;
4. cargue mediante HailoRT;
5. se ejecute en el Hailo-10H objetivo;
6. se registren latencia, RTF, memoria y limitaciones.

La notebook documental debe registrar cada criterio por separado.
