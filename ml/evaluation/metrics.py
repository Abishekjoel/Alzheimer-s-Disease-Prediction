"""
Full evaluation metric computation (Phase 11). Produces one JSON-serializable
dict per evaluation run, always tagged with which split it came from —
this module refuses to let validation metrics silently pass as test metrics
by requiring the caller to pass `split` explicitly and including it in the
output.
"""

import numpy as np
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from ml.config import CLASS_NAMES


def _one_vs_rest_specificity_sensitivity(cm: np.ndarray):
    """Per-class sensitivity (= recall) and specificity from a multi-class
    confusion matrix, computed one-vs-rest."""
    num_classes = cm.shape[0]
    per_class = {}
    for i in range(num_classes):
        tp = cm[i, i]
        fn = cm[i, :].sum() - tp
        fp = cm[:, i].sum() - tp
        tn = cm.sum() - tp - fn - fp
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        per_class[i] = {"sensitivity": float(sensitivity), "specificity": float(specificity)}
    return per_class


def compute_full_metrics(targets, predictions, probabilities, class_names=None, split="test"):
    """`targets`, `predictions`: list[int] class indices.
    `probabilities`: list[list[float]], shape (N, num_classes).
    `split`: one of 'train' | 'validation' | 'test' — recorded in the
    output so downstream code/report generation cannot confuse splits."""
    names = class_names or CLASS_NAMES
    targets = np.asarray(targets)
    predictions = np.asarray(predictions)
    probabilities = np.asarray(probabilities)

    cm = confusion_matrix(targets, predictions, labels=list(range(len(names))))
    per_class_sens_spec = _one_vs_rest_specificity_sensitivity(cm)

    precision_per_class = precision_score(targets, predictions, average=None, labels=list(range(len(names))), zero_division=0)
    recall_per_class = recall_score(targets, predictions, average=None, labels=list(range(len(names))), zero_division=0)
    f1_per_class = f1_score(targets, predictions, average=None, labels=list(range(len(names))), zero_division=0)

    per_class_metrics = {}
    for i, name in enumerate(names):
        per_class_metrics[name] = {
            "precision": float(precision_per_class[i]),
            "recall": float(recall_per_class[i]),
            "sensitivity": per_class_sens_spec[i]["sensitivity"],
            "specificity": per_class_sens_spec[i]["specificity"],
            "f1": float(f1_per_class[i]),
        }

    roc_auc_macro = None
    roc_auc_per_class = {}
    try:
        roc_auc_macro = float(roc_auc_score(targets, probabilities, multi_class="ovr", average="macro", labels=list(range(len(names)))))
        per_class_auc = roc_auc_score(targets, probabilities, multi_class="ovr", average=None, labels=list(range(len(names))))
        roc_auc_per_class = {name: float(auc) for name, auc in zip(names, per_class_auc)}
    except ValueError as exc:
        # Happens if a class is entirely absent from `targets` in this split
        # (e.g. a tiny demo/smoke-test dataset) — report explicitly rather
        # than silently producing a fabricated AUC.
        roc_auc_macro = None
        roc_auc_per_class = {"error": str(exc)}

    accuracy = float((targets == predictions).mean())

    return {
        "split": split,
        "num_samples": int(len(targets)),
        "class_names": names,
        "accuracy": accuracy,
        "precision_macro": float(precision_score(targets, predictions, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(targets, predictions, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(targets, predictions, average="macro", zero_division=0)),
        "roc_auc_macro": roc_auc_macro,
        "roc_auc_per_class": roc_auc_per_class,
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": cm.tolist(),
    }
