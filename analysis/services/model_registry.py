"""
Model version lookup/registration helpers (Phase 20 — model versioning).

Every prediction must be tied to a ModelVersion row, so this module
guarantees one always exists: if no ModelVersion has ever been registered
(e.g. a fresh install with no trained checkpoint yet), it registers a
DEMO version with empty checkpoint_path rather than leaving predictions
unattributed. That DEMO version is unmistakably flagged (is_demo=True)
everywhere it's surfaced — see analysis.services.report_generator and the
DEMO_MODE handling in analysis_pipeline.
"""

import logging

from ml.config import MODEL_CONFIG

logger = logging.getLogger("analysis")

DEMO_VERSION_NAME = "Hybrid-CNN-Swin"
DEMO_VERSION_TAG = "0.0.0-demo"


def get_active_model_version():
    from analysis.models import ModelVersion

    active = ModelVersion.objects.filter(is_active=True).first()
    if active:
        return active
    return ensure_demo_model_version()


def ensure_demo_model_version():
    """Gets or creates a placeholder ModelVersion so the system can always
    attribute a prediction, even before any real training run has been
    registered. Never marked active if a real trained version exists."""
    from analysis.models import ModelVersion

    demo, created = ModelVersion.objects.get_or_create(
        name=DEMO_VERSION_NAME,
        version=DEMO_VERSION_TAG,
        defaults={
            "cnn_architecture": MODEL_CONFIG["cnn_backbone"],
            "swin_architecture": MODEL_CONFIG["swin_backbone"],
            "fusion_method": MODEL_CONFIG["fusion_method"],
            "training_dataset_info": {},
            "metrics": {},
            "checkpoint_path": "",
            "is_active": not ModelVersion.objects.filter(is_active=True).exists(),
            "is_demo": True,
            "notes": "Auto-registered placeholder — untrained fusion/classifier weights. "
                     "Register a real trained checkpoint via `python manage.py register_model`.",
        },
    )
    if created:
        logger.warning("No ModelVersion was registered — created DEMO placeholder version %s.", demo)
    return demo


def register_model_version(
    *, name, version, cnn_architecture, swin_architecture, fusion_method,
    checkpoint_path, metrics=None, training_dataset_info=None, is_demo=False,
    activate=True, notes="",
):
    from analysis.models import ModelVersion

    model_version, _ = ModelVersion.objects.update_or_create(
        name=name, version=version,
        defaults={
            "cnn_architecture": cnn_architecture,
            "swin_architecture": swin_architecture,
            "fusion_method": fusion_method,
            "checkpoint_path": checkpoint_path,
            "metrics": metrics or {},
            "training_dataset_info": training_dataset_info or {},
            "is_demo": is_demo,
            "is_active": activate,
            "notes": notes,
        },
    )
    return model_version
