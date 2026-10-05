"""python manage.py register_model — Phase 20 model versioning. Registers a
trained checkpoint as a new ModelVersion without breaking historical
MRIAnalysis records tied to previous versions (see analysis.models.ModelVersion
docstring: MRIAnalysis.model_version uses on_delete=PROTECT)."""

import json

from django.core.management.base import BaseCommand, CommandError

from ml.config import MODEL_CONFIG


class Command(BaseCommand):
    help = "Register a trained checkpoint as a new ModelVersion, optionally activating it for production inference."

    def add_arguments(self, parser):
        parser.add_argument("--name", default="Hybrid-CNN-Swin")
        parser.add_argument("--model-version", required=True, dest="model_version", help='e.g. "1.0.0"')
        parser.add_argument("--checkpoint", required=True)
        parser.add_argument("--metrics-file", default=None, help="JSON file of test-set metrics (from evaluate_model).")
        parser.add_argument("--dataset-info", default=None, help="Free-text description of the training dataset used.")
        parser.add_argument("--activate", action="store_true", help="Make this the active production model.")
        parser.add_argument("--demo", action="store_true", help="Mark this version as a demo/placeholder, not a validated result.")
        parser.add_argument("--notes", default="")

    def handle(self, *args, **options):
        from analysis.services.model_registry import register_model_version

        metrics = {}
        if options["metrics_file"]:
            with open(options["metrics_file"]) as f:
                metrics = json.load(f)

        model_version = register_model_version(
            name=options["name"],
            version=options["model_version"],
            cnn_architecture=MODEL_CONFIG["cnn_backbone"],
            swin_architecture=MODEL_CONFIG["swin_backbone"],
            fusion_method=MODEL_CONFIG["fusion_method"],
            checkpoint_path=options["checkpoint"],
            metrics=metrics,
            training_dataset_info={"description": options["dataset_info"]} if options["dataset_info"] else {},
            is_demo=options["demo"],
            activate=options["activate"],
            notes=options["notes"],
        )

        self.stdout.write(self.style.SUCCESS(
            f"Registered {model_version} (active={model_version.is_active}, demo={model_version.is_demo})."
        ))
