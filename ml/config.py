"""
Centralized ML configuration.

This module is intentionally independent of Django (`django.conf.settings`)
so that the `ml` package — datasets, model architecture, training,
evaluation — can be imported and run standalone (e.g. `python -m
ml.training.train` from a terminal, or on a training machine that never
runs the Django app at all). The `analysis` app's services read these same
values through the thin wrappers in `analysis/services/`, so there is a
single source of truth even though Django never imports this module
directly for settings.

All values are overridable via environment variables / `.env`, so nothing
below is a hardcoded path or magic number that has to be edited by hand to
run on a different machine.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _env_bool(name, default):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name, default):
    return int(os.environ.get(name, default))


def _env_float(name, default):
    return float(os.environ.get(name, default))


def _env_str(name, default):
    return os.environ.get(name, default)


# --- Class labels ---
# Order matters: index 0/1/2 map directly to model output logits and to
# every probability tuple stored in the database.
CLASS_NAMES = ["CN", "MCI", "AD"]
NUM_CLASSES = len(CLASS_NAMES)

# --- Paths ---
DATASET_ROOT = Path(_env_str("DATASET_ROOT", str(BASE_DIR / "dataset")))
WEIGHTS_DIR = Path(_env_str("ML_WEIGHTS_DIR", str(BASE_DIR / "ml" / "weights")))
MEDIA_ROOT = BASE_DIR / "media"
GRADCAM_DIR = MEDIA_ROOT / "gradcam"
ATTENTION_DIR = MEDIA_ROOT / "attention"
REPORTS_DIR = MEDIA_ROOT / "reports"
EVAL_ARTIFACTS_DIR = BASE_DIR / "ml" / "evaluation" / "artifacts"

for _d in (WEIGHTS_DIR, GRADCAM_DIR, ATTENTION_DIR, REPORTS_DIR, EVAL_ARTIFACTS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# --- Device ---
DEVICE_PREFERENCE = _env_str("DEVICE", "auto")  # "auto" | "cuda" | "cpu"


def get_device():
    import torch

    if DEVICE_PREFERENCE == "cpu":
        return torch.device("cpu")
    if DEVICE_PREFERENCE == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("DEVICE=cuda was requested but CUDA is not available.")
        return torch.device("cuda")
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


# --- Model architecture configuration ---
MODEL_CONFIG = {
    "num_classes": NUM_CLASSES,
    "image_size": _env_int("IMAGE_SIZE", 224),
    "in_channels": 3,
    # CNN branch
    "cnn_backbone": _env_str("CNN_BACKBONE", "resnet50"),
    "cnn_pretrained": _env_bool("CNN_PRETRAINED", True),
    "cnn_feature_dim": _env_int("CNN_FEATURE_DIM", 2048),
    "cnn_freeze_backbone": _env_bool("CNN_FREEZE_BACKBONE", False),
    "cnn_dropout": _env_float("CNN_DROPOUT", 0.3),
    # Swin branch
    "swin_backbone": _env_str("SWIN_BACKBONE", "swin_tiny_patch4_window7_224"),
    "swin_pretrained": _env_bool("SWIN_PRETRAINED", True),
    "swin_feature_dim": _env_int("SWIN_FEATURE_DIM", 768),
    "swin_freeze_backbone": _env_bool("SWIN_FREEZE_BACKBONE", False),
    "swin_dropout": _env_float("SWIN_DROPOUT", 0.3),
    # Fusion
    "fusion_method": _env_str("FUSION_METHOD", "attention_gated"),
    "fusion_dim": _env_int("FUSION_DIM", 512),
    "fusion_dropout": _env_float("FUSION_DROPOUT", 0.3),
    "fusion_attention_heads": _env_int("FUSION_ATTENTION_HEADS", 4),
    # Classifier head
    "classifier_hidden_dim": _env_int("CLASSIFIER_HIDDEN_DIM", 256),
    "classifier_dropout": _env_float("CLASSIFIER_DROPOUT", 0.4),
}

# --- Training configuration ---
TRAINING_CONFIG = {
    "batch_size": _env_int("BATCH_SIZE", 16),
    "epochs": _env_int("EPOCHS", 50),
    "learning_rate": _env_float("LEARNING_RATE", 1e-4),
    "weight_decay": _env_float("WEIGHT_DECAY", 1e-5),
    "optimizer": _env_str("OPTIMIZER", "adamw"),  # adamw | adam | sgd
    "scheduler": _env_str("SCHEDULER", "cosine"),  # cosine | step | plateau | none
    "num_workers": _env_int("NUM_WORKERS", 2),
    "seed": _env_int("SEED", 42),
    "mixed_precision": _env_bool("MIXED_PRECISION", True),
    "early_stopping_patience": _env_int("EARLY_STOPPING_PATIENCE", 10),
    "early_stopping_metric": _env_str("EARLY_STOPPING_METRIC", "val_f1_macro"),
    "grad_clip_norm": _env_float("GRAD_CLIP_NORM", 5.0),
    "class_imbalance_strategy": _env_str("CLASS_IMBALANCE_STRATEGY", "weighted_ce"),
    # weighted_ce | weighted_sampler | focal_loss | none
    "focal_loss_gamma": _env_float("FOCAL_LOSS_GAMMA", 2.0),
    "checkpoint_every_epoch": _env_bool("CHECKPOINT_EVERY_EPOCH", False),
}

# --- Data / augmentation configuration ---
DATA_CONFIG = {
    "image_size": MODEL_CONFIG["image_size"],
    "allowed_extensions": [".jpg", ".jpeg", ".png"],
    "normalize_mean": [0.485, 0.456, 0.406],  # ImageNet stats (both backbones pretrained on ImageNet)
    "normalize_std": [0.229, 0.224, 0.225],
    "augment": {
        "enabled": _env_bool("AUGMENT_ENABLED", True),
        "rotation_degrees": _env_float("AUGMENT_ROTATION_DEGREES", 10.0),
        # Horizontal flip is scientifically inappropriate for brain MRI in
        # general (left/right asymmetry is diagnostically meaningful in
        # neuroimaging), so it defaults OFF and must be opted into.
        "horizontal_flip": _env_bool("AUGMENT_HORIZONTAL_FLIP", False),
        "horizontal_flip_prob": _env_float("AUGMENT_HFLIP_PROB", 0.5),
        "random_crop_scale_min": _env_float("AUGMENT_CROP_SCALE_MIN", 0.9),
        "brightness_jitter": _env_float("AUGMENT_BRIGHTNESS", 0.1),
        "contrast_jitter": _env_float("AUGMENT_CONTRAST", 0.1),
        "affine_translate": _env_float("AUGMENT_AFFINE_TRANSLATE", 0.05),
    },
}

# --- MRI quality-assessment thresholds ---
QUALITY_CONFIG = {
    "min_quality_score": _env_float("MIN_QUALITY_SCORE", 0.5),
    "min_width": _env_int("QUALITY_MIN_WIDTH", 64),
    "min_height": _env_int("QUALITY_MIN_HEIGHT", 64),
    "blur_variance_threshold": _env_float("QUALITY_BLUR_THRESHOLD", 100.0),
    "min_mean_brightness": _env_float("QUALITY_MIN_BRIGHTNESS", 10.0),
    "max_mean_brightness": _env_float("QUALITY_MAX_BRIGHTNESS", 245.0),
    "min_std_contrast": _env_float("QUALITY_MIN_CONTRAST", 5.0),
    "near_empty_std_threshold": _env_float("QUALITY_NEAR_EMPTY_STD", 2.0),
    # Structural MRI slices are effectively grayscale. This is a heuristic
    # domain check (Hasler & Süsstrunk colorfulness metric), not a trained
    # "is this actually a brain MRI" classifier — no labeled non-MRI
    # dataset exists to train one. It reliably rejects ordinary color
    # photos/screenshots while passing true grayscale scans (including
    # ones with minor JPEG chroma-subsampling noise).
    "max_colorfulness": _env_float("QUALITY_MAX_COLORFULNESS", 15.0),
    # Real MRI tissue produces a continuous spread of gray levels (dark
    # CSF, mid-gray matter, bright white matter). A document/spreadsheet/
    # text screenshot is overwhelmingly near-pure-white background plus
    # near-pure-black text, with almost no true midtones — this catches
    # that kind of non-scan image even when it's monochrome (so the
    # colorfulness check above wouldn't flag it). Heuristic, not a
    # trained classifier — see quality_check.py.
    "midtone_low": _env_int("QUALITY_MIDTONE_LOW", 30),
    "midtone_high": _env_int("QUALITY_MIDTONE_HIGH", 225),
    "min_midtone_fraction": _env_float("QUALITY_MIN_MIDTONE_FRACTION", 0.12),
}

# --- Uncertainty estimation ---
UNCERTAINTY_CONFIG = {
    "method": _env_str("UNCERTAINTY_METHOD", "mc_dropout"),  # mc_dropout | entropy | margin
    "mc_dropout_passes": _env_int("MC_DROPOUT_PASSES", 20),
    "low_threshold": _env_float("UNCERTAINTY_LOW_THRESHOLD", 0.15),
    "high_threshold": _env_float("UNCERTAINTY_HIGH_THRESHOLD", 0.35),
}

# --- Demo mode ---
DEMO_MODE = _env_bool("DEMO_MODE", True)
