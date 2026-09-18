# Sesión 2026-09-18: continuidad reproducible ONNX → HEF

**Categoría:** `docs`  
**Modelo:** `mau-cr/mayan_best_model`  
**Objetivo:** conservar una ruta reproducible y legible hacia los HEF del ASR
particionado, sin repetir exploraciones históricas.

## Fuentes y almacenamiento revisados

- `projects/jolkan-baalam/`, roadmap y documentación Hailo de Kinai.
- Copia activa de Drive: `thesis-mayan-ai` en `H:\Mi unidad`, particularmente
  la notebook organizada y el ONNX con external data.
- La copia histórica en `I:` no contiene la línea ONNX/Hailo activa.

No se modificaron datos, audio ni el ONNX original. El README antiguo de Drive
es contexto histórico; los registros de Kinai y la notebook organizada contienen
el estado técnico más reciente.

## Estado confirmado

- DFC 5.4.0 acepta los candidatos del frontend Conv2D, posicional
  canal-primero, residual y encoder de 48 Transformers hasta logits CTC.
- El pipeline ONNX particionado conserva FP32 de audio a logits con error máximo
  `4.86850739e-4` y medio `1.49634570e-5` frente al ONNX original.
- El ONNX unido audio→logits termina con `-9` en DFC; la partición es
  intencional y no invalida su equivalencia ONNX.
- El primer intento de compilar el frontend alcanzó calibración, pero el
  allocator falló con `BackendAllocatorException: buffers key conv1_ws doesn't
  exist`. No hay HEF, HailoRT ni prueba en Raspberry Pi confirmados.
- Hay 128 ventanas autorizadas de calibración temporales en `/content`, sin
  texto ni identificadores; la primera corrida consumió 64.

## Arquitectura y HEF objetivo

```text
audio [1,64000]
  → frontend.hef → [1,199,1280]
  → CPU Transpose → [1,1280,199]
  → positional.hef + residual.hef → [1,1280,199]
  → CPU Transpose → [1,199,1280]
  → encoder48_logits.hef → logits [1,199,38]
  → CPU CTC + KenLM → texto
```

Son cuatro HEF. Si la variante base y
`compiler_optimization_level=max` repiten `conv1_ws`, `frontend.hef` se
sustituye por `frontend_a.hef` (Conv1–Conv4) y `frontend_b.hef` (Conv5–Conv7
más proyección), para un total de cinco HEF.

## Notebook de continuidad en Drive

`notebooks/onnx_hailo/continuar_frontend_a_hef.ipynb` se organizó así:

1. Entorno DFC y ONNX de referencia.
2. Transformaciones compartidas Conv1D→Conv2D y pesos posicionales estáticos.
3. Construcción y parseo de candidatos: frontend, posicional, residual y
   encoder48+logits.
4. Equivalencia FP32 del encadenamiento y calibración/activaciones autorizadas.
5. Generación de HEF: `frontend.hef` activo; `positional.hef`, `residual.hef`
   y `encoder48_logits.hef` con llamadas reales, bloqueadas por
   `RUN_*_HEF = False` hasta validar el frontend.
6. CTC/KenLM en CPU a partir de logits producidos por HailoRT.
7. Registro de entorno, candidato, calibración, logs, HEF y estado.

Un candidato ONNX parseado no equivale a un HEF generado. Sólo el frontend se
debe compilar en la siguiente sesión; los HEF posteriores están preparados, no
aprobados.

## Validaciones de la notebook

- JSON Jupyter v4 válido, sin salidas guardadas.
- Sintaxis Python validada estáticamente; los magics de Colab se neutralizaron
  sólo durante esta comprobación.
- Se corrigieron secuencias mojibake y caracteres de control heredados. La
  notebook queda en UTF-8, sin caracteres de reemplazo.
- No se ejecutó DFC, no se descargó corpus adicional y no se generó un HEF en
  esta sesión.

## Próxima ejecución y límites

1. Ejecutar hasta la compilación base de `frontend.hef`, guardando HAR, ALLS,
   log y HEF fuera de Git.
2. Probar `max` sólo si el log base repite `conv1_ws`.
3. Si ambos fallan igual, validar `frontend_a` y `frontend_b`; no continuar con
   los HEF posteriores todavía.
4. Tras validar frontend, habilitar los demás HEF uno por uno; después probar
   HailoRT, CTC/KenLM, WER, latencia, RTF y memoria.

Requiere acceso autorizado a `mau-cr/mayan-voice`, DFC 5.4.0 y el wheel de
Drive. DFC y HailoRT deben ser compatibles. CTC/KenLM es postproceso CPU, no el
LLM conversacional.

Fuentes: [resultados](RESULTADOS-2026-09-18.md),
[continuidad](CONTINUIDAD-SESION.md),
[plan HEF](plan-ejecucion-hef-2026-09-18.md) y
[Hailo Model Zoo](https://github.com/hailo-ai/hailo_model_zoo/blob/master/docs/OPTIMIZATION.rst).
