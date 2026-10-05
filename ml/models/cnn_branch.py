"""
CNN feature-extraction branch.

Backbone choice: ResNet50 (torchvision, ImageNet-pretrained) is the default.
It is chosen over EfficientNet for this project because:

1. It is the most widely used CNN backbone in the published Alzheimer's/MRI
   classification literature, which makes results easier to compare against
   prior work in a research write-up.
2. Its training dynamics are simpler and more stable on small-to-medium
   medical-imaging datasets (no compound scaling / stochastic-depth
   hyperparameters to tune), which matters when the available MRI dataset
   is modest in size compared to ImageNet.
3. torchvision ships first-class, well-maintained pretrained weights and a
   simple `nn.Module` layout, keeping the fine-tuning code in this file
   straightforward.

The backbone is swappable: any torchvision or timm CNN that exposes a
global-pooled feature vector can be dropped in by extending
`_build_backbone` without touching the fusion or classifier code, since
this module's public contract is simply "image in, feature vector out".
"""

import torch
import torch.nn as nn
import torchvision


class CNNBranch(nn.Module):
    """Extracts a fixed-length feature embedding from an MRI slice/image.

    This module deliberately does NOT perform classification itself — see
    Phase 5 of the project spec. It exposes only a feature vector so the
    same branch can be reused unmodified by the fusion module and by
    ablation experiments (e.g. "CNN only", which just adds its own small
    classifier head on top of this branch's output).
    """

    SUPPORTED_BACKBONES = {"resnet50", "resnet34"}

    def __init__(
        self,
        backbone="resnet50",
        pretrained=True,
        feature_dim=2048,
        freeze_backbone=False,
        dropout=0.3,
    ):
        super().__init__()
        if backbone not in self.SUPPORTED_BACKBONES:
            raise ValueError(f"Unsupported CNN backbone '{backbone}'. Supported: {self.SUPPORTED_BACKBONES}")

        self.backbone_name = backbone
        self.backbone, backbone_out_dim = self._build_backbone(backbone, pretrained)

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

    @staticmethod
    def _build_backbone(backbone, pretrained):
        if backbone == "resnet50":
            weights = torchvision.models.ResNet50_Weights.IMAGENET1K_V2 if pretrained else None
            model = torchvision.models.resnet50(weights=weights)
            out_dim = model.fc.in_features
            model.fc = nn.Identity()
            return model, out_dim
        if backbone == "resnet34":
            weights = torchvision.models.ResNet34_Weights.IMAGENET1K_V1 if pretrained else None
            model = torchvision.models.resnet34(weights=weights)
            out_dim = model.fc.in_features
            model.fc = nn.Identity()
            return model, out_dim
        raise ValueError(backbone)

    def forward(self, x):
        """x: (B, 3, H, W) -> features: (B, feature_dim)"""
        features = self.backbone(x)
        features = self.projection(features)
        features = self.dropout(features)
        return features

    def get_target_layer(self):
        """Returns the convolutional layer Grad-CAM should hook into.

        Uses layer3 (14x14 spatial resolution at 224x224 input), not the
        more common layer4 (7x7). Both are equally valid mathematically —
        Grad-CAM's gradient chain rule holds at any layer along the path
        to the classifier — but layer4's 7x7 map upsamples to a very
        coarse, blocky overlay. layer3 trades a small amount of semantic
        depth for 4x the spatial resolution, which is the more useful
        trade-off for a visual explainability overlay. See
        ml/models/swin_branch.py's analogous choice for the Swin branch."""
        return self.backbone.layer3[-1]


if __name__ == "__main__":
    branch = CNNBranch(pretrained=False)
    dummy = torch.randn(2, 3, 224, 224)
    out = branch(dummy)
    print("CNN branch output shape:", out.shape)
