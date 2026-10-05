"""
Ablation study framework (Phase 12).

Runs real training + real test-set evaluation for each configuration below
and returns a machine-readable comparison table. Nothing here accepts or
fabricates hand-entered metrics — every row in the resulting table comes
from an actual `train_model` + `run_validation` + `compute_full_metrics`
call chain on the datasets the caller supplies.

    Experiment A: CNN only
    Experiment B: Swin Transformer only
    Experiment C: CNN + Swin, naive concatenation fusion
    Experiment D: CNN + Swin, basic scalar-weighted fusion
    Experiment E: CNN + Swin, proposed attention-gated fusion (this project's contribution)
"""

import logging

import torch
from torch.utils.data import DataLoader

from ml.evaluation.metrics import compute_full_metrics
from ml.models.hybrid_model import HybridCNNSwinModel
from ml.training.losses import build_loss
from ml.training.train import train_model
from ml.training.validate import run_validation

logger = logging.getLogger("ml")

ABLATION_EXPERIMENTS = [
    {"experiment_type": "ablation_cnn_only", "mode": "cnn_only", "fusion_method": None,
     "label": "Experiment A: CNN only"},
    {"experiment_type": "ablation_swin_only", "mode": "swin_only", "fusion_method": None,
     "label": "Experiment B: Swin Transformer only"},
    {"experiment_type": "ablation_concat", "mode": "hybrid", "fusion_method": "concat",
     "label": "Experiment C: CNN + Swin, naive concatenation"},
    {"experiment_type": "ablation_weighted", "mode": "hybrid", "fusion_method": "weighted",
     "label": "Experiment D: CNN + Swin, basic weighted fusion"},
    {"experiment_type": "ablation_attention", "mode": "hybrid", "fusion_method": "attention_gated",
     "label": "Experiment E: CNN + Swin, proposed attention-gated fusion"},
]


def run_ablation_study(
    train_dataset,
    val_dataset,
    test_dataset,
    base_training_config,
    model_config,
    class_distribution,
    class_names,
    output_dir,
    device,
    experiments=None,
):
    experiments = experiments if experiments is not None else ABLATION_EXPERIMENTS
    results = []

    for exp in experiments:
        logger.info("Running ablation experiment: %s", exp["label"])
        model = HybridCNNSwinModel(config=model_config, mode=exp["mode"], fusion_method=exp["fusion_method"])

        train_result = train_model(
            model, train_dataset, val_dataset, base_training_config,
            class_distribution, class_names, output_dir, device,
            experiment_name=exp["experiment_type"],
        )

        checkpoint = torch.load(train_result["best_checkpoint_path"], map_location=device)
        model.load_state_dict(checkpoint["model_state_dict"])

        test_loader = DataLoader(test_dataset, batch_size=base_training_config["batch_size"], shuffle=False)
        criterion = build_loss("none")
        test_run = run_validation(model, test_loader, criterion, device)
        test_metrics = compute_full_metrics(
            test_run["targets"], test_run["predictions"], test_run["probabilities"],
            class_names=class_names, split="test",
        )

        results.append({
            "experiment_type": exp["experiment_type"],
            "label": exp["label"],
            "mode": exp["mode"],
            "fusion_method": exp["fusion_method"],
            "metrics": test_metrics,
            "history": train_result["history"],
            "best_epoch": train_result["best_epoch"],
            "checkpoint_path": train_result["best_checkpoint_path"],
        })

    return results


def build_comparison_table(results):
    """Flat, machine-readable rows suitable for a CSV/JSON export or the
    /api/evaluation/ endpoint."""
    rows = []
    for r in results:
        m = r["metrics"]
        rows.append({
            "experiment_type": r["experiment_type"],
            "label": r["label"],
            "accuracy": m["accuracy"],
            "precision_macro": m["precision_macro"],
            "recall_macro": m["recall_macro"],
            "f1_macro": m["f1_macro"],
            "roc_auc_macro": m["roc_auc_macro"],
        })
    return rows
