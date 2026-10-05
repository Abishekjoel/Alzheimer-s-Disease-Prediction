from django.urls import path

from analysis.views import (
    AnalysisDetailView,
    AnalysisExplainabilityView,
    AnalysisHistoryView,
    AnalysisPredictView,
    AnalysisReportView,
    AnalysisUploadView,
    DashboardSummaryView,
    EvaluationView,
    ExperimentListView,
    ModelVersionDetailView,
    ModelVersionListView,
)

app_name = "analysis"

urlpatterns = [
    path("analysis/upload/", AnalysisUploadView.as_view(), name="upload"),
    path("analysis/predict/", AnalysisPredictView.as_view(), name="predict"),
    path("analysis/history/", AnalysisHistoryView.as_view(), name="history"),
    path("analysis/<int:pk>/", AnalysisDetailView.as_view(), name="detail"),
    path("analysis/<int:pk>/explainability/", AnalysisExplainabilityView.as_view(), name="explainability"),
    path("analysis/<int:pk>/report/", AnalysisReportView.as_view(), name="report"),
    path("models/", ModelVersionListView.as_view(), name="model-list"),
    path("models/<int:pk>/", ModelVersionDetailView.as_view(), name="model-detail"),
    path("experiments/", ExperimentListView.as_view(), name="experiment-list"),
    path("evaluation/", EvaluationView.as_view(), name="evaluation"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
]
