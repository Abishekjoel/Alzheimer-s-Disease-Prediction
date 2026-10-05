"""python manage.py run_ablation — Phase 12 ablation study. Trains all five
configurations (CNN only, Swin only, concat fusion, weighted fusion,
attention-gated fusion) and records each as an Experiment row with metrics
produced by a real training + test-evaluation run."""

import json

from django.core.management.base import BaseCommand

from analysis.management.commands._dataset_utils import build_datasets, load_manifest_or_die
from ml.config import DATASET_ROOT, MODEL_CONFIG, TRAINING_CONFIG, WEIGHTS_DIR, get_device


class Command(BaseCommand):
    help = "Run the ablation study (Experiments A-E) and store results as Experiment records."

    def add_arguments(self, parser):
        parser.add_argument("--dataset-root", default=str(DATASET_ROOT))
        parser.add_argument("--epochs", type=int, default=None, help="Override epochs for a faster ablation pass.")
        parser.add_argument("--output-dir", default=str(WEIGHTS_DIR / "ablation"))

    def handle(self, *args, **options):
        from analysis.models import Experiment
        from ml.evaluation.ablation import build_comparison_table, run_ablation_study

        manifest = load_manifest_or_die(options["dataset_root"], self.stdout)
        train_ds, val_ds, test_ds = build_datasets(manifest, MODEL_CONFIG["image_size"])

        training_config = dict(TRAINING_CONFIG)
        if options["epochs"]:
            training_config["epochs"] = options["epochs"]

        device = get_device()
        self.stdout.write(f"Device: {device}. This will train 5 model configurations sequentially.")

        from ml.config import CLASS_NAMES

        results = run_ablation_study(
            train_ds, val_ds, test_ds, training_config, MODEL_CONFIG,
            manifest["class_distribution"]["train"], CLASS_NAMES,
            options["output_dir"], device,
        )

        for result in results:
            Experiment.objects.update_or_create(
                name=result["label"],
                experiment_type=result["experiment_type"],
                defaults={
                    "model_config": {**MODEL_CONFIG, "mode": result["mode"], "fusion_method": result["fusion_method"]},
                    "training_config": training_config,
                    "dataset_info": {"root": manifest["root"], "class_distribution": manifest["class_distribution"]},
                    "metrics": result["metrics"],
                    "history": result["history"],
                    "checkpoint_path": result["checkpoint_path"],
                },
            )

        table = build_comparison_table(results)
        self.stdout.write(self.style.SUCCESS("Ablation study complete. Comparison table:"))
        self.stdout.write(json.dumps(table, indent=2))
