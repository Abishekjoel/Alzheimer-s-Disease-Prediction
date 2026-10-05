"""Validation/test-set evaluation loop, shared by the training loop
(per-epoch validation) and standalone evaluation scripts (Phase 11) so
metrics are always computed identically regardless of when they're run."""

import torch
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

from ml.config import CLASS_NAMES


@torch.no_grad()
def run_validation(model, dataloader, criterion, device):
    model.eval()
    total_loss = 0.0
    n_batches = 0
    all_targets = []
    all_predictions = []
    all_probabilities = []

    for images, labels in dataloader:
        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)
        loss = criterion(outputs["logits"], labels)

        total_loss += loss.item()
        n_batches += 1

        all_targets.extend(labels.cpu().tolist())
        all_predictions.extend(outputs["predicted_index"].cpu().tolist())
        all_probabilities.extend(outputs["probabilities"].cpu().tolist())

    if n_batches == 0:
        raise ValueError("Validation dataloader produced no batches.")

    return {
        "loss": total_loss / n_batches,
        "accuracy": accuracy_score(all_targets, all_predictions),
        "precision_macro": precision_score(all_targets, all_predictions, average="macro", zero_division=0),
        "recall_macro": recall_score(all_targets, all_predictions, average="macro", zero_division=0),
        "f1_macro": f1_score(all_targets, all_predictions, average="macro", zero_division=0),
        "targets": all_targets,
        "predictions": all_predictions,
        "probabilities": all_probabilities,
        "class_names": CLASS_NAMES,
    }
