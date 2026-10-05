"""python manage.py train_model — full training run (Phase 27)."""

from django.core.management.base import BaseCommand

from analysis.management.commands._dataset_utils import build_datasets, load_manifest_or_die
from ml.config import DATASET_ROOT, MODEL_CONFIG, TRAINING_CONFIG, WEIGHTS_DIR, get_device


class Command(BaseCommand):
    help = "Train the hybrid CNN+Swin model (or a single-branch ablation variant) on the configured dataset."

    def add_arguments(self, parser):
        parser.add_argument("--dataset-root", default=str(DATASET_ROOT))
        parser.add_argument("--mode", default="hybrid", choices=["hybrid", "cnn_only", "swin_only"])
        parser.add_argument("--fusion-method", default=None, choices=[None, "attention_gated", "concat", "weighted"])
        parser.add_argument("--epochs", type=int, default=None, help="Override ml.config.TRAINING_CONFIG['epochs'].")
        parser.add_argument("--experiment-name", default="train_run")
        parser.add_argument("--output-dir", default=str(WEIGHTS_DIR))

    def handle(self, *args, **options):
        from ml.models.hybrid_model import HybridCNNSwinModel
        from ml.training.train import train_model

        manifest = load_manifest_or_die(options["dataset_root"], self.stdout)
        train_ds, val_ds, _ = build_datasets(manifest, MODEL_CONFIG["image_size"])

        training_config = dict(TRAINING_CONFIG)
        if options["epochs"]:
            training_config["epochs"] = options["epochs"]

        device = get_device()
        self.stdout.write(f"Device: {device}")

        model = HybridCNNSwinModel(config=MODEL_CONFIG, mode=options["mode"], fusion_method=options["fusion_method"])

        class_distribution = manifest["class_distribution"]["train"]
        from ml.config import CLASS_NAMES

        result = train_model(
            model, train_ds, val_ds, training_config, class_distribution, CLASS_NAMES,
            options["output_dir"], device, experiment_name=options["experiment_name"],
        )

        self.stdout.write(self.style.SUCCESS(
            f"Training complete. Best epoch: {result['best_epoch']}, "
            f"best {training_config['early_stopping_metric']}: {result['best_metric_value']:.4f}"
        ))
        self.stdout.write(f"Best checkpoint saved to: {result['best_checkpoint_path']}")
        self.stdout.write(
            "Next steps: `python manage.py evaluate_model --checkpoint "
            f"{result['best_checkpoint_path']}` then `python manage.py register_model` to activate it."
        )
