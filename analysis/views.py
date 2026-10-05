import logging

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.models import Experiment, MRIAnalysis, ModelVersion
from analysis.serializers import (
    ExperimentSerializer,
    MRIAnalysisSerializer,
    MRIAnalysisUploadSerializer,
    ModelVersionSerializer,
)
from analysis.services.analysis_pipeline import analyze_mri
from analysis.services.report_generator import generate_report
from ml.config import CLASS_NAMES

logger = logging.getLogger("analysis")


def _analysis_queryset_for(user):
    queryset = MRIAnalysis.objects.select_related("case", "model_version")
    if not user.is_staff:
        queryset = queryset.filter(case__created_by=user)
    return queryset


class AnalysisUploadView(APIView):
    """POST /api/analysis/upload/ — uploads an MRI image for an existing
    case and synchronously runs the full pipeline (quality check ->
    preprocessing -> hybrid model prediction -> uncertainty ->
    explainability). See analysis.services.analysis_pipeline.analyze_mri.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MRIAnalysisUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case = serializer.validated_data["case"]

        if not request.user.is_staff and case.created_by_id != request.user.id:
            return Response({"detail": "You do not have access to this case."}, status=status.HTTP_403_FORBIDDEN)

        analysis = analyze_mri(serializer.validated_data["image"], case, request.user)
        response_data = MRIAnalysisSerializer(analysis, context={"request": request}).data
        return Response(response_data, status=status.HTTP_201_CREATED)


class AnalysisPredictView(AnalysisUploadView):
    """POST /api/analysis/predict/ — currently equivalent to upload/: the
    pipeline runs synchronously so "upload" and "predict" happen in one
    request. Kept as a distinct endpoint per the API contract so upload
    and prediction can be decoupled later (e.g. behind a task queue)
    without breaking existing clients of either endpoint."""


class AnalysisDetailView(generics.RetrieveAPIView):
    serializer_class = MRIAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _analysis_queryset_for(self.request.user)


class AnalysisHistoryView(generics.ListAPIView):
    """GET /api/analysis/history/ — paginated analysis history for the
    requesting user (or all analyses for staff), newest first."""

    serializer_class = MRIAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = _analysis_queryset_for(self.request.user)
        case_id = self.request.query_params.get("case")
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset


class AnalysisExplainabilityView(APIView):
    """GET /api/analysis/<id>/explainability/ — Grad-CAM and Swin attention
    visualization URLs for a completed analysis."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        analysis = get_object_or_404(_analysis_queryset_for(request.user), pk=pk)
        if analysis.status != MRIAnalysis.Status.COMPLETED:
            return Response(
                {"detail": f"Analysis is not completed (status={analysis.status}); no explainability artifacts available."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = MRIAnalysisSerializer(analysis, context={"request": request})
        return Response({
            "predicted_class": serializer.data["predicted_class"],
            "gradcam_url": serializer.data["gradcam_url"],
            "attention_map_url": serializer.data["attention_map_url"],
        })


class AnalysisReportView(APIView):
    """GET /api/analysis/<id>/report/ — generates (if needed) and returns
    the URL to the PDF research report for a completed analysis."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        analysis = get_object_or_404(_analysis_queryset_for(request.user), pk=pk)
        if analysis.status != MRIAnalysis.Status.COMPLETED:
            return Response(
                {"detail": f"Analysis is not completed (status={analysis.status}); cannot generate a report."},
                status=status.HTTP_409_CONFLICT,
            )

        if not analysis.report_path:
            from pathlib import Path

            from django.conf import settings as dj_settings

            report_path = generate_report(analysis)
            analysis.report_path = str(Path(report_path).relative_to(dj_settings.MEDIA_ROOT)).replace("\\", "/")
            analysis.save(update_fields=["report_path"])

        serializer = MRIAnalysisSerializer(analysis, context={"request": request})
        return Response({"report_url": serializer.data["report_url"]})


class ModelVersionListView(generics.ListAPIView):
    queryset = ModelVersion.objects.all()
    serializer_class = ModelVersionSerializer
    permission_classes = [IsAuthenticated]


class ModelVersionDetailView(generics.RetrieveAPIView):
    queryset = ModelVersion.objects.all()
    serializer_class = ModelVersionSerializer
    permission_classes = [IsAuthenticated]


class ExperimentListView(generics.ListAPIView):
    queryset = Experiment.objects.all()
    serializer_class = ExperimentSerializer
    permission_classes = [IsAuthenticated]


class DashboardSummaryView(APIView):
    """GET /api/dashboard/summary/ — real aggregate counts scoped to the
    requesting user (all data for staff). Every number here is a live
    database count/query — nothing is estimated, cached, or invented. If
    there is no data yet, the counts are honestly 0 and
    class_distribution's values are 0 rather than omitted."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from patients.models import Case

        analyses = _analysis_queryset_for(request.user)
        cases = Case.objects.all() if request.user.is_staff else Case.objects.filter(created_by=request.user)

        today = timezone.localdate()
        class_distribution = {
            name: analyses.filter(status=MRIAnalysis.Status.COMPLETED, predicted_class=name).count()
            for name in CLASS_NAMES
        }

        recent_analyses = []
        for a in analyses.select_related("case").order_by("-created_at")[:5]:
            recent_analyses.append({
                "id": a.id,
                "case_id": a.case.case_id,
                "full_name": a.case.full_name,
                "age_years": a.case.age_years,
                "blood_group": a.case.blood_group,
                "predicted_class": a.predicted_class,
                "confidence": a.confidence,
                "status": a.status,
                "created_at": a.created_at,
            })

        return Response({
            "total_cases": cases.count(),
            "total_analyses": analyses.count(),
            "today_analyses": analyses.filter(created_at__date=today).count(),
            "reports_generated": analyses.exclude(report_path="").count(),
            "class_distribution": class_distribution,
            "recent_analyses": recent_analyses,
        })


class EvaluationView(APIView):
    """GET /api/evaluation/ — the active model's stored evaluation metrics
    plus a comparison table built from registered ablation Experiment
    records. Returns only metrics that were actually produced by a real
    training/evaluation run (Experiment.metrics) — never invented numbers."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        active = ModelVersion.objects.filter(is_active=True).first()
        ablation_rows = [
            {
                "experiment_type": exp.experiment_type,
                "name": exp.name,
                "metrics": exp.metrics,
                "created_at": exp.created_at,
            }
            for exp in Experiment.objects.filter(
                experiment_type__startswith="ablation_"
            ).order_by("experiment_type", "-created_at")
        ]
        return Response({
            "active_model": ModelVersionSerializer(active).data if active else None,
            "ablation_comparison": ablation_rows,
        })
