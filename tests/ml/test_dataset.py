import numpy as np
from PIL import Image

from ml.datasets.mri_dataset import MRIDataset, discover_dataset


def _write_image(path, size=(32, 32)):
    array = (np.random.rand(*size, 3) * 255).astype("uint8")
    Image.fromarray(array).save(path)


def test_discover_dataset_missing_root(tmp_path):
    manifest = discover_dataset(dataset_root=tmp_path / "does_not_exist")
    assert manifest["missing"]
    assert manifest["splits"] == {}


def test_discover_dataset_reports_class_distribution_and_corrupted(tmp_path):
    root = tmp_path / "dataset"
    for split in ("train", "validation", "test"):
        for class_name in ("CN", "MCI", "AD"):
            class_dir = root / split / class_name
            class_dir.mkdir(parents=True)
            for i in range(3):
                _write_image(class_dir / f"img_{i}.jpg")

    # one corrupted file
    corrupted_path = root / "train" / "CN" / "corrupted.jpg"
    corrupted_path.write_bytes(b"not a real image")

    manifest = discover_dataset(dataset_root=root, class_names=["CN", "MCI", "AD"])

    assert manifest["class_distribution"]["train"] == {"CN": 3, "MCI": 3, "AD": 3}
    assert manifest["class_distribution"]["test"] == {"CN": 3, "MCI": 3, "AD": 3}
    assert len(manifest["corrupted"]) == 1
    assert not manifest["missing"]


def test_discover_dataset_reports_missing_class_directory(tmp_path):
    root = tmp_path / "dataset"
    (root / "train" / "CN").mkdir(parents=True)
    _write_image(root / "train" / "CN" / "img.jpg")
    # MCI, AD folders intentionally missing for train; other splits fully missing

    manifest = discover_dataset(dataset_root=root, class_names=["CN", "MCI", "AD"])
    assert any("MCI" in m for m in manifest["missing"])
    assert any("validation" in m for m in manifest["missing"])


def test_mri_dataset_getitem_returns_label(tmp_path):
    root = tmp_path / "dataset"
    class_dir = root / "train" / "CN"
    class_dir.mkdir(parents=True)
    _write_image(class_dir / "img.jpg")

    manifest = discover_dataset(dataset_root=root, class_names=["CN", "MCI", "AD"])
    dataset = MRIDataset.from_manifest(manifest, "train")
    array, label = dataset[0]
    assert label == 0  # CN is index 0
    assert array.shape == (32, 32, 3)
