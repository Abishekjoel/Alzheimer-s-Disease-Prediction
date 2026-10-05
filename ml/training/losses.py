"""
Loss functions, including class-imbalance handling (Phase 10).

`class_distribution` (a {class_name: count} dict, as produced by
`ml.datasets.mri_dataset.discover_dataset`) is required input for the
weighted strategies — this module never assumes or invents a balanced
dataset, and callers must pass the *actual* measured training-split counts.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

from ml.config import CLASS_NAMES


def compute_class_weights(class_distribution: dict, class_names=None) -> torch.Tensor:
    """Inverse-frequency class weights: rarer classes get a larger weight.
    weight_i = N / (num_classes * count_i)"""
    names = class_names or CLASS_NAMES
    counts = [max(1, class_distribution.get(name, 0)) for name in names]
    total = sum(counts)
    num_classes = len(names)
    weights = [total / (num_classes * c) for c in counts]
    return torch.tensor(weights, dtype=torch.float32)


class FocalLoss(nn.Module):
    """Multi-class focal loss (Lin et al., 2017): down-weights easy,
    well-classified examples so training focuses on hard/minority-class
    examples — an alternative to class-weighted cross entropy for handling
    imbalance."""

    def __init__(self, gamma=2.0, class_weights=None, reduction="mean"):
        super().__init__()
        self.gamma = gamma
        self.class_weights = class_weights
        self.reduction = reduction

    def forward(self, logits, targets):
        log_probs = F.log_softmax(logits, dim=-1)
        probs = log_probs.exp()
        target_log_probs = log_probs.gather(1, targets.unsqueeze(1)).squeeze(1)
        target_probs = probs.gather(1, targets.unsqueeze(1)).squeeze(1)

        focal_term = (1 - target_probs) ** self.gamma
        loss = -focal_term * target_log_probs

        if self.class_weights is not None:
            weights = self.class_weights.to(logits.device)[targets]
            loss = loss * weights

        if self.reduction == "mean":
            return loss.mean()
        if self.reduction == "sum":
            return loss.sum()
        return loss


def build_loss(strategy, class_distribution=None, class_names=None, focal_gamma=2.0, device=None):
    """strategy: 'weighted_ce' | 'focal_loss' | 'none' | 'weighted_sampler'
    ('weighted_sampler' uses plain unweighted CE here — the imbalance
    handling happens in the DataLoader's sampler instead; see
    ml.training.train.build_sampler)."""
    class_weights = None
    if class_distribution is not None and strategy in ("weighted_ce", "focal_loss"):
        class_weights = compute_class_weights(class_distribution, class_names)
        if device is not None:
            class_weights = class_weights.to(device)

    if strategy == "weighted_ce":
        return nn.CrossEntropyLoss(weight=class_weights)
    if strategy == "focal_loss":
        return FocalLoss(gamma=focal_gamma, class_weights=class_weights)
    if strategy in ("weighted_sampler", "none"):
        return nn.CrossEntropyLoss()
    raise ValueError(f"Unknown class_imbalance_strategy '{strategy}'")
