"""
Complete hybrid CNN + Swin Transformer classification model.

    MRI -> CNN branch -----> CNN features ----\
                                                 >-- Attention Fusion --> fused --> classifier head --> CN/MCI/AD
    MRI -> Swin branch ----> Swin features ----/

`mode` also supports single-branch configurations ("cnn_only", "swin_only")
so this one class can serve both the production hybrid model and the
ablation-study baselines (Phase 12, experiments A and B) without duplicating
the classifier-head code.
"""

import torch
import torch.nn as nn

from ml.config import MODEL_CONFIG
from ml.models.cnn_branch import CNNBranch
from ml.models.feature_fusion import build_fusion
from ml.models.swin_branch import SwinBranch


class HybridCNNSwinModel(nn.Module):
    MODES = {"hybrid", "cnn_only", "swin_only"}

    def __init__(self, config=None, mode="hybrid", fusion_method=None):
        super().__init__()
        if mode not in self.MODES:
            raise ValueError(f"mode must be one of {self.MODES}, got '{mode}'")

        cfg = dict(MODEL_CONFIG)
        if config:
            cfg.update(config)
        self.config = cfg
        self.mode = mode
        self.num_classes = cfg["num_classes"]

        self.cnn_branch = None
        self.swin_branch = None
        self.fusion = None

        if mode in ("hybrid", "cnn_only"):
            self.cnn_branch = CNNBranch(
                backbone=cfg["cnn_backbone"],
                pretrained=cfg["cnn_pretrained"],
                feature_dim=cfg["cnn_feature_dim"],
                freeze_backbone=cfg["cnn_freeze_backbone"],
                dropout=cfg["cnn_dropout"],
            )
        if mode in ("hybrid", "swin_only"):
            self.swin_branch = SwinBranch(
                backbone=cfg["swin_backbone"],
                pretrained=cfg["swin_pretrained"],
                feature_dim=cfg["swin_feature_dim"],
                freeze_backbone=cfg["swin_freeze_backbone"],
                dropout=cfg["swin_dropout"],
                image_size=cfg["image_size"],
            )

        if mode == "hybrid":
            method = fusion_method or cfg["fusion_method"]
            self.fusion = build_fusion(
                method,
                cnn_dim=cfg["cnn_feature_dim"],
                swin_dim=cfg["swin_feature_dim"],
                fusion_dim=cfg["fusion_dim"],
                num_heads=cfg["fusion_attention_heads"],
                dropout=cfg["fusion_dropout"],
            )
            classifier_in_dim = self.fusion.fusion_dim
        elif mode == "cnn_only":
            classifier_in_dim = cfg["cnn_feature_dim"]
        else:  # swin_only
            classifier_in_dim = cfg["swin_feature_dim"]

        self.classifier = nn.Sequential(
            nn.Linear(classifier_in_dim, cfg["classifier_hidden_dim"]),
            nn.ReLU(inplace=True),
            nn.Dropout(cfg["classifier_dropout"]),
            nn.Linear(cfg["classifier_hidden_dim"], self.num_classes),
        )

    def forward(self, x):
        result = {}

        cnn_features = self.cnn_branch(x) if self.cnn_branch is not None else None
        swin_features = self.swin_branch(x) if self.swin_branch is not None else None
        result["cnn_features"] = cnn_features
        result["swin_features"] = swin_features

        if self.mode == "hybrid":
            fusion_out = self.fusion(cnn_features, swin_features)
            classifier_input = fusion_out["fused"]
            result["fused_features"] = fusion_out["fused"]
            result["attention"] = {
                k: v for k, v in fusion_out.items() if k not in ("fused",)
            }
        elif self.mode == "cnn_only":
            classifier_input = cnn_features
            result["fused_features"] = None
            result["attention"] = None
        else:
            classifier_input = swin_features
            result["fused_features"] = None
            result["attention"] = None

        logits = self.classifier(classifier_input)
        probabilities = torch.softmax(logits, dim=-1)
        predicted_index = torch.argmax(probabilities, dim=-1)

        result["logits"] = logits
        result["probabilities"] = probabilities
        result["predicted_index"] = predicted_index
        return result

    def enable_mc_dropout(self):
        """Puts every Dropout submodule into train() mode while everything
        else (BatchNorm, etc.) stays in eval() mode. Used by
        ml.evaluation / analysis.services.uncertainty to perform Monte
        Carlo Dropout stochastic forward passes at inference time."""
        self.eval()
        for module in self.modules():
            if isinstance(module, nn.Dropout):
                module.train()

    def get_gradcam_target(self):
        if self.cnn_branch is None:
            raise RuntimeError(f"Model mode '{self.mode}' has no CNN branch; Grad-CAM is unavailable.")
        return self.cnn_branch.get_target_layer()

    def get_swin_attention_target(self):
        if self.swin_branch is None:
            raise RuntimeError(f"Model mode '{self.mode}' has no Swin branch; attention visualization is unavailable.")
        return self.swin_branch.get_visualization_attention_module()


if __name__ == "__main__":
    model = HybridCNNSwinModel(config={"cnn_pretrained": False, "swin_pretrained": False})
    dummy = torch.randn(2, 3, 224, 224)
    out = model(dummy)
    print("logits:", out["logits"].shape)
    print("probabilities:", out["probabilities"].shape)
    print("fused_features:", out["fused_features"].shape)
    print("gate_weights:", out["attention"]["gate_weights"].shape)
