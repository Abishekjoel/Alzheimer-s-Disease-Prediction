import uuid

from django.conf import settings
from django.db import models

from ml.config import CLASS_NAMES


def mri_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower()
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    return f"mri/{safe_name}"


class ModelVersion(models.Model):
    """A registered, trained instance of the hybrid architecture. Every
    prediction stores a FK to the exact ModelVersion that produced it
    (see MRIAnalysis.model_version, on_delete=PROTECT) so historical
    results always remain traceable to the model that generated them,
    even after newer versions are registered or made active."""

    name = models.CharField(max_length=100, default="Hybrid-CNN-Swin")
    version = models.CharField(max_length=20)

    cnn_architecture = models.CharField(max_length=100)
    swin_architecture = models.CharField(max_length=100)
    fusion_method = models.CharField(max_length=50)

    training_dataset_info = models.JSONField(default=dict, blank=True)
    metrics = models.JSONField(default=dict, blank=True)

    checkpoint_path = models.CharField(max_length=500, blank=True)

    is_active = models.BooleanField(default=False)
    is_demo = models.BooleanField(
        default=True,
        help_text="True if this version uses placeholder/untrained weights rather than a real trained checkpoint.",
    )
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["name", "version"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} v{self.version}"

    def save(self, *args, **kwargs):
        if self.is_active:
            ModelVersion.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class Experiment(models.Model):
    """A single training or ablation run. Distinct from ModelVersion:
    an Experiment is a research record of *how* a model was produced
    (config + resulting metrics); a ModelVersion is the thing that gets
    registered for production inference. A promising Experiment can later
    be promoted into a ModelVersion."""

    class ExperimentType(models.TextChoices):
        TRAINING_RUN = "training_run", "Full training run"
        ABLATION_CNN_ONLY = "ablation_cnn_only", "Ablation: CNN only"
        ABLATION_SWIN_ONLY = "ablation_swin_only", "Ablation: Swin only"
        ABLATION_CONCAT = "ablation_concat", "Ablation: naive concatenation fusion"
        ABLATION_WEIGHTED = "ablation_weighted", "Ablation: basic weighted fusion"
        ABLATION_ATTENTION = "ablation_attention", "Ablation: proposed attention fusion"

    name = models.CharField(max_length=200)
    experiment_type = models.CharField(max_length=30, choices=ExperimentType.choices)

    model_config = models.JSONField(default=dict, blank=True)
    training_config = models.JSONField(default=dict, blank=True)
    dataset_info = models.JSONField(default=dict, blank=True)

    metrics = models.JSONField(default=dict, blank=True)
    history = models.JSONField(default=dict, blank=True, help_text="Per-epoch training/validation history.")

    checkpoint_path = models.CharField(max_length=500, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.experiment_type})"


class MRIAnalysis(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        QUALITY_REJECTED = "quality_rejected", "Rejected at quality check"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    class UncertaintyLevel(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    PREDICTED_CLASS_CHOICES = [(name, name) for name in CLASS_NAMES]

    case = models.ForeignKey(
        "patients.Case", on_delete=models.CASCADE, related_name="analyses"
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="analyses"
    )
    image = models.ImageField(upload_to=mri_upload_path)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    error_message = models.TextField(blank=True)

    # Quality assessment (see analysis.services.quality_check)
    quality_score = models.FloatField(null=True, blank=True)
    quality_is_valid = models.BooleanField(null=True, blank=True)
    quality_issues = models.JSONField(default=list, blank=True)

    # Prediction
    model_version = models.ForeignKey(
        ModelVersion, on_delete=models.PROTECT, null=True, blank=True, related_name="analyses"
    )
    predicted_class = models.CharField(max_length=10, choices=PREDICTED_CLASS_CHOICES, null=True, blank=True)
    prob_cn = models.FloatField(null=True, blank=True)
    prob_mci = models.FloatField(null=True, blank=True)
    prob_ad = models.FloatField(null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True)

    # Uncertainty (model uncertainty, NOT a clinical probability — see
    # analysis.services.uncertainty for the distinction this system enforces)
    uncertainty_score = models.FloatField(null=True, blank=True)
    uncertainty_level = models.CharField(
        max_length=10, choices=UncertaintyLevel.choices, null=True, blank=True
    )

    # Explainability artifacts (relative paths under MEDIA_ROOT; never
    # absolute filesystem paths are exposed via the API)
    gradcam_path = models.CharField(max_length=500, blank=True)
    attention_map_path = models.CharField(max_length=500, blank=True)
    report_path = models.CharField(max_length=500, blank=True)

    processing_time_ms = models.FloatField(null=True, blank=True)
    is_demo = models.BooleanField(
        default=True,
        help_text="True if produced by a demo/placeholder model rather than a real trained checkpoint.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "MRI analyses"

    def __str__(self):
        return f"Analysis {self.pk} — {self.case.case_id} — {self.get_status_display()}"
