"""python manage.py generate_demo_dataset — Phase 28 DEMO mode utility.

Creates a tiny synthetic image dataset under DATASET_ROOT so the full
dataset -> training -> evaluation -> ablation pipeline can be exercised
end-to-end without a real MRI dataset. The generated images are random
noise patterns with a class-dependent brightness bias — they let every
piece of code run and produce real (if meaningless) metrics, but a model
trained on them has ZERO diagnostic validity. This is enforced by
`is_demo=True` propagating through ModelVersion/MRIAnalysis wherever this
demo data's results end up.

This command NEVER touches or overwrites a real dataset directory unless
--force is passed, and always prints a DEMO/PLACEHOLDER warning.
"""

import numpy as np
from django.core.management.base import BaseCommand
from PIL import Image

from ml.config import CLASS_NAMES, DATASET_ROOT

# Distinct brightness bands per class so a model *can* in principle learn
# something from this synthetic data (useful for exercising the training
# loop / loss curves), while remaining obviously not real MRI data.
CLASS_BRIGHTNESS = {"CN": 190, "MCI": 140, "AD": 90}


class Command(BaseCommand):
    help = "Generate a tiny synthetic DEMO/PLACEHOLDER dataset for pipeline smoke-testing (not real MRI data)."

    def add_arguments(self, parser):
        parser.add_argument("--dataset-root", default=str(DATASET_ROOT))
        parser.add_argument("--images-per-class", type=int, default=12)
        parser.add_argument("--image-size", type=int, default=224)
        parser.add_argument("--seed", type=int, default=42)
        parser.add_argument("--force", action="store_true", help="Overwrite existing files if present.")

    def handle(self, *args, **options):
        from pathlib import Path

        rng = np.random.default_rng(options["seed"])
        root = Path(options["dataset_root"])
        size = options["image_size"]

        split_counts = {"train": options["images_per_class"], "validation": max(2, options["images_per_class"] // 4),
                         "test": max(2, options["images_per_class"] // 4)}

        for split, count in split_counts.items():
            for class_name in CLASS_NAMES:
                class_dir = root / split / class_name
                class_dir.mkdir(parents=True, exist_ok=True)
                for i in range(count):
                    out_path = class_dir / f"demo_{split}_{class_name}_{i}.jpg"
                    if out_path.exists() and not options["force"]:
                        continue
                    base = CLASS_BRIGHTNESS[class_name]
                    noise = rng.normal(loc=base, scale=25, size=(size, size, 3))
                    array = np.clip(noise, 0, 255).astype("uint8")
                    Image.fromarray(array).save(out_path, quality=90)

        self.stdout.write(self.style.WARNING(
            "DEMO / PLACEHOLDER dataset generated. This is synthetic noise, not real MRI data — "
            "any model trained on it has no diagnostic validity whatsoever."
        ))
        self.stdout.write(f"Written under: {root}")
