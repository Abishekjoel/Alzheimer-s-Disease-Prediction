from django.conf import settings
from rest_framework import serializers

from analysis.models import Experiment, MRIAnalysis, ModelVersion
from patients.models import Case


def _media_url(request, relative_path):
    if not relative_path:
        return None
    url = settings.MEDIA_URL + relative_path
    return request.build_absolute_uri(url) if request else url


class ModelVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelVersion
        fields = [
            "id", "name", "version", "cnn_architecture", "swin_architecture",
            "fusion_method", "training_dataset_info", "metrics", "is_active",
            "is_demo", "notes", "created_at",
        ]
        read_only_fields = fields


class ExperimentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experiment
        fields = [
            "id", "name", "experiment_type", "model_config", "training_config",
            "dataset_info", "metrics", "created_at",
        ]
        read_only_fields = fields


class MRIAnalysisUploadSerializer(serializers.Serializer):
    case = serializers.PrimaryKeyRelatedField(queryset=Case.objects.all())
    image = serializers.ImageField()

    def validate_image(self, value):
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if value.size > max_bytes:
            raise serializers.ValidationError(f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB} MB.")

        ext = "." + value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file extension '{ext}'. Allowed: {settings.ALLOWED_IMAGE_EXTENSIONS}."
            )

        content_type = getattr(value, "content_type", None)
        if content_type and content_type not in settings.ALLOWED_IMAGE_CONTENT_TYPES:
            raise serializers.ValidationError(f"Unsupported content type '{content_type}'.")

        return value


class CasePatientSerializer(serializers.ModelSerializer):
    """Minimal patient/case summary embedded in analysis responses — the
    "Case Summary" a Results/Report view needs, without pulling in the
    heavier analysis_count/latest_analysis fields from patients.serializers
    .CaseSerializer (which would be redundant here)."""

    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = ["id", "case_id", "full_name", "age_years", "sex", "blood_group", "weight_kg", "photo_url"]
        read_only_fields = fields

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url


class MRIAnalysisSerializer(serializers.ModelSerializer):
    case_id = serializers.CharField(source="case.case_id", read_only=True)
    case = CasePatientSerializer(read_only=True)
    model_version = ModelVersionSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    gradcam_url = serializers.SerializerMethodField()
    attention_map_url = serializers.SerializerMethodField()
    report_url = serializers.SerializerMethodField()
    probabilities = serializers.SerializerMethodField()

    class Meta:
        model = MRIAnalysis
        fields = [
            "id", "case_id", "case", "status", "error_message",
            "quality_score", "quality_is_valid", "quality_issues",
            "predicted_class", "probabilities", "confidence",
            "uncertainty_score", "uncertainty_level",
            "model_version", "is_demo", "processing_time_ms",
            "image_url", "gradcam_url", "attention_map_url", "report_url",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    def get_probabilities(self, obj):
        if obj.prob_cn is None:
            return None
        return {"CN": obj.prob_cn, "MCI": obj.prob_mci, "AD": obj.prob_ad}

    def get_gradcam_url(self, obj):
        return _media_url(self.context.get("request"), obj.gradcam_path)

    def get_attention_map_url(self, obj):
        return _media_url(self.context.get("request"), obj.attention_map_path)

    def get_report_url(self, obj):
        return _media_url(self.context.get("request"), obj.report_path)
