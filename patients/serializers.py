from rest_framework import serializers

from patients.models import Case


class LatestAnalysisSerializer(serializers.Serializer):
    """Minimal summary of a case's most recent analysis, embedded in
    CaseSerializer for the Users list/detail views. Intentionally not the
    full MRIAnalysisSerializer — this is a summary, not the explainability
    payload."""

    id = serializers.IntegerField()
    status = serializers.CharField()
    predicted_class = serializers.CharField(allow_null=True)
    confidence = serializers.FloatField(allow_null=True)
    uncertainty_level = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()


class CaseSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    analysis_count = serializers.IntegerField(source="analyses.count", read_only=True)
    photo_url = serializers.SerializerMethodField()
    latest_analysis = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = [
            "id",
            "case_id",
            "full_name",
            "age_years",
            "sex",
            "blood_group",
            "weight_kg",
            "photo",
            "photo_url",
            "notes",
            "created_by",
            "analysis_count",
            "latest_analysis",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "case_id", "created_by", "created_at", "updated_at"]
        extra_kwargs = {"photo": {"write_only": True, "required": False}}

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url

    def get_latest_analysis(self, obj):
        # MRIAnalysis.Meta.ordering = ["-created_at"], so `.first()` on the
        # related manager already returns the most recent one.
        latest = obj.analyses.first()
        if not latest:
            return None
        return LatestAnalysisSerializer(latest).data
