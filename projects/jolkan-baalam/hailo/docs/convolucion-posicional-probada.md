# Convolución posicional probada en Hailo

**Fecha:** 2026-09-17  
**Modelo:** `mau-cr/mayan_best_model`  
**DFC:** Hailo Dataflow Compiler 5.4.0

## Problema original

La convolución posicional se encuentra en:

```text
/wav2vec2/encoder/pos_conv_embed/conv/Conv
```

Aunque conceptualmente es una convolución temporal, el modelo exportado no recibía sus pesos desde un `initializer` directo. Usaba una parametrización `weight_norm` cuyo subgrafo calculaba los pesos durante la ejecución:

```text
ReduceL2 → Div → Mul → Reshape → Conv
```

El DFC no pudo fusionar esa entrada dinámica como kernel de la convolución. Al intentar traducir el modelo completo aparecieron errores internos del fuser y, en algunos candidatos, terminación del proceso por consumo de memoria.

## Transformación aplicada

Se calculó una sola vez el kernel equivalente a partir de los parámetros de `weight_norm`:

```text
w_estático = g · v / ||v||₂
```

La reducción de la norma utilizó los ejes `(0, 1)`, tal como indicaba el grafo original. El resultado se guardó como un `initializer` normal y se eliminaron del candidato los nodos que calculaban dinámicamente el peso:

```text
/wav2vec2/encoder/pos_conv_embed/conv/Conv/WeightReshape4D
/wav2vec2/encoder/pos_conv_embed/conv/weight/weight.0/Constant
/wav2vec2/encoder/pos_conv_embed/conv/weight/weight.0/ReduceL2
/wav2vec2/encoder/pos_conv_embed/conv/weight/weight.0/Div
/wav2vec2/encoder/pos_conv_embed/conv/weight/weight.0/Mul
```

Esto no cambia los pesos efectivos del modelo en inferencia. Solo reemplaza el cálculo de una cantidad constante por su valor ya materializado.

## Representación Conv2D

Para que Hailo aceptara la convolución temporal, se representó como Conv2D con una dimensión espacial artificial de tamaño uno:

```text
peso:       (1280, 80, 1, 128)
grupos:     16
kernel:     [1, 128]
padding:    [0, 64, 0, 64]
entrada:    [1, 1280, 1, 199]
salida:     [1, 1280, 1, 200]
```

El grafo conserva después la conversión de forma y el recorte temporal que devuelve la longitud a 199 posiciones:

```text
Reshape → Conv2D → Reshape3D → Slice → activación
```

Se evitó conservar el `Transpose` 3D inmediatamente asociado a esta convolución. Esa variante provocaba un fallo del DFC, mientras que la representación mediante `Reshape` fue aceptada.

## Validación numérica

La comparación entre la convolución con pesos dinámicos y la versión con pesos estáticos produjo:

```text
Salida dinámica:  (1, 199, 38)
Salida estática:  (1, 199, 38)
Error máximo:     4.696846008300781e-05
Error medio:      2.107142336171819e-06
```

La equivalencia se verificó con ONNX Runtime usando la misma entrada de audio. Los inicializadores de `weight_norm` dejaron de utilizarse en el candidato, como se esperaba.

## Validación con Hailo

La convolución aislada pasó el parser:

```text
PARSER OK: Conv2D posicional mínima
```

También pasó el subgrafo con las transformaciones de forma, el recorte y la activación:

```text
PARSER OK: Reshape -> Conv2D -> Reshape3D -> Slice
PARSER OK: bloque pos_conv sin Transpose
```

Posteriormente, el bloque Transformer completo y el encoder acumulativo utilizaron esta representación estática de la convolución posicional.

## Alcance y limitaciones

- La materialización de los pesos no altera la inferencia; los pesos de una capa entrenada son constantes durante la ejecución.
- Las formas estáticas de la prueba fijan una ventana de 199 posiciones del encoder, equivalente aproximadamente a cuatro segundos de audio a 16 kHz.
- Los audios más cortos deben rellenarse y los más largos deben segmentarse en ventanas.
- El parser aprobado demuestra compatibilidad estructural, pero no sustituye la cuantización, la compilación a HEF ni la prueba de latencia en Raspberry Pi.

## Referencia experimental

El procedimiento está implementado en la notebook documental de Hailo dentro de `thesis-mayan-ai/notebooks/onnx_hailo/`. Los candidatos se generan en `/content` y el ONNX original no se sobrescribe.
