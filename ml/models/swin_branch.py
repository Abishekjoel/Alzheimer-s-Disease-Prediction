"""
Swin Transformer feature-extraction branch (via `timm`).

Default backbone: `swin_tiny_patch4_window7_224`. Chosen over larger Swin
variants (small/base) because:

1. It is CPU-runnable for development/testing without a GPU, which this
   project explicitly requires (Phase 25 — CPU/GPU compatibility).
2. Its native input resolution (224x224) matches the CNN branch's, keeping
   preprocessing shared between both branches rather than needing two
   separate resize pipelines.
3. It still captures the window-based local self-attention + shifted-window
   cross-window connections that motivate using a transformer branch
   alongside the CNN branch in the first place (local texture vs. more
   global structural context).

Swapping to a larger Swin variant only requires changing SWIN_BACKBONE in
ml/config.py / .env — this module reads the name generically via timm.
"""

import timm
import torch
import torch.nn as nn


class SwinBranch(nn.Module):
    """Extracts a fixed-length feature embedding from an MRI image using a
    Swin Transformer backbone. Like CNNBranch, this module only produces a
    feature vector — no classification head — so it stays reusable across
    the fusion module and the "Swin only" ablation experiment.
    """

    def __init__(
        self,
        backbone="swin_tiny_patch4_window7_224",
        pretrained=True,
        feature_dim=768,
        freeze_backbone=False,
        dropout=0.3,
        image_size=224,
    ):
        super().__init__()
        self.backbone_name = backbone

        create_kwargs = {"pretrained": pretrained, "num_classes": 0}
        try:
            self.backbone = timm.create_model(backbone, img_size=image_size, **create_kwargs)
        except TypeError:
            # Some timm models don't accept an img_size override; fall back
            # to the backbone's native resolution.
            self.backbone = timm.create_model(backbone, **create_kwargs)

        backbone_out_dim = self.backbone.num_features

        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False

        self.feature_dim = feature_dim
        self.needs_projection = backbone_out_dim != feature_dim
        if self.needs_projection:
            self.projection = nn.Sequential(
                nn.Linear(backbone_out_dim, feature_dim),
                nn.BatchNorm1d(feature_dim),
                nn.ReLU(inplace=True),
            )
        else:
            self.projection = nn.Identity()

        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        """x: (B, 3, H, W) -> features: (B, feature_dim)"""
        features = self.backbone(x)  # (B, backbone_out_dim), globally pooled by timm (num_classes=0)
        features = self.projection(features)
        features = self.dropout(features)
        return features

    def get_attention_modules(self):
        """Returns every WindowAttention submodule in the backbone, in
        forward order, for use by the attention-visualization service
        (Phase 15). Each module exposes `self.softmax` internally, which a
        forward hook can capture to obtain real attention weights — this
        project never fabricates attention maps."""
        return [m for m in self.backbone.modules() if type(m).__name__ == "WindowAttention"]

    def get_last_attention_module(self):
        modules = self.get_attention_modules()
        if not modules:
            raise RuntimeError(
                f"Backbone '{self.backbone_name}' exposes no WindowAttention modules; "
                "Swin attention visualization is unavailable for this backbone."
            )
        return modules[-1]

    def get_visualization_attention_module(self):
        """Returns the WindowAttention module used for the attention
        overlay — deliberately NOT the very last one.

        All standard Swin variants (tiny/small/base/large) share the same
        stage depths pattern [2, 2, D, 2]: the final stage always
        contributes exactly 2 attention blocks. At 224x224 input, that
        final stage's feature map is 7x7 — equal to the window size — so
        there is exactly ONE window covering the whole image and no real
        window-to-window stitching happens; the resulting map is also
        very coarse once upsampled. Using `modules[-3]` instead selects
        the last block of the second-to-last stage (14x14 resolution,
        4 windows), giving a visibly finer overlay and genuinely
        exercising the multi-window reconstruction path in
        analysis.services.attention_visualization. Falls back to the
        last module if the backbone has fewer than 3 attention blocks."""
        modules = self.get_attention_modules()
        if not modules:
            raise RuntimeError(
                f"Backbone '{self.backbone_name}' exposes no WindowAttention modules; "
                "Swin attention visualization is unavailable for this backbone."
            )
        return modules[-3] if len(modules) >= 3 else modules[-1]


if __name__ == "__main__":
    branch = SwinBranch(pretrained=False)
    dummy = torch.randn(2, 3, 224, 224)
    out = branch(dummy)
    print("Swin branch output shape:", out.shape)
    print("Attention modules found:", len(branch.get_attention_modules()))
