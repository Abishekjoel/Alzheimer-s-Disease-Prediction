import numpy as np
import torch

from analysis.services.preprocessing import (
    build_inference_transform,
    build_training_transform,
    load_image,
    preprocess_for_inference,
)
from ml.config import DATA_CONFIG


def test_load_image_converts_grayscale_to_rgb(tmp_path):
    from PIL import Image

    gray_path = tmp_path / "gray.png"
    Image.fromarray((np.random.rand(64, 64) * 255).astype("uint8"), mode="L").save(gray_path)

    img = load_image(str(gray_path))
    assert img.mode == "RGB"


def test_inference_transform_output_shape_and_normalization(synthetic_pil_image):
    tensor = preprocess_for_inference(synthetic_pil_image, image_size=224)
    assert tensor.shape == (3, 224, 224)
    assert isinstance(tensor, torch.Tensor)


def test_inference_transform_is_deterministic(synthetic_pil_image):
    array = np.array(synthetic_pil_image)
    transform = build_inference_transform(image_size=128)
    t1 = transform(array)
    t2 = transform(array)
    assert torch.allclose(t1, t2)


def test_training_transform_disabled_matches_inference_shape(synthetic_pil_image):
    array = np.array(synthetic_pil_image)
    augment_off = dict(DATA_CONFIG["augment"])
    augment_off["enabled"] = False
    transform = build_training_transform(image_size=224, augment_config=augment_off)
    tensor = transform(array)
    assert tensor.shape == (3, 224, 224)


def test_training_transform_produces_varying_output(synthetic_pil_image):
    array = np.array(synthetic_pil_image)
    transform = build_training_transform(image_size=224)
    t1 = transform(array)
    t2 = transform(array)
    # With random augmentation enabled, repeated calls should (almost
    # certainly) differ.
    assert not torch.allclose(t1, t2)


def test_default_augmentation_config_excludes_horizontal_flip():
    assert DATA_CONFIG["augment"]["horizontal_flip"] is False
