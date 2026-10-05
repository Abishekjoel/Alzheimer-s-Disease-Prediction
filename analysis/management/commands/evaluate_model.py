"""python manage.py evaluate_model — test-set evaluation for a trained
checkpoint (Phase 27 / Phase 11)."""

import json

from django.core.management.base import BaseCommand, CommandError
from torch.utils.data import DataLoader

from analysis.management.commands._dataset_utils import build_datasets, load_manifest_or_die
from ml.config import CLASS_NAMES, DATASET_ROOT, MODEL_CONFIG, TRAINING_CONFIG, get_device


class Command(BaseCommand):
    help = "Evaluate a trained checkpoint on the test split and print/save full metrics."

    def add_arguments(self, parser):
        parser.add_argument("--checkpoint", required=True)
        parser.add_argument("--dataset-root", default=str(DATASET_ROOT))
        parser.add_argument("--split", default="test", choices=["validation", "test"])
        parser.add_argument("--output", default=None, help="Optional path to save metrics as JSON.")

    def handle(self, *args, **options):
        import torch

        from ml.evaluation.metrics import compute_full_metrics
        from ml.models.hybrid_model import HybridCNNSwinModel
        from ml.training.losses import build_loss
        from ml.training.validate import run_validation

        manifest = load_manifest_or_die(options["dataset_root"], self.stdout)
        train_ds, val_ds, test_ds = build_datasets(manifest, MODEL_CONFIG["image_size"])
        dataset = test_ds if options["split"] == "test" else val_ds

        device = get_device()
        model = HybridCNNSwinModel(config=MODEL_CONFIG)
        checkpoint = torch.load(options["checkpoint"], map_location=device)
        state_dict = checkpoint.get("model_state_dict", checkpoint)
        model.load_state_dict(state_dict)
        model = model.to(device)

        loader = DataLoader(dataset, batch_size=TRAINING_CONFIG["batch_size"], shuffle=False)
        criterion = build_loss("none")
        run = run_validation(model, loader, criterion, device)
        metrics = compute_full_metrics(run["targets"], run["predictions"], run["probabilities"],
                                        class_names=CLASS_NAMES, split=options["split"])

        self.stdout.write(json.dumps(metrics, indent=2))

        if options["output"]:
            with open(options["output"], "w") as f:
                json.dump(metrics, f, indent=2)
            self.stdout.write(self.style.SUCCESS(f"Saved metrics to {options['output']}"))
