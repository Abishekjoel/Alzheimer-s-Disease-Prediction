"""
MRI dataset discovery and loading.

Expected on-disk layout (path configurable via DATASET_ROOT, never
hardcoded):

    dataset/
        train/{CN,MCI,AD}/*.jpg|jpeg|png
        validation/{CN,MCI,AD}/*.jpg|jpeg|png
        test/{CN,MCI,AD}/*.jpg|jpeg|png

Only 2D image formats (JPG/JPEG/PNG) are read directly. DICOM/NIfTI support
is intentionally NOT implemented yet, but the loader is structured so it can
be added later without touching the rest of the pipeline: `_iter_image_files`
is the single place that lists files for a class folder, and `_load_image`
is the single place that decodes a file into a numpy array. A future
DICOM/NIfTI loader only needs to extend those two functions (e.g. dispatch
on file extension) — nothing else in this module, in the model code, or in
the training loop depends on the file format.
"""

import logging
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError
from torch.utils.data import Dataset

from ml.config import CLASS_NAMES, DATA_CONFIG, DATASET_ROOT

logger = logging.getLogger("ml")

SPLIT_NAMES = ("train", "validation", "test")


def _iter_image_files(class_dir: Path):
    extensions = set(DATA_CONFIG["allowed_extensions"])
    for path in sorted(class_dir.iterdir()):
        if path.is_file() and path.suffix.lower() in extensions:
            yield path


def _load_image(path: Path) -> Image.Image:
    return Image.open(path)


def discover_dataset(dataset_root=None, class_names=None):
    """Scans `dataset_root/{split}/{class}/` and returns a structured
    manifest. Missing splits/classes are reported rather than silently
    skipped, and corrupted/unreadable images are detected up front (not
    discovered mid-training)."""
    root = Path(dataset_root or DATASET_ROOT)
    classes = class_names or CLASS_NAMES

    manifest = {"root": str(root), "splits": {}, "class_distribution": {}, "corrupted": [], "missing": []}

    if not root.exists():
        manifest["missing"].append(f"Dataset root does not exist: {root}")
        return manifest

    for split in SPLIT_NAMES:
        split_dir = root / split
        manifest["splits"][split] = {"samples": [], "class_counts": {c: 0 for c in classes}}

        if not split_dir.exists():
            manifest["missing"].append(f"Missing split directory: {split_dir}")
            continue

        for class_name in classes:
            class_dir = split_dir / class_name
            if not class_dir.exists():
                manifest["missing"].append(f"Missing class directory: {class_dir}")
                continue

            for image_path in _iter_image_files(class_dir):
                try:
                    with _load_image(image_path) as img:
                        img.verify()
                except (UnidentifiedImageError, OSError, ValueError) as exc:
                    manifest["corrupted"].append({"path": str(image_path), "error": str(exc)})
                    logger.warning("Corrupted/unreadable image skipped: %s (%s)", image_path, exc)
                    continue

                manifest["splits"][split]["samples"].append((str(image_path), class_name))
                manifest["splits"][split]["class_counts"][class_name] += 1

        manifest["class_distribution"][split] = dict(manifest["splits"][split]["class_counts"])

    return manifest


class MRIDataset(Dataset):
    """A torch Dataset over one split (train/validation/test) of the MRI
    dataset. Takes a manifest produced by `discover_dataset` so the
    (potentially slow) filesystem scan + corruption check happens once,
    not once per Dataset instantiation."""

    def __init__(self, samples, class_names=None, transform=None):
        """`samples`: list of (image_path, class_name) tuples, e.g.
        `discover_dataset(...)["splits"]["train"]["samples"]`."""
        self.samples = samples
        self.class_names = class_names or CLASS_NAMES
        self.class_to_index = {name: i for i, name in enumerate(self.class_names)}
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, class_name = self.samples[idx]
        with _load_image(Path(path)) as img:
            img = img.convert("RGB")
            array = np.array(img)

        if self.transform is not None:
            tensor = self.transform(array)
        else:
            tensor = array

        label = self.class_to_index[class_name]
        return tensor, label

    @classmethod
    def from_manifest(cls, manifest, split, transform=None):
        if split not in manifest["splits"]:
            raise KeyError(f"Split '{split}' not present in manifest. Available: {list(manifest['splits'])}")
        samples = manifest["splits"][split]["samples"]
        return cls(samples, transform=transform)
