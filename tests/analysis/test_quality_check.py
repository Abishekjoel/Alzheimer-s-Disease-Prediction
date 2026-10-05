import numpy as np
from PIL import Image, ImageDraw

from analysis.services.quality_check import assess_quality


def test_good_quality_image_passes(synthetic_pil_image):
    result = assess_quality(synthetic_pil_image)
    assert result["is_valid"] is True
    assert 0.0 <= result["quality_score"] <= 1.0
    assert result["issues"] == []


def test_blank_image_is_rejected():
    blank = Image.fromarray(np.zeros((224, 224, 3), dtype="uint8"))
    result = assess_quality(blank)
    assert result["is_valid"] is False
    assert any("near-empty" in issue or "blank" in issue for issue in result["issues"])


def test_too_small_image_is_rejected():
    tiny = Image.fromarray((np.random.rand(10, 10, 3) * 255).astype("uint8"))
    result = assess_quality(tiny)
    assert result["is_valid"] is False
    assert any("dimensions" in issue for issue in result["issues"])


def test_corrupted_file_is_rejected(tmp_path):
    bad_path = tmp_path / "corrupted.jpg"
    bad_path.write_bytes(b"this is not an image")
    result = assess_quality(str(bad_path))
    assert result["is_valid"] is False
    assert result["quality_score"] == 0.0


def test_dark_image_is_penalized():
    dark = Image.fromarray(np.clip(np.random.normal(5, 2, (224, 224, 3)), 0, 255).astype("uint8"))
    result = assess_quality(dark)
    assert any("dark" in issue for issue in result["issues"])


def test_colorful_non_mri_photo_is_rejected():
    """A sharp, well-exposed, high-contrast *color* photo (e.g. someone
    uploading an arbitrary picture instead of a grayscale MRI slice) must
    be rejected even though blur/brightness/contrast alone would pass —
    this is what the colorfulness check exists to catch."""
    rng = np.random.default_rng(0)
    red_patch = np.zeros((224, 224, 3), dtype="uint8")
    red_patch[:112, :] = [220, 30, 30]
    red_patch[112:, :] = [30, 60, 220]
    noise = rng.integers(-10, 10, size=red_patch.shape)
    array = np.clip(red_patch.astype(int) + noise, 0, 255).astype("uint8")
    colorful = Image.fromarray(array)

    result = assess_quality(colorful)
    assert result["is_valid"] is False
    assert any("grayscale" in issue.lower() for issue in result["issues"])


def test_grayscale_image_is_not_flagged_as_colorful():
    rng = np.random.default_rng(0)
    gray = np.clip(rng.normal(140, 35, (224, 224)), 0, 255).astype("uint8")
    array = np.stack([gray, gray, gray], axis=-1)
    result = assess_quality(Image.fromarray(array))
    assert not any("grayscale" in issue.lower() for issue in result["issues"])


def test_document_screenshot_is_rejected():
    """A monochrome document/table screenshot (white background, black
    grid lines and text) has near-zero colorfulness — same as a real MRI
    — so only the midtone-coverage check catches it: real tissue has a
    continuous spread of gray levels, a document is almost pure
    black-on-white with barely any midtones."""
    img = Image.new("RGB", (400, 300), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    for y in range(0, 300, 30):
        draw.line([(0, y), (400, y)], fill=(0, 0, 0), width=1)
    for x in range(0, 400, 80):
        draw.line([(x, 0), (x, 300)], fill=(0, 0, 0), width=1)
    for y in range(10, 300, 30):
        draw.text((10, y), "Subject 123", fill=(0, 0, 0))

    result = assess_quality(img)
    assert result["is_valid"] is False
    assert any("document" in issue.lower() for issue in result["issues"])


def test_grayscale_mri_like_image_has_sufficient_midtone_coverage():
    rng = np.random.default_rng(0)
    gray = np.clip(rng.normal(140, 45, (224, 224)), 0, 255).astype("uint8")
    array = np.stack([gray, gray, gray], axis=-1)
    result = assess_quality(Image.fromarray(array))
    assert not any("document" in issue.lower() for issue in result["issues"])
