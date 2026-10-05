"""
The single high-level inference entry point (Phase 16):

    analyze_mri(image_file, case, uploaded_by)

Orchestrates: quality assessment -> preprocessing -> CNN+Swin feature
extraction -> attention fusion -> prediction -> uncertainty -> Grad-CAM ->
Swin attention visualization -> persistence -> structured result. Kept
independent of the Django views layer (views just call this and serialize
the returned MRIAnalysis) so the same pipeline is reusable from management
commands or tests without going through HTTP.
"""

import logging
import time
from pathlib import Path

from django.conf import settings

from analysis.models import MRIAnalysis
from analysis.services import model_registry
from analysis.services.gradcam import generate_gradcam
from analysis.services.attention_visualization import generate_attention_visualization
from analysis.services.prediction import load_model, predict
from analysis.services.preprocessing import load_image, preprocess_for_inference
from analysis.services.quality_check import assess_quality
from analysis.services.uncertainty import estimate_uncertainty
from ml.config import DEMO_MODE, MODEL_CONFIG, get_device

logger = logging.getLogger("analysis")


def _relative_media_path(absolute_path):
    return str(Path(absolute_path).relative_to(settings.MEDIA_ROOT)).replace("\\", "/")


def analyze_mri(image_file, case, uploaded_by, model_version=None, run_explainability=True):
    """`image_file`: a Django UploadedFile (or anything ImageField.save
    accepts). `case`: a patients.models.Case instance. `uploaded_by`: a
    User instance or None.

    Returns the persisted MRIAnalysis instance. Never raises for
    expected failure modes (bad image, quality rejection, inference
    error) — those are recorded on the analysis record's `status` /
    `error_message` fields instead, so the caller always gets a row to
    report back to the client.
    """
    pipeline_start = time.perf_counter()

    analysis = MRIAnalysis.objects.create(
        case=case, uploaded_by=uploaded_by, image=image_file, status=MRIAnalysis.Status.PENDING,
    )

    try:
        with analysis.image.open("rb") as f:
            quality_result = assess_quality(f)
    except Exception as exc:  # noqa: BLE001 - deliberately broad: any read/decode failure is a quality failure
        logger.exception("Quality assessment failed for analysis %s", analysis.id)
        analysis.status = MRIAnalysis.Status.FAILED
        analysis.error_message = f"Quality assessment failed: {exc}"
        analysis.save()
        return analysis

    analysis.quality_score = quality_result["quality_score"]
    analysis.quality_is_valid = quality_result["is_valid"]
    analysis.quality_issues = quality_result["issues"]

    if not quality_result["is_valid"]:
        analysis.status = MRIAnalysis.Status.QUALITY_REJECTED
        analysis.save()
        logger.info("Analysis %s rejected at quality gate: %s", analysis.id, quality_result["issues"])
        return analysis

    model_version = model_version or model_registry.get_active_model_version()

    try:
        device = get_device()
        model = load_model(
            checkpoint_path=model_version.checkpoint_path or None,
            model_config=MODEL_CONFIG,
            device=device,
        )

        with analysis.image.open("rb") as f:
            original_image = load_image(f)
            original_image.load()

        input_tensor = preprocess_for_inference(original_image)

        prediction_result = predict(model, input_tensor, device=device)
        uncertainty_result = estimate_uncertainty(
            model, input_tensor, probabilities=prediction_result["probabilities_list"], device=device,
        )

        analysis.predicted_class = prediction_result["predicted_class"]
        analysis.prob_cn = prediction_result["probabilities"]["CN"]
        analysis.prob_mci = prediction_result["probabilities"]["MCI"]
        analysis.prob_ad = prediction_result["probabilities"]["AD"]
        analysis.confidence = prediction_result["confidence"]
        analysis.uncertainty_score = uncertainty_result["uncertainty_score"]
        analysis.uncertainty_level = uncertainty_result["uncertainty_level"]
        analysis.model_version = model_version
        analysis.is_demo = model_version.is_demo or DEMO_MODE

        if run_explainability:
            gradcam_dir = Path(settings.MEDIA_ROOT) / "gradcam"
            attention_dir = Path(settings.MEDIA_ROOT) / "attention"
            gradcam_dir.mkdir(parents=True, exist_ok=True)
            attention_dir.mkdir(parents=True, exist_ok=True)

            try:
                gradcam_out = gradcam_dir / f"{analysis.id}_gradcam.png"
                gradcam_result = generate_gradcam(
                    model, input_tensor.unsqueeze(0), original_image,
                    target_class_index=prediction_result["predicted_index"], out_path=gradcam_out,
                )
                analysis.gradcam_path = _relative_media_path(gradcam_result["heatmap_path"])
            except Exception:  # noqa: BLE001
                logger.exception("Grad-CAM generation failed for analysis %s", analysis.id)

            try:
                attention_out = attention_dir / f"{analysis.id}_attention.png"
                attention_result = generate_attention_visualization(
                    model, input_tensor.unsqueeze(0), original_image, out_path=attention_out,
                )
                analysis.attention_map_path = _relative_media_path(attention_result["heatmap_path"])
            except Exception:  # noqa: BLE001
                logger.exception("Attention visualization failed for analysis %s", analysis.id)

        analysis.processing_time_ms = (time.perf_counter() - pipeline_start) * 1000
        analysis.status = MRIAnalysis.Status.COMPLETED
        analysis.save()
        logger.info("Analysis %s completed: %s (confidence=%.3f, uncertainty=%s)",
                    analysis.id, analysis.predicted_class, analysis.confidence, analysis.uncertainty_level)

    except Exception as exc:  # noqa: BLE001 - inference errors must not crash the request; record and return
        logger.exception("Inference failed for analysis %s", analysis.id)
        analysis.status = MRIAnalysis.Status.FAILED
        analysis.error_message = str(exc)
        analysis.save()

    return analysis
