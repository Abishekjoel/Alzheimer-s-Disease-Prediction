"""Shared helpers for the ML management commands. Prefixed with an
underscore so Django's command autodiscovery does not treat this as an
invocable command."""

import sys

from django.core.management.base import CommandError

from ml.config import CLASS_NAMES
from ml.datasets.mri_dataset import MRIDataset, discover_dataset


def load_manifest_or_die(dataset_root, stdout):
    manifest = discover_dataset(dataset_root)

    if manifest["missing"]:
        stdout.write("Dataset issues found:")
        for msg in manifest["missing"]:
            stdout.write(f"  - {msg}")

    if manifest["corrupted"]:
        stdout.write(f"{len(manifest['corrupted'])} corrupted/unreadable image(s) were skipped.")

    for split in ("train", "validation", "test"):
        if split not in manifest["splits"] or not manifest["splits"][split]["samples"]:
            raise CommandError(
                f"No usable samples found for split '{split}' under {manifest['root']}. "
                "Expected layout: dataset/{train,validation,test}/{CN,MCI,AD}/*.jpg. "
                "See README.md 'Dataset preparation' for details."
            )

    stdout.write("Class distribution:")
    for split, counts in manifest["class_distribution"].items():
        stdout.write(f"  {split}: {counts}")

    return manifest


def build_datasets(manifest, image_size):
    from analysis.services.preprocessing import build_inference_transform, build_training_transform

    train_transform = build_training_transform(image_size=image_size)
    eval_transform = build_inference_transform(image_size=image_size)

    train_dataset = MRIDataset.from_manifest(manifest, "train", transform=train_transform)
    val_dataset = MRIDataset.from_manifest(manifest, "validation", transform=eval_transform)
    test_dataset = MRIDataset.from_manifest(manifest, "test", transform=eval_transform)
    return train_dataset, val_dataset, test_dataset
