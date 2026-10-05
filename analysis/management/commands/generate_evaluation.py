"""python manage.py generate_evaluation — produces the full set of Phase 11
evaluation artifacts (confusion matrix, ROC curves, precision-recall
curves, and training curves if a history file is available) for a trained
checkpoint, plus the metrics JSON."""

import json
from pathlib import Path

from django.core.management.base import BaseCommand
from torch.utils.data import DataLoader

from analysis.management.commands._dataset_utils import build_datasets, load_manifest_or_die
from ml.config import CLASS_NAMES, DATASET_ROOT, EVAL_ARTIFACTS_DIR, MODEL_CONFIG, TRAINING_CONFIG, get_device


class Command(BaseCommand):
    help = "Generate confusion matrix, ROC, and precision-recall plots plus a metrics JSON for a checkpoint."

    def add_arguments(self, parser):
        parser.add_argument("--checkpoint", required=True)
        parser.add_argument("--dataset-root", default=str(DATASET_ROOT))
        parser.add_argument("--split", default="test", choices=["validation", "test"])
        parser.add_argument("--history-file", default=None, help="Optional *_history.json from training.")
        parser.add_argument("--output-dir", default=str(EVAL_ARTIFACTS_DIR))

    def handle(self, *args, **options):
        import torch

        from ml.evaluation.confusion_matrix import plot_confusion_matrix
        from ml.evaluation.metrics import compute_full_metrics
        from ml.evaluation.roc import plot_precision_recall_curves, plot_roc_curves, plot_training_curves
        from ml.models.hybrid_model import HybridCNNSwinModel
        from ml.training.losses import build_loss
        from ml.training.validate import run_validation

        output_dir = Path(options["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)

        manifest = load_manifest_or_die(options["dataset_root"], self.stdout)
        _, val_ds, test_ds = build_datasets(manifest, MODEL_CONFIG["image_size"])
        dataset = test_ds if options["split"] == "test" else val_ds

        device = get_device()
        model = HybridCNNSwinModel(config=MODEL_CONFIG)
        checkpoint = torch.load(options["checkpoint"], map_location=device)
        model.load_state_dict(checkpoint.get("model_state_dict", checkpoint))
        model = model.to(device)

        loader = DataLoader(dataset, batch_size=TRAINING_CONFIG["batch_size"], shuffle=False)
        run = run_validation(model, loader, build_loss("none"), device)
        metrics = compute_full_metrics(run["targets"], run["predictions"], run["probabilities"],
                                        class_names=CLASS_NAMES, split=options["split"])

        with open(output_dir / "metrics.json", "w") as f:
            json.dump(metrics, f, indent=2)

        plot_confusion_matrix(metrics["confusion_matrix"], CLASS_NAMES, output_dir / "confusion_matrix.png")
        plot_roc_curves(run["targets"], run["probabilities"], CLASS_NAMES, output_dir / "roc_curves.png")
        plot_precision_recall_curves(run["targets"], run["probabilities"], CLASS_NAMES, output_dir / "pr_curves.png")

        if options["history_file"]:
            with open(options["history_file"]) as f:
                history = json.load(f)
            plot_training_curves(history, output_dir / "training_curves.png")

        self.stdout.write(self.style.SUCCESS(f"Evaluation artifacts written to {output_dir}"))
        self.stdout.write(json.dumps({k: v for k, v in metrics.items() if k != "confusion_matrix"}, indent=2))
