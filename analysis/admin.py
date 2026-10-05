from django.contrib import admin

from analysis.models import Experiment, MRIAnalysis, ModelVersion


@admin.register(ModelVersion)
class ModelVersionAdmin(admin.ModelAdmin):
    list_display = ["name", "version", "fusion_method", "is_active", "is_demo", "created_at"]
    list_filter = ["is_active", "is_demo", "fusion_method"]


@admin.register(Experiment)
class ExperimentAdmin(admin.ModelAdmin):
    list_display = ["name", "experiment_type", "created_at"]
    list_filter = ["experiment_type"]


@admin.register(MRIAnalysis)
class MRIAnalysisAdmin(admin.ModelAdmin):
    list_display = [
        "id", "case", "status", "predicted_class", "confidence",
        "uncertainty_level", "is_demo", "model_version", "created_at",
    ]
    list_filter = ["status", "predicted_class", "uncertainty_level", "is_demo"]
    readonly_fields = [f.name for f in MRIAnalysis._meta.fields]
