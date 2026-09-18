# Plan de ejecución hacia el primer HEF

**Categoría:** `docs`  
**Fecha:** 2026-09-18  
**Modelo:** `mau-cr/mayan_best_model`  
**Destino:** Hailo-10H; Raspberry Pi 5 sólo después de obtener un HEF válido.

## Decisión

El siguiente experimento es un reintento controlado de compilación del frontend
`audio [1,64000] → [1,199,1280]`. No se modifica el ONNX original ni se vuelve a
integrar el grafo completo. Si el mismo error del allocator persiste, el
frontend se divide en dos subredes: Conv1--Conv4 y Conv5--Conv7 más proyección.

Esta decisión parte de resultados registrados el 2026-09-18: el pipeline ONNX
particionado conserva FP32 hasta logits, el parser acepta las subredes, y la
primera corrida de `optimize()` llegó a la asignación de hardware pero terminó
con `BackendAllocatorException: buffers key conv1_ws doesn't exist`. No hay
HEF, ejecución HailoRT ni mediciones locales de sistema.

## Experimento 1: reintento sin cambiar el grafo

1. Usar DFC 5.4.0, `hw_arch="hailo10h"`, ventana fija `[1,64000]` y el mismo
   candidato frontend validado.
2. Generar calibración autorizada en `/content`, sin texto ni identificadores.
   Usar las 128 ventanas existentes; ampliar a 1,024 sólo si el acceso al
   dataset lo permite. La corrida anterior consumió 64 ejemplos efectivos.
3. Conservar fuera de Git el HAR, el HEF si existe, el ALLS generado y el log
   completo. Registrar hashes/rutas, tamaño y versión del entorno en el
   cuaderno.
4. Repetir con el parámetro del compilador sugerido por DFC:
   `performance_param(compiler_optimization_level=max)`. No usarlo como prueba
   de calidad: es una variante de asignación.
5. Si se genera un HEF, comparar la salida cuantizada/emulada con la referencia
   ONNX antes de mover el artefacto a la Pi.

## Criterio de bifurcación

Si el reintento vuelve a fallar en el allocator con `conv1_ws`, se deja de
intentar el frontend monolítico. Se generan dos candidatos nuevos, cada uno con
contratos explícitos, ONNX Runtime FP32 y su propia calibración:

| Subred | Entrada | Salida esperada |
|---|---|---|
| `frontend_a` | audio `[1,64000]` | activación posterior a Conv4 |
| `frontend_b` | activación de `frontend_a` | proyección `[1,199,1280]` |

No se corta capa por capa: dos bloques reducen transferencias y aíslan el límite
de asignación conservando límites naturales del extractor. La partición es una
hipótesis de compilación; requiere nueva equivalencia y no debe presentarse como
inferencia Hailo.

## Secuencia posterior

1. Obtener y validar un HEF de `frontend_a` y `frontend_b`, o del frontend
   completo si el reintento funciona.
2. Compilar por separado la posicional, residual y `encoder48→logits` usando
   activaciones derivadas autorizadas.
3. Verificar numéricamente cada interfaz cuantizada.
4. En Raspberry Pi, comprobar por separado PCIe, versión compatible de
   HailoRT, carga de cada HEF e inferencia encadenada.
5. Ejecutar CTC y KenLM en CPU; sólo entonces medir WER, latencia de extremo a
   extremo, RTF y memoria con audio autorizado.

CTC/KenLM no son el LLM conversacional y permanecen fuera de Hailo en esta
fase. Carcasa, LLM e integración del asistente no bloquean ni sustituyen esta
validación de ASR.

## Limitaciones y fuentes

- La recomendación de 1,024 muestras es una guía de Hailo, no un requisito que
  autorice descargar o conservar más corpus. La calibración sigue dependiendo
  del acceso restringido a `mau-cr/mayan-voice`.
- La cuantización puede degradar el modelo aun si ONNX FP32 es equivalente; se
  debe evaluar el HAR/HEF antes de reportar calidad.
- DFC y HailoRT deben mantenerse en versiones compatibles; esta fase registra
  DFC 5.4.0.

Fuentes: [registro de resultados](RESULTADOS-2026-09-18.md),
[guía de continuidad](CONTINUIDAD-SESION.md),
[Hailo Model Zoo: Optimization](https://github.com/hailo-ai/hailo_model_zoo/blob/master/docs/OPTIMIZATION.rst)
y [changelog 5.4.0](https://github.com/hailo-ai/hailo_model_zoo/blob/master/docs/CHANGELOG.rst).
