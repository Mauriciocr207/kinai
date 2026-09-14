# Celda Colab: generar candidato Conv1D → Conv2D
import subprocess

transform_script = r"""
import os
import numpy as np
import onnx
from onnx import helper, numpy_helper

src = "/content/drive/MyDrive/thesis-mayan-ai/models/onnx/mayan_model_repo/onnx/model.onnx"
out_dir = "/content/mayan_asr_candidate_conv2d"
out = os.path.join(out_dir, "model.onnx")
os.makedirs(out_dir, exist_ok=True)

model = onnx.load(src, load_external_data=True)


def add_shape(name, values):
    if not any(item.name == name for item in model.graph.initializer):
        model.graph.initializer.append(
            numpy_helper.from_array(
                np.asarray(values, dtype=np.int64),
                name=name,
            )
        )


shape_input = "mayan_conv2d_input_shape"
# Longitudes estáticas para una entrada de 64000 muestras.
widths = [64000, 12799, 6399, 3199, 1599, 799, 399, 199, 200]
add_shape(shape_input, [1, 1, 1, 64000])
conv_shapes = {}

# [B,T] → [B,1,1,T]
base_nodes = []
replaced_input = False

for node in model.graph.node:
    if node.name == "/wav2vec2/feature_extractor/Unsqueeze":
        base_nodes.append(
            helper.make_node(
                "Reshape",
                ["input_values", shape_input],
                [node.output[0]],
                name=node.name + "_as_reshape4d",
            )
        )
        replaced_input = True
    else:
        base_nodes.append(node)

assert replaced_input, "No se encontró el Unsqueeze inicial"

# Convertir los pesos y atributos de las siete Conv1D a Conv2D.
conv_names = []
dynamic_weight_shapes = {}

for node in base_nodes:
    if (
        node.op_type != "Conv"
        or not (
            "/wav2vec2/feature_extractor/conv_layers." in node.name
            or node.name == "/wav2vec2/encoder/pos_conv_embed/conv/Conv"
        )
    ):
        continue

    conv_names.append(node.name)
    kernel_attr = next(attr for attr in node.attribute if attr.name == "kernel_shape")
    stride_attr = next(attr for attr in node.attribute if attr.name == "strides")
    group_attr = next((attr for attr in node.attribute if attr.name == "group"), None)
    pads_attr = next((attr for attr in node.attribute if attr.name == "pads"), None)

    kernel_size = int(kernel_attr.ints[0])
    stride_size = int(stride_attr.ints[0])
    group_size = int(group_attr.i) if group_attr is not None else 1
    old_pads = list(pads_attr.ints) if pads_attr is not None else [0, 0]
    pad_left, pad_right = int(old_pads[0]), int(old_pads[-1])

    found_weights = False
    input_channels = None
    output_channels = None
    for initializer in model.graph.initializer:
        if initializer.name == node.input[1]:
            found_weights = True
            weights = numpy_helper.to_array(initializer)
            input_channels = int(weights.shape[1])
            output_channels = int(weights.shape[0])
            if weights.ndim != 3:
                raise RuntimeError(
                    f"Forma inesperada {weights.shape} en {node.name}"
                )
            initializer.CopyFrom(
                numpy_helper.from_array(
                    weights[:, :, None, :],
                    name=initializer.name,
                )
            )
            break
    if not found_weights and node.name == "/wav2vec2/encoder/pos_conv_embed/conv/Conv":
        # Los pesos posicionales se generan dentro del grafo: [1280,80,128].
        input_channels = 1280
        output_channels = 1280
        dynamic_weight_shapes[node.name] = "mayan_pos_conv_weight_shape"
        add_shape(dynamic_weight_shapes[node.name], [1280, 80, 1, 128])
    elif not found_weights:
        raise RuntimeError(f"No se encontraron pesos para {node.name}")

    node.ClearField("attribute")
    layer_index = len(conv_names) - 1
    shape_4d = f"mayan_conv2d_shape_4d_{layer_index}"
    shape_3d = f"mayan_conv2d_shape_3d_{layer_index}"
    add_shape(shape_4d, [1, input_channels, 1, widths[layer_index]])
    add_shape(shape_3d, [1, output_channels, widths[layer_index + 1]])
    conv_shapes[node.name] = (shape_4d, shape_3d)

    node.attribute.extend(
        [
            helper.make_attribute("group", group_size),
            helper.make_attribute("kernel_shape", [1, kernel_size]),
            # ONNX Conv2D pads: [top, left, bottom, right].
            helper.make_attribute("pads", [0, pad_left, 0, pad_right]),
            helper.make_attribute("strides", [1, stride_size]),
        ]
    )

# Antes de cada Conv2D: [B,C,T] → [B,C,1,T].
# Después de cada Conv2D: [B,C,1,T] → [B,C,T].
new_nodes = []

for node in base_nodes:
    is_feature_conv = (
        node.op_type == "Conv"
        and node.name in conv_names
    )

    if not is_feature_conv:
        new_nodes.append(node)
        continue

    shape_4d, shape_3d = conv_shapes[node.name]
    old_input = node.input[0]
    input_4d = old_input + "_reshape4d"
    old_output = node.output[0]
    output_4d = old_output + "_conv2d"

    if node.name in dynamic_weight_shapes:
        old_weight = node.input[1]
        weight_4d = old_weight + "_reshape4d"
        node.input[1] = weight_4d
        new_nodes.append(
            helper.make_node(
                "Reshape",
                [old_weight, dynamic_weight_shapes[node.name]],
                [weight_4d],
                name=node.name + "/WeightReshape4D",
            )
        )

    node.input[0] = input_4d
    node.output[0] = output_4d

    new_nodes.append(
        helper.make_node(
            "Reshape",
            [old_input, shape_4d],
            [input_4d],
            name=node.name + "/Reshape4D",
        )
    )
    new_nodes.append(node)
    new_nodes.append(
        helper.make_node(
            "Reshape",
            [output_4d, shape_3d],
            [old_output],
            name=node.name + "/Reshape3D",
        )
    )

model.graph.ClearField("node")
model.graph.node.extend(new_nodes)

onnx.save_model(
    model,
    out,
    save_as_external_data=True,
    all_tensors_to_one_file=True,
    location="model.onnx_data",
    size_threshold=1024,
)

# Validar por ruta para evitar el límite protobuf de 2 GB.
onnx.checker.check_model(out)

print("Candidato creado:", out)
print("External data:", os.path.join(out_dir, "model.onnx_data"))
print("Conv1D convertidas:", len(conv_names))
"""

result = subprocess.run(
    ["/content/dfc-env/bin/python", "-c", transform_script],
    text=True,
    capture_output=True,
)

print(result.stdout)
print(result.stderr)
print("Código de salida:", result.returncode)

if result.returncode:
    raise RuntimeError("No se pudo crear el candidato Conv2D")
