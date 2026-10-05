"""
MRI image quality assessment — deliberately independent from the ML
classifier (imports neither `ml.models` nor torch). This lets quality
checking run as a fast, cheap gate before any GPU/CPU-heavy model inference,
and lets it be unit-tested without loading any neural network weights.
"""

import logging

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError

from ml.config import QUALITY_CONFIG

logger = logging.getLogger("analysis")

SUPPORTED_FORMATS = {"JPEG", "PNG"}


def _score_dimensions(width, height, cfg):
    if width < cfg["min_width"] or height < cfg["min_height"]:
        return 0.0, [f"Image dimensions {width}x{height} are below the minimum "
                      f"{cfg['min_width']}x{cfg['min_height']}."]
    return 1.0, []


def _score_blur(gray, cfg):
    variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    score = min(1.0, variance / (2 * cfg["blur_variance_threshold"]))
    issues = []
    if variance < cfg["blur_variance_threshold"]:
        issues.append(f"Image appears blurry (sharpness variance={variance:.1f}, "
                       f"threshold={cfg['blur_variance_threshold']}).")
    return score, issues, variance


def _score_brightness(gray, cfg):
    mean_brightness = float(gray.mean())
    issues = []
    if mean_brightness < cfg["min_mean_brightness"]:
        issues.append(f"Image is too dark (mean brightness={mean_brightness:.1f}).")
        score = mean_brightness / cfg["min_mean_brightness"]
    elif mean_brightness > cfg["max_mean_brightness"]:
        issues.append(f"Image is overexposed (mean brightness={mean_brightness:.1f}).")
        score = max(0.0, 1 - (mean_brightness - cfg["max_mean_brightness"]) / (255 - cfg["max_mean_brightness"]))
    else:
        score = 1.0
    return max(0.0, min(1.0, score)), issues, mean_brightness


def _score_contrast(gray, cfg):
    std = float(gray.std())
    issues = []
    if std < cfg["near_empty_std_threshold"]:
        issues.append(f"Image is near-empty / blank (pixel std={std:.2f}).")
    elif std < cfg["min_std_contrast"]:
        issues.append(f"Image has low contrast (pixel std={std:.2f}).")
    score = min(1.0, std / (2 * cfg["min_std_contrast"])) if cfg["min_std_contrast"] > 0 else 1.0
    return max(0.0, min(1.0, score)), issues, std


def _score_colorfulness(array, cfg):
    """Hasler & Süsstrunk (2003) colorfulness metric. Structural MRI
    slices are grayscale, so a genuine scan scores near 0 here regardless
    of JPEG artifacts; ordinary color photos/screenshots score well above
    the threshold. This is what catches a non-MRI image (e.g. a photo)
    being uploaded — quality metrics like blur/brightness/contrast alone
    can't tell a sharp, well-exposed photo apart from a sharp, well-exposed
    scan."""
    r = array[..., 0].astype(np.float64)
    g = array[..., 1].astype(np.float64)
    b = array[..., 2].astype(np.float64)
    rg = r - g
    yb = 0.5 * (r + g) - b
    colorfulness = float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))

    issues = []
    if colorfulness > cfg["max_colorfulness"]:
        issues.append(
            f"Image does not appear to be a grayscale medical scan (colorfulness={colorfulness:.1f}, "
            f"threshold={cfg['max_colorfulness']:.1f}). Please upload an MRI slice, not a photo."
        )
    score = max(0.0, 1 - colorfulness / (2 * cfg["max_colorfulness"])) if cfg["max_colorfulness"] > 0 else 1.0
    return min(1.0, score), issues, colorfulness


def _score_midtone_coverage(gray, cfg):
    """Catches monochrome non-scan images (screenshots, tables, scanned
    documents) that `_score_colorfulness` can't, since those are
    grayscale-ish too. See the config comment for the reasoning."""
    total = gray.size
    midtone_mask = (gray >= cfg["midtone_low"]) & (gray <= cfg["midtone_high"])
    midtone_fraction = float(midtone_mask.sum()) / total

    issues = []
    if midtone_fraction < cfg["min_midtone_fraction"]:
        issues.append(
            f"Image looks like a document or screenshot rather than a continuous-tone scan "
            f"(midtone coverage={midtone_fraction:.1%}, minimum={cfg['min_midtone_fraction']:.0%}). "
            "Please upload an MRI slice, not a document."
        )
    score = (
        min(1.0, midtone_fraction / (2 * cfg["min_midtone_fraction"]))
        if cfg["min_midtone_fraction"] > 0
        else 1.0
    )
    return max(0.0, score), issues, midtone_fraction


def assess_quality(source, config=None) -> dict:
    """`source`: file path, file-like object, or PIL.Image.

    Returns a dict:
        {
            "is_valid": bool,
            "quality_score": float in [0, 1],
            "issues": [str, ...],
            "recommendation": str,
            "metrics": {...raw measured values, for logging/debugging...},
        }
    """
    cfg = config or QUALITY_CONFIG
    issues = []
    metrics = {}
    critical_failure = False

    # --- Corruption / format check ---
    try:
        if isinstance(source, Image.Image):
            img = source
        else:
            img = Image.open(source)
            img.load()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        logger.warning("Quality check: unreadable/corrupted image: %s", exc)
        return {
            "is_valid": False,
            "quality_score": 0.0,
            "issues": [f"Image could not be read (corrupted or invalid file): {exc}"],
            "recommendation": "Reject: the file is not a readable image.",
            "metrics": {},
        }

    if img.format is not None and img.format.upper() not in SUPPORTED_FORMATS:
        issues.append(f"Unsupported image format '{img.format}'. Expected JPEG or PNG.")
        critical_failure = True

    rgb = img.convert("RGB")
    array = np.array(rgb)
    gray = cv2.cvtColor(array, cv2.COLOR_RGB2GRAY)
    width, height = img.size
    metrics["width"], metrics["height"] = width, height

    dim_score, dim_issues = _score_dimensions(width, height, cfg)
    if dim_issues:
        critical_failure = True
    issues.extend(dim_issues)

    blur_score, blur_issues, blur_var = _score_blur(gray, cfg)
    issues.extend(blur_issues)
    metrics["blur_variance"] = blur_var

    brightness_score, brightness_issues, mean_brightness = _score_brightness(gray, cfg)
    issues.extend(brightness_issues)
    metrics["mean_brightness"] = mean_brightness

    contrast_score, contrast_issues, std_contrast = _score_contrast(gray, cfg)
    issues.extend(contrast_issues)
    metrics["std_contrast"] = std_contrast
    if std_contrast < cfg["near_empty_std_threshold"]:
        critical_failure = True

    colorfulness_score, colorfulness_issues, colorfulness = _score_colorfulness(array, cfg)
    issues.extend(colorfulness_issues)
    metrics["colorfulness"] = colorfulness
    if colorfulness > cfg["max_colorfulness"]:
        critical_failure = True

    midtone_score, midtone_issues, midtone_fraction = _score_midtone_coverage(gray, cfg)
    issues.extend(midtone_issues)
    metrics["midtone_fraction"] = midtone_fraction
    if midtone_fraction < cfg["min_midtone_fraction"]:
        critical_failure = True

    quality_score = (
        0.10 * dim_score
        + 0.20 * blur_score
        + 0.15 * brightness_score
        + 0.15 * contrast_score
        + 0.20 * colorfulness_score
        + 0.20 * midtone_score
    )
    quality_score = round(max(0.0, min(1.0, quality_score)), 4)

    is_valid = quality_score >= cfg["min_quality_score"] and not critical_failure

    if is_valid:
        recommendation = "Image quality acceptable for analysis."
    elif critical_failure:
        recommendation = "Reject: a critical quality issue was detected (see issues)."
    else:
        recommendation = (
            f"Reject: quality score {quality_score:.2f} is below the minimum "
            f"threshold {cfg['min_quality_score']:.2f}."
        )

    return {
        "is_valid": is_valid,
        "quality_score": quality_score,
        "issues": issues,
        "recommendation": recommendation,
        "metrics": metrics,
    }
