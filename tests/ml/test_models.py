import torch

from ml.models.cnn_branch import CNNBranch
from ml.models.feature_fusion import AttentionFeatureFusion, ConcatFusion, WeightedFusion, build_fusion
from ml.models.hybrid_model import HybridCNNSwinModel
from ml.models.swin_branch import SwinBranch


def test_cnn_branch_output_shape():
    branch = CNNBranch(pretrained=False, feature_dim=256)
    out = branch(torch.randn(2, 3, 224, 224))
    assert out.shape == (2, 256)


def test_cnn_branch_target_layer_exists():
    branch = CNNBranch(pretrained=False)
    assert branch.get_target_layer() is not None


def test_swin_branch_output_shape():
    branch = SwinBranch(pretrained=False, feature_dim=192)
    out = branch(torch.randn(2, 3, 224, 224))
    assert out.shape == (2, 192)


def test_swin_branch_exposes_attention_modules():
    branch = SwinBranch(pretrained=False)
    modules = branch.get_attention_modules()
    assert len(modules) > 0
    assert branch.get_last_attention_module() is modules[-1]


def test_attention_fusion_output_keys_and_shapes():
    fusion = AttentionFeatureFusion(cnn_dim=128, swin_dim=96, fusion_dim=64, num_heads=4)
    out = fusion(torch.randn(3, 128), torch.randn(3, 96))
    assert out["fused"].shape == (3, 64)
    assert out["gate_weights"].shape == (3, 64)
    assert out["cross_attention_weights"].shape == (3, 2, 2)
    # gate weights must be valid probabilities (sigmoid output)
    assert torch.all(out["gate_weights"] >= 0) and torch.all(out["gate_weights"] <= 1)


def test_concat_and_weighted_fusion_shapes():
    concat = ConcatFusion(cnn_dim=128, swin_dim=96, fusion_dim=64)
    out = concat(torch.randn(3, 128), torch.randn(3, 96))
    assert out["fused"].shape[0] == 3

    weighted = WeightedFusion(cnn_dim=128, swin_dim=96, fusion_dim=64)
    out = weighted(torch.randn(3, 128), torch.randn(3, 96))
    assert out["fused"].shape == (3, 64)
    assert 0 <= out["scalar_weight"].item() <= 1


def test_build_fusion_registry():
    for method in ("attention_gated", "concat", "weighted"):
        fusion = build_fusion(method, cnn_dim=64, swin_dim=64, fusion_dim=32)
        assert fusion is not None


def _small_model_config(**overrides):
    config = {
        "num_classes": 3, "image_size": 224, "in_channels": 3,
        "cnn_backbone": "resnet50", "cnn_pretrained": False, "cnn_feature_dim": 128,
        "cnn_freeze_backbone": False, "cnn_dropout": 0.1,
        "swin_backbone": "swin_tiny_patch4_window7_224", "swin_pretrained": False, "swin_feature_dim": 96,
        "swin_freeze_backbone": False, "swin_dropout": 0.1,
        "fusion_method": "attention_gated", "fusion_dim": 64, "fusion_dropout": 0.1, "fusion_attention_heads": 4,
        "classifier_hidden_dim": 32, "classifier_dropout": 0.1,
    }
    config.update(overrides)
    return config


def test_hybrid_model_forward_shapes():
    model = HybridCNNSwinModel(config=_small_model_config())
    out = model(torch.randn(2, 3, 224, 224))
    assert out["logits"].shape == (2, 3)
    assert torch.allclose(out["probabilities"].sum(dim=-1), torch.ones(2), atol=1e-4)
    assert out["fused_features"].shape == (2, 64)
    assert out["attention"]["gate_weights"].shape == (2, 64)


def test_hybrid_model_cnn_only_and_swin_only_modes():
    # batch size 2, not 1: BatchNorm1d in the branch projection heads
    # requires >1 sample per channel while the model is in train() mode
    # (the default after construction) — single-image inference always
    # goes through model.eval() first (see analysis.services.prediction),
    # which uses running statistics instead and has no such restriction.
    cnn_only = HybridCNNSwinModel(config=_small_model_config(), mode="cnn_only")
    out = cnn_only(torch.randn(2, 3, 224, 224))
    assert out["logits"].shape == (2, 3)
    assert out["swin_features"] is None

    swin_only = HybridCNNSwinModel(config=_small_model_config(), mode="swin_only")
    out = swin_only(torch.randn(2, 3, 224, 224))
    assert out["logits"].shape == (2, 3)
    assert out["cnn_features"] is None


def test_hybrid_model_gradcam_and_attention_targets():
    model = HybridCNNSwinModel(config=_small_model_config())
    assert model.get_gradcam_target() is not None
    assert model.get_swin_attention_target() is not None


def test_hybrid_model_mc_dropout_toggle():
    model = HybridCNNSwinModel(config=_small_model_config())
    model.enable_mc_dropout()
    dropout_modules = [m for m in model.modules() if isinstance(m, torch.nn.Dropout)]
    assert all(m.training for m in dropout_modules)
    assert model.cnn_branch.backbone.training is False
