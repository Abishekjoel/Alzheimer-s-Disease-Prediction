"""
Reusable image preprocessing pipeline shared by training, evaluation, and
production inference, so predictions are never made through a different
transform than the model was trained/evaluated with.

Training-time augmentation deliberately excludes horizontal flipping by
default (see ml.config.DATA_CONFIG["augment"]["horizontal_flip"]) because
brain hemispheres are not interchangeable in neuroimaging — atrophy
patterns relevant to Alzheimer's diagnosis can be asymmetric, so mirroring
the image would corrupt clinically meaningful signal rather than being a
harmless label-preserving augmentation (unlike, e.g., natural photographs).
"""

import io
import logging

import cv2
import numpy as np
import torch
import torchvision.transforms as T
from PIL import Image

from ml.config import DATA_CONFIG

logger = logging.getLogger("ml")


def load_image(source) -> Image.Image:
    """Loads an image from a file path, file-like object, or raw bytes and
    normalizes it to RGB. Grayscale MRI scans are replicated across 3
    channels so they are compatible with ImageNet-pretrained backbones."""
    if isinstance(source, (bytes, bytearray)):
        source = io.BytesIO(source)
    img = Image.open(source)
    img.load()
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img


def apply_contrast_enhancement(array: np.ndarray) -> np.ndarray:
    """Optional CLAHE (Contrast Limited Adaptive Histogram Equalization) on
    the luminance channel — improves visibility of soft-tissue structure in
    low-contrast MRI slices without amplifying noise the way global
    histogram equalization would."""
    lab = cv2.cvtColor(array, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)


def apply_denoising(array: np.ndarray) -> np.ndarray:
    """Optional light denoising for noisy scans. Uses a conservative
    fast Non-Local Means filter rather than aggressive blurring, since
    over-smoothing can erase the fine structural detail the model relies on."""
    return cv2.fastNlMeansDenoisingColored(array, None, h=5, hColor=5, templateWindowSize=7, searchWindowSize=21)


def build_inference_transform(image_size=None):
    """Deterministic preprocessing used for validation, test, and
    production inference: resize -> tensor -> ImageNet normalization.
    No randomness, so the same input always produces the same tensor.
    Accepts either a numpy array (e.g. straight from MRIDataset/OpenCV) or
    a PIL Image, since T.ToPILImage() is a no-op passthrough for the latter."""
    size = image_size or DATA_CONFIG["image_size"]
    return T.Compose([
        T.ToPILImage(),
        T.Resize((size, size)),
        T.ToTensor(),
        T.Normalize(mean=DATA_CONFIG["normalize_mean"], std=DATA_CONFIG["normalize_std"]),
    ])


def build_training_transform(image_size=None, augment_config=None):
    """Stochastic preprocessing used only for the training split. Every
    augmentation is individually configurable (ml.config.DATA_CONFIG) and
    disabled entirely by setting augment.enabled=False."""
    size = image_size or DATA_CONFIG["image_size"]
    cfg = augment_config or DATA_CONFIG["augment"]

    steps = [T.ToPILImage(), T.Resize((size, size))]

    if cfg["enabled"]:
        crop_scale_min = cfg["random_crop_scale_min"]
        steps.append(T.RandomResizedCrop(size, scale=(crop_scale_min, 1.0)))

        if cfg["horizontal_flip"]:
            steps.append(T.RandomHorizontalFlip(p=cfg["horizontal_flip_prob"]))

        steps.append(T.RandomAffine(
            degrees=cfg["rotation_degrees"],
            translate=(cfg["affine_translate"], cfg["affine_translate"]),
        ))
        steps.append(T.ColorJitter(
            brightness=cfg["brightness_jitter"],
            contrast=cfg["contrast_jitter"],
        ))

    steps.append(T.ToTensor())
    steps.append(T.Normalize(mean=DATA_CONFIG["normalize_mean"], std=DATA_CONFIG["normalize_std"]))
    return T.Compose(steps)


def preprocess_for_inference(image: Image.Image, image_size=None, enhance_contrast=False, denoise=False) -> torch.Tensor:
    """End-to-end: PIL image -> normalized model-ready tensor of shape
    (3, H, W). Used by the production inference pipeline
    (analysis.services.prediction / analysis_pipeline)."""
    array = np.array(image)

    if denoise:
        array = apply_denoising(array)
    if enhance_contrast:
        array = apply_contrast_enhancement(array)

    transform = build_inference_transform(image_size)
    return transform(array)


def visualize_preprocessing(image: Image.Image, out_path, augment_config=None, n_augmented=4):
    """Research utility (Phase 3): saves a side-by-side figure of the
    original image plus several sampled training-augmentation outputs, so
    augmentation behavior can be visually inspected rather than trusted
    blindly. Returns the saved file path."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    train_transform = build_training_transform(augment_config=augment_config)
    array = np.array(image)

    fig, axes = plt.subplots(1, n_augmented + 1, figsize=(3 * (n_augmented + 1), 3))
    axes[0].imshow(array)
    axes[0].set_title("original")
    axes[0].axis("off")

    mean = np.array(DATA_CONFIG["normalize_mean"])
    std = np.array(DATA_CONFIG["normalize_std"])

    for i in range(n_augmented):
        tensor = train_transform(array)
        denorm = tensor.permute(1, 2, 0).numpy() * std + mean
        denorm = np.clip(denorm, 0, 1)
        axes[i + 1].imshow(denorm)
        axes[i + 1].set_title(f"augmented #{i + 1}")
        axes[i + 1].axis("off")

    fig.tight_layout()
    fig.savefig(out_path, dpi=120)
    plt.close(fig)
    return out_path
