import numpy as np
import pytest
import torch
from PIL import Image

from analysis.services.attention_visualization import SwinAttentionExtractor, generate_attention_visualization
from analysis.services.gradcam import generate_gradcam
from analysis.services.uncertainty import (
    classify_uncertainty_level,
    estimate_uncertainty,
    estimate_uncertainty_entropy,
    estimate_uncertainty_margin,
)
from ml.models.hybrid_model import HybridCNNSwinModel

MODEL_CONFIG = {
    "num_classes": 3, "image_size": 224, "in_channels": 3,
    "cnn_backbone": "resnet50", "cnn_pretrained": False, "cnn_feature_dim": 64,
    "cnn_freeze_backbone": False, "cnn_dropout": 0.2,
    "swin_backbone": "swin_tiny_patch4_window7_224", "swin_pretrained": False, "swin_feature_dim": 96,
    "swin_freeze_backbone": False, "swin_dropout": 0.2,
    "fusion_method": "attention_gated", "fusion_dim": 32, "fusion_dropout": 0.2, "fusion_attention_heads": 4,
    "classifier_hidden_dim": 16, "classifier_dropout": 0.2,
}


@pytest.fixture(scope="module")
def small_model():
    model = HybridCNNSwinModel(config=MODEL_CONFIG)
    model.eval()
    return model


def test_gradcam_produces_heatmap_and_overlay(small_model, synthetic_pil_image):
    tensor = torch.randn(1, 3, 224, 224)
    result = generate_gradcam(small_model, tensor, synthetic_pil_image)
    assert result["target_class_index"] in (0, 1, 2)
    assert result["overlay_image"].size == synthetic_pil_image.size


def test_gradcam_raises_for_swin_only_mode(synthetic_pil_image):
    model = HybridCNNSwinModel(config=MODEL_CONFIG, mode="swin_only")
    tensor = torch.randn(1, 3, 224, 224)
    with pytest.raises(RuntimeError):
        generate_gradcam(model, tensor, synthetic_pil_image)


def test_attention_visualization_produces_overlay(small_model, synthetic_pil_image):
    tensor = torch.randn(1, 3, 224, 224)
    result = generate_attention_visualization(small_model, tensor, synthetic_pil_image)
    assert result["overlay_image"].size == synthetic_pil_image.size


def test_gradcam_target_is_higher_resolution_layer3(small_model):
    """layer3 (1024 channels for standard ResNet50, 14x14 @ 224 input),
    not layer4 (2048 channels, 7x7) — see CNNBranch.get_target_layer for
    the resolution/semantic-depth trade-off this encodes."""
    target = small_model.get_gradcam_target()
    assert target.conv3.out_channels == 1024


def test_attention_visualization_uses_multi_window_stage(small_model):
    """The default swin_tiny_patch4_window7_224 backbone's last stage has
    exactly one 7x7 window (no real stitching), so the visualization
    target is deliberately the penultimate stage instead: 14x14 resolution
    reconstructed from 4 real windows, genuinely exercising
    _reverse_window_attention's multi-window path rather than the trivial
    single-window case."""
    extractor = SwinAttentionExtractor(small_model)
    try:
        heatmap = extractor.generate(torch.randn(1, 3, 224, 224))
    finally:
        extractor.remove_hooks()
    assert heatmap.shape == (14, 14)


def test_uncertainty_entropy_bounds():
    result = estimate_uncertainty_entropy([0.9, 0.05, 0.05])
    assert 0 <= result["uncertainty_score"] <= 1
    uniform_result = estimate_uncertainty_entropy([1 / 3, 1 / 3, 1 / 3])
    assert uniform_result["uncertainty_score"] > result["uncertainty_score"]


def test_uncertainty_margin():
    confident = estimate_uncertainty_margin([0.9, 0.05, 0.05])
    torn = estimate_uncertainty_margin([0.4, 0.35, 0.25])
    assert confident["uncertainty_score"] < torn["uncertainty_score"]


def test_classify_uncertainty_level_thresholds():
    cfg = {"low_threshold": 0.15, "high_threshold": 0.35}
    assert classify_uncertainty_level(0.05, cfg) == "LOW"
    assert classify_uncertainty_level(0.25, cfg) == "MEDIUM"
    assert classify_uncertainty_level(0.9, cfg) == "HIGH"


def test_estimate_uncertainty_mc_dropout_end_to_end(small_model):
    tensor = torch.randn(3, 224, 224)
    result = estimate_uncertainty(small_model, tensor, method="mc_dropout")
    assert result["uncertainty_level"] in ("LOW", "MEDIUM", "HIGH")
    assert len(result["mean_probabilities"]) == 3
    assert abs(sum(result["mean_probabilities"]) - 1.0) < 1e-3
