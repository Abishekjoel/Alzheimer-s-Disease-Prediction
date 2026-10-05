# Sample MRI scans for manual testing

These 6 images are **synthetic** (programmatically generated), not real
patient scans and not sourced from any clinical dataset. They exist purely
to exercise the app's pipeline end-to-end — upload → quality gate →
inference → Grad-CAM / Swin attention → PDF report — with a visually
varied, grayscale, MRI-slice-shaped set of test files.

## Why synthetic, not real images

A real, individually-licensed, single-slice brain MRI dataset with
per-image ground-truth severity (e.g. OASIS, ADNI, or the Kaggle
"Alzheimer's MRI" dataset) requires a data-use agreement or account and
can't be redistributed into a project folder. Public-domain images found
elsewhere (NIH/Wikimedia) turned out to be labeled anatomical diagrams or
gross-pathology photos, not MRI scans — unsuitable for actually uploading
through the app. Generating clearly-labeled synthetic test images avoided
both problems and let every file be verified against the app's real
quality gate before being handed to you (see below).

## What "mild / moderate / pronounced atrophy" means here

Each image has a central dark "ventricle" region whose size increases
across the set (with a thinning outer tissue ring to match) — enlarged
ventricles are a real, textbook visual proxy for brain atrophy, used here
only so the set looks visually progressive and gives Grad-CAM/attention
real structure to respond to. **This is not a diagnosis and does not
correspond to actual CN / MCI / AD ground truth.**

Because the shipped model is running in DEMO mode (untrained
fusion/classifier weights — see `DEMO_MODE` in `.env` / `ml/config.py`),
its predicted class for any of these images is not meaningfully tied to
the synthetic "atrophy" pattern either. Don't read anything into which
class it predicts for which file — that's expected demo behavior, not a
bug. What's worth checking manually is that the pipeline *runs cleanly*
for each one: quality gate passes, a prediction + probabilities +
uncertainty come back, Grad-CAM and attention overlays render, and the
PDF report generates correctly.

## Verified before delivery

All 6 files were run through the app's actual
`analysis.services.quality_check.assess_quality()` and passed with scores
between 0.97 and 1.0 — they will clear the upload quality gate.

| File | Simulated atrophy level |
|---|---|
| `sample_01_mild_atrophy_a.jpg` | Mild |
| `sample_02_mild_atrophy_b.jpg` | Mild |
| `sample_03_moderate_atrophy_a.jpg` | Moderate |
| `sample_04_moderate_atrophy_b.jpg` | Moderate |
| `sample_05_pronounced_atrophy_a.jpg` | Pronounced |
| `sample_06_pronounced_atrophy_b.jpg` | Pronounced |
