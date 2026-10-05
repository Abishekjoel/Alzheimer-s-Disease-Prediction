"""
Model loading and raw prediction. Kept separate from analysis_pipeline.py
(which orchestrates the full quality-check -> preprocess -> predict ->
explain -> persist flow) so a model can be loaded and queried directly
(e.g. from a management command or a notebook) without touching Django
models or the database.
"""

import logging
import time

import torch

from ml.config import CLASS_NAMES, MODEL_CONFIG, get_device
from ml.models.hybrid_model import HybridCNNSwinModel

logger = logging.getLogger("ml")

_model_cache = {}


def load_model(checkpoint_path=None, model_config=None, device=None):
    """Builds a HybridCNNSwinModel and, if `checkpoint_path` is given,
    loads trained weights into it. Without a checkpoint, the model uses
    ImageNet-pretrained backbones with a randomly-initialized fusion
    module and classifier head — i.e. DEMO mode, not a trained classifier
    (see analysis.services.analysis_pipeline for how this is labeled)."""
    device = device or get_device()
    cache_key = (checkpoint_path, str(model_config))
    if cache_key in _model_cache:
        return _model_cache[cache_key]

    model = HybridCNNSwinModel(config=model_config or MODEL_CONFIG)

    if checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        state_dict = checkpoint["model_state_dict"] if "model_state_dict" in checkpoint else checkpoint
        model.load_state_dict(state_dict)
        logger.info("Loaded model weights from %s", checkpoint_path)
    else:
        logger.warning("No checkpoint provided — model is running with untrained fusion/classifier weights (DEMO mode).")

    model = model.to(device)
    model.eval()
    _model_cache[cache_key] = model
    return model


def predict(model, image_tensor, device=None):
    """`image_tensor`: preprocessed tensor, shape (3, H, W).

    Returns a dict with logits/probabilities/predicted_class plus the
    branch feature vectors and attention info exposed by the model, and
    processing_time_ms measured around the forward pass only."""
    device = device or next(model.parameters()).device
    batch = image_tensor.unsqueeze(0).to(device)

    start = time.perf_counter()
    with torch.no_grad():
        outputs = model(batch)
    elapsed_ms = (time.perf_counter() - start) * 1000

    probabilities = outputs["probabilities"].squeeze(0).cpu().tolist()
    predicted_index = int(outputs["predicted_index"].item())

    return {
        "predicted_class": CLASS_NAMES[predicted_index],
        "predicted_index": predicted_index,
        "probabilities": {name: probabilities[i] for i, name in enumerate(CLASS_NAMES)},
        "probabilities_list": probabilities,
        "confidence": max(probabilities),
        "processing_time_ms": elapsed_ms,
    }
